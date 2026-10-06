import { TradingViewError, toTradingViewError } from '../errors.js';
import { Emitter } from '../events.js';
import { getUser } from '../http/account.js';
import { DEFAULT_USER_AGENT, type Credentials } from '../http/request.js';
import {
  decodeFrames, encodeHeartbeat, encodePacket, type ServerHello, type ServerPacket,
} from '../protocol/framing.js';
import { wsTransport, type Transport, type TransportFactory } from './transport.js';
import { ChartSession } from '../chart/chart-session.js';
import { QuoteSession, type QuoteSessionOptions } from '../quote/quote-session.js';

/** Websocket server. `prodata` is used by paid accounts, `widgetdata` by widgets. */
export type ServerName = 'data' | 'prodata' | 'widgetdata' | (string & {});

export type DebugOption = boolean | ((...args: unknown[]) => void);

export interface ClientOptions {
  /** Account cookies. Without them, the client uses anonymous (delayed/limited) access. */
  credentials?: Credentials;
  /** Websocket auth token (`User.authToken`). Skips the account lookup done with `credentials`. */
  authToken?: string;
  /** Websocket server. Default: `data`. */
  server?: ServerName;
  /** Page used to load the account from `credentials`, e.g. `https://fr.tradingview.com/`. */
  location?: string;
  /** Extra websocket headers. */
  headers?: Record<string, string>;
  /** Logs packets: `true` uses `console.log`, a function receives the log arguments. */
  debug?: DebugOption;
  /** Custom websocket transport (proxies, tests). */
  transport?: TransportFactory;
  /** Custom `fetch` for the account lookup. */
  fetch?: typeof fetch;
  /** Time allowed to open and authenticate the connection. Default: 20 000 ms. */
  connectTimeoutMs?: number;
  /**
   * Maximum silence from the server once connected. The server sends a
   * heartbeat about every 10 seconds, so a longer silence means the network
   * was lost without a close (sleep, NAT or proxy timeout): the client then
   * fails with `CONNECTION_ERROR` and closes. `0` or `Infinity` disables it.
   * Default: 60 000 ms.
   */
  inactivityTimeoutMs?: number;
}

export interface ClientEvents {
  [event: string]: unknown[];
  /** The websocket is open. */
  open: [];
  /** The server greeting was received. */
  hello: [hello: ServerHello];
  /** The auth token was sent; queued packets are now flowing. */
  ready: [];
  /** A server heartbeat was received (the client answers automatically). */
  heartbeat: [id: number];
  /** A packet not addressed to any session of this client. */
  packet: [packet: ServerPacket];
  /** The websocket closed. */
  close: [code?: number, reason?: string];
  error: [error: TradingViewError];
}

/** @internal Implemented by chart, replay and quote sessions. */
export interface SessionHandler {
  onPacket(packet: ServerPacket): void;
  /** `expected` is true when the connection was closed with `client.close()`. */
  onClose?(error: TradingViewError, expected: boolean): void;
}

/**
 * One websocket connection to TradingView. Chart and quote sessions are
 * multiplexed over it.
 *
 * The connection opens immediately; packets are queued until it is open and
 * authenticated. Always call `close()` when you are done.
 */
export class TradingViewClient extends Emitter<ClientEvents> {
  readonly #transport: Transport;

  readonly #sessions = new Map<string, SessionHandler>();

  readonly #queue: string[] = [];

  readonly #log?: (...args: unknown[]) => void;

  readonly ready: Promise<void>;

  #authenticated = false;

  #authToken?: string;

  readonly #authController = new AbortController();

  #closed = false;

  #closing = false;

  #closeRequested = false;

  #failure?: TradingViewError;

  #hello?: ServerHello;

  #resolveReady!: () => void;

  #rejectReady!: (error: TradingViewError) => void;

  #readyTimer?: ReturnType<typeof setTimeout>;

  #closeWaiters: Array<() => void> = [];

  readonly #inactivityTimeout: number;

  #inactivityTimer?: ReturnType<typeof setTimeout>;

  #lastActivity = 0;

  constructor(options: ClientOptions = {}) {
    super();
    if (options.debug === true) this.#log = (...args) => console.log('[tradingview]', ...args);
    else if (typeof options.debug === 'function') this.#log = options.debug;

    this.ready = new Promise<void>((resolve, reject) => {
      this.#resolveReady = resolve;
      this.#rejectReady = reject;
    });
    this.ready.catch(() => { /* Surfaced through the error event too. */ });

    this.#inactivityTimeout = options.inactivityTimeoutMs ?? 60_000;
    const timeout = options.connectTimeoutMs ?? 20_000;
    this.#readyTimer = setTimeout(() => {
      this.#fail(new TradingViewError('TIMEOUT', `Connection not ready after ${timeout} ms`));
    }, timeout);

    const server = options.server ?? 'data';
    const factory = options.transport ?? wsTransport;
    this.#transport = factory({
      url: `wss://${server}.tradingview.com/socket.io/websocket?from=chart&type=chart`,
      origin: 'https://www.tradingview.com',
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        ...options.headers,
      },
    }, {
      onOpen: () => this.#onOpen(),
      onMessage: (data) => this.#onMessage(data),
      onClose: (code, reason) => this.#onClose(code, reason),
      onError: (error) => {
        if (this.#closing) return;
        this.#fail(new TradingViewError('CONNECTION_ERROR', `WebSocket error: ${error.message}`, { cause: error }));
      },
    });

    if (options.authToken) {
      this.#authToken = options.authToken;
    } else if (options.credentials?.session) {
      getUser(options.credentials, { location: options.location, fetch: options.fetch, signal: this.#authController.signal })
        .then((user) => {
          if (this.#closed || this.#closing) return;
          this.#authToken = user.authToken;
          this.#authenticate();
        })
        .catch((error) => {
          if (this.#closed || this.#closing) return;
          this.#fail(new TradingViewError('AUTH_ERROR', `Credentials error: ${toTradingViewError(error).message}`, {
            cause: error,
          }));
        });
    } else {
      this.#authToken = 'unauthorized_user_token';
    }
  }

  /** True while the websocket is open. */
  get isOpen(): boolean {
    return !this.#closed && this.#transport.isOpen;
  }

  /** True once the auth token has been sent. */
  get isAuthenticated(): boolean {
    return this.#authenticated;
  }

  /** True after `close()` or a disconnection. */
  get isClosed(): boolean {
    return this.#closed;
  }

  /** Server greeting, once received. */
  get serverInfo(): ServerHello | undefined {
    return this.#hello;
  }

  /** Creates a chart session on this connection. */
  createChart(): ChartSession {
    return new ChartSession(this);
  }

  /** Creates a quote session on this connection. */
  createQuoteSession(options: QuoteSessionOptions = {}): QuoteSession {
    return new QuoteSession(this, options);
  }

  /**
   * Sends a raw packet. Packets are queued until the connection is ready.
   * Prefer session methods; this is an escape hatch for unsupported commands.
   */
  send(method: string, params: readonly unknown[] = []): void {
    if (this.#closed) {
      throw new TradingViewError('INVALID_STATE', `Cannot send '${method}': the client is closed`);
    }
    this.#queue.push(encodePacket(method, params));
    this.#flush();
  }

  /** @internal Registers a session to receive its packets. */
  registerSession(id: string, handler: SessionHandler): void {
    this.#sessions.set(id, handler);
  }

  /** @internal */
  unregisterSession(id: string): void {
    this.#sessions.delete(id);
  }

  /** @internal Debug logger shared with sessions. */
  log(...args: unknown[]): void {
    this.#log?.(...args);
  }

  /** Closes the connection. Resolves once the websocket is closed. Idempotent. */
  close(): Promise<void> {
    if (this.#closed) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.#closeWaiters.push(resolve);
      this.#closeRequested = true;
      if (this.#closing) return;
      this.#closing = true;
      this.#authController.abort();
      // Do not hang if the server never acknowledges the close.
      setTimeout(() => this.#forceClose(1000, 'Close timeout'), 3_000).unref?.();
      this.#transport.close();
    });
  }

  #onOpen(): void {
    this.#log?.('open');
    this.emit('open');
    this.#lastActivity = Date.now();
    this.#watchInactivity(this.#inactivityTimeout);
    this.#authenticate();
  }

  #watchInactivity(delay: number): void {
    if (!(this.#inactivityTimeout > 0 && Number.isFinite(this.#inactivityTimeout)) || this.#closed) return;
    // Longer timer delays overflow and fire at once.
    this.#inactivityTimer = setTimeout(() => {
      const idle = Date.now() - this.#lastActivity;
      if (idle < this.#inactivityTimeout) {
        this.#watchInactivity(this.#inactivityTimeout - idle);
        return;
      }
      this.#fail(new TradingViewError('CONNECTION_ERROR', `No data from the server for ${idle} ms`), true);
    }, Math.min(delay, 2 ** 31 - 1));
    this.#inactivityTimer.unref?.();
  }

  #authenticate(): void {
    if (this.#authenticated || !this.#authToken || !this.#transport.isOpen || this.#closing) return;
    this.#transport.send(encodePacket('set_auth_token', [this.#authToken]));
    this.#authenticated = true;
    clearTimeout(this.#readyTimer);
    this.#resolveReady();
    this.emit('ready');
    this.#flush();
  }

  #flush(): void {
    while (this.#authenticated && this.#transport.isOpen && this.#queue.length > 0) {
      const packet = this.#queue.shift() as string;
      this.#log?.('send', packet);
      this.#transport.send(packet);
    }
  }

  #onMessage(data: string): void {
    if (this.#closed) return;
    this.#lastActivity = Date.now();
    for (const frame of decodeFrames(data)) {
      if (frame.type === 'heartbeat') {
        if (this.#transport.isOpen) this.#transport.send(encodeHeartbeat(frame.id));
        this.emit('heartbeat', frame.id);
        continue;
      }
      if (frame.type === 'invalid') {
        this.#log?.('invalid frame', frame.raw);
        continue;
      }
      if (frame.type === 'data') {
        this.#log?.('data', frame.data);
        const hello = frame.data as ServerHello;
        if (hello && typeof hello === 'object' && 'session_id' in hello) {
          this.#hello = hello;
          this.emit('hello', hello);
        }
        continue;
      }

      const { packet } = frame;
      this.#log?.('packet', packet);
      if (packet.m === 'protocol_error') {
        this.emit('error', new TradingViewError('PROTOCOL_ERROR', `Protocol error: ${String(packet.p[0] ?? '')}`, {
          details: packet.p,
        }));
        this.#transport.close();
        continue;
      }

      const sessionId = packet.p[0];
      const session = typeof sessionId === 'string' ? this.#sessions.get(sessionId) : undefined;
      if (session) session.onPacket(packet);
      else this.emit('packet', packet);
    }
  }

  /** `unresponsive`: the peer would never complete a closing handshake. */
  #fail(error: TradingViewError, unresponsive = false): void {
    if (this.#closed) return;
    clearTimeout(this.#readyTimer);
    const wasReady = this.#authenticated;
    this.#failure ??= error;
    this.#rejectReady(error);
    // Before readiness, `ready` rejects with this error: only notify explicit listeners.
    if (wasReady || this.hasListeners('error')) this.emit('error', error);
    if (!wasReady || error.code === 'AUTH_ERROR' || error.code === 'CONNECTION_ERROR') {
      this.#closing = true;
      this.#authController.abort();
      if (unresponsive && this.#transport.terminate) this.#transport.terminate();
      else this.#transport.close();
      // Some transports never emit close after a failed handshake.
      setTimeout(() => this.#forceClose(undefined, error.message), 3_000).unref?.();
    }
  }

  /** Ends a connection whose transport did not report its close in time. */
  #forceClose(code?: number, reason?: string): void {
    if (this.#closed) return;
    // Releases the socket now instead of after the transport's own close timeout.
    this.#transport.terminate?.();
    this.#onClose(code, reason);
  }

  #onClose(code?: number, reason?: string): void {
    if (this.#closed) return;
    this.#closed = true;
    this.#authController.abort();
    this.#authenticated = false;
    clearTimeout(this.#readyTimer);
    clearTimeout(this.#inactivityTimer);
    this.#log?.('close', code, reason);

    const cause = this.#failure;
    const why = cause?.message ?? reason;
    const error = new TradingViewError('DISCONNECTED', `Connection closed${why ? `: ${why}` : ''}`, {
      details: { code, reason },
      cause,
    });
    this.#rejectReady(error);
    for (const session of [...this.#sessions.values()]) session.onClose?.(error, this.#closeRequested);
    this.#sessions.clear();
    this.#queue.length = 0;

    this.emit('close', code, reason);
    for (const resolve of this.#closeWaiters.splice(0)) resolve();
  }
}
