import { TradingViewClient, type ClientOptions } from '../client/client.js';
import { TradingViewError, toTradingViewError } from '../errors.js';
import type { Credentials } from '../http/request.js';

/** How high-level functions connect to TradingView. */
export interface ConnectionOptions {
  /**
   * Reuse an existing connection. It is left open afterwards; only the
   * sessions created by the call are removed. Without it, each call opens and
   * closes its own connection.
   */
  client?: TradingViewClient;
  /** Account cookies, for data your account can access. Ignored with `client`. */
  credentials?: Credentials;
  /** Other options for the connection opened by the call. Ignored with `client`. */
  clientOptions?: Omit<ClientOptions, 'credentials'>;
}

export interface OperationOptions extends ConnectionOptions {
  /**
   * Maximum wait in milliseconds. One-shot functions: for the whole call.
   * Watchers: until the first data. Default: 15 000.
   */
  timeoutMs?: number;
  /** Cancels the call (and stops a watcher). */
  signal?: AbortSignal;
}

export const DEFAULT_TIMEOUT_MS = 15_000;

function abortError(signal: AbortSignal): TradingViewError {
  const { reason } = signal;
  const message = reason instanceof Error ? reason.message : reason ? String(reason) : 'Aborted';
  return new TradingViewError('ABORTED', message, { cause: reason });
}

export function validateTimeout(timeoutMs: number | undefined): number {
  const value = timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(value) || value <= 0) {
    throw new TradingViewError('INVALID_ARGUMENT', 'timeoutMs must be a positive number');
  }
  return value;
}

export function validateSymbol(symbol: unknown): string {
  if (typeof symbol !== 'string' || !symbol.trim()) {
    throw new TradingViewError('INVALID_ARGUMENT', 'symbol is required');
  }
  return symbol.trim();
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortError(signal);
}

interface Connection {
  client: TradingViewClient;
  release(): Promise<void>;
}

function connect(options: ConnectionOptions): Connection {
  if (options.client) {
    if (options.client.isClosed) throw new TradingViewError('INVALID_STATE', 'The provided client is closed');
    return { client: options.client, release: async () => {} };
  }
  const client = new TradingViewClient({ ...options.clientOptions, credentials: options.credentials });
  return { client, release: () => client.close() };
}

export interface OperationContext<T> {
  client: TradingViewClient;
  resolve(value: T): void;
  reject(error: unknown): void;
}

type Cleanup = (() => void) | void;

/**
 * Runs a one-shot operation with timeout, abort and guaranteed cleanup:
 * sessions are removed and an owned connection is closed before settling.
 */
export function runOperation<T>(
  options: OperationOptions,
  description: string,
  start: (context: OperationContext<T>) => Cleanup,
): Promise<T> {
  let timeoutMs: number;
  let connection: Connection;
  try {
    timeoutMs = validateTimeout(options.timeoutMs);
    throwIfAborted(options.signal);
    connection = connect(options);
  } catch (error) {
    return Promise.reject(toTradingViewError(error, 'INVALID_ARGUMENT'));
  }

  const { client } = connection;
  const { signal } = options;

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    let cleanup: Cleanup;
    const unsubscribers: Array<() => void> = [];

    const finish = (error: TradingViewError | undefined, value?: T) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      for (const off of unsubscribers) off();
      try {
        cleanup?.();
      } catch {
        // Cleanup must never hide the result.
      }
      connection.release().catch(() => {}).then(() => {
        if (error) reject(error);
        else resolve(value as T);
      });
    };

    const onAbort = () => finish(abortError(signal as AbortSignal));
    const timer = setTimeout(() => {
      finish(new TradingViewError('TIMEOUT', `${description} timed out after ${timeoutMs} ms`));
    }, timeoutMs);

    signal?.addEventListener('abort', onAbort, { once: true });
    unsubscribers.push(
      client.on('error', (error) => finish(error)),
      client.on('close', () => finish(new TradingViewError('DISCONNECTED', `Connection closed during ${description}`))),
    );

    try {
      cleanup = start({
        client,
        resolve: (value) => finish(undefined, value),
        reject: (error) => finish(toTradingViewError(error)),
      });
    } catch (error) {
      finish(toTradingViewError(error, 'INVALID_ARGUMENT'));
    }
  });
}

/** A running watcher. */
export interface Watcher {
  /** Stops the watcher and releases its sessions/connection. Idempotent. */
  stop(): Promise<void>;
  /** Resolves when the watcher has stopped (after `stop()`, abort or a fatal error). */
  readonly closed: Promise<void>;
  /** True until the watcher stops. */
  readonly isActive: boolean;
}

export interface WatchHandlers {
  /** Errors after start-up. Fatal errors also stop the watcher. */
  onError?(error: TradingViewError): void;
}

export interface WatchContext {
  client: TradingViewClient;
  /** Marks the watcher as started (resolves the start promise). */
  ready(): void;
  /** Before start-up: rejects. After: reports to `onError` and stops. */
  fail(error: unknown): void;
  /** Reports a non-fatal error to `onError`. */
  warn(error: unknown): void;
  isActive(): boolean;
}

/**
 * Starts a watcher. The returned promise resolves once `ready()` is called
 * and rejects on timeout, abort or failure before that.
 */
export function startWatcher<W extends Watcher>(
  options: OperationOptions,
  description: string,
  handlers: WatchHandlers,
  start: (context: WatchContext) => Cleanup,
  build: (base: Watcher) => W,
): Promise<W> {
  let timeoutMs: number;
  let connection: Connection;
  try {
    timeoutMs = validateTimeout(options.timeoutMs);
    throwIfAborted(options.signal);
    connection = connect(options);
  } catch (error) {
    return Promise.reject(toTradingViewError(error, 'INVALID_ARGUMENT'));
  }

  const { client } = connection;
  const { signal } = options;

  let active = true;
  let started = false;
  let cleanup: Cleanup;
  let stopPromise: Promise<void> | undefined;
  let resolveClosed!: () => void;
  const closed = new Promise<void>((resolve) => { resolveClosed = resolve; });
  const unsubscribers: Array<() => void> = [];
  let resolveStart!: (watcher: W) => void;
  let rejectStart!: (error: TradingViewError) => void;
  const startPromise = new Promise<W>((resolve, reject) => {
    resolveStart = resolve;
    rejectStart = reject;
  });

  const report = (error: TradingViewError) => {
    try {
      handlers.onError?.(error);
    } catch (listenerError) {
      console.error('[tradingview] onError callback threw:', listenerError);
    }
  };

  const stop = (): Promise<void> => {
    if (stopPromise) return stopPromise;
    active = false;
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
    for (const off of unsubscribers) off();
    try {
      cleanup?.();
    } catch {
      // Ignore cleanup failures.
    }
    stopPromise = connection.release().catch(() => {}).then(() => resolveClosed());
    return stopPromise;
  };

  const fail = (raw: unknown) => {
    if (!active) return;
    const error = toTradingViewError(raw);
    const closing = stop();
    if (!started) closing.then(() => rejectStart(error));
    else report(error);
  };

  const watcher = build({
    stop,
    closed,
    get isActive() {
      return active;
    },
  });

  const onAbort = () => fail(abortError(signal as AbortSignal));
  const timer = setTimeout(() => {
    if (!started) fail(new TradingViewError('TIMEOUT', `${description} timed out after ${timeoutMs} ms`));
  }, timeoutMs);

  signal?.addEventListener('abort', onAbort, { once: true });
  unsubscribers.push(
    client.on('error', (error) => fail(error)),
    client.on('close', () => fail(new TradingViewError('DISCONNECTED', `Connection closed during ${description}`))),
  );

  try {
    cleanup = start({
      client,
      ready: () => {
        if (!active || started) return;
        started = true;
        clearTimeout(timer);
        resolveStart(watcher);
      },
      fail,
      warn: (error) => {
        if (active) report(toTradingViewError(error));
      },
      isActive: () => active,
    });
  } catch (error) {
    fail(error);
  }

  return startPromise;
}

/** Converts a Date or Unix time (seconds) into Unix seconds. */
export function toUnixSeconds(value: number | Date | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  const seconds = value instanceof Date ? Math.floor(value.getTime() / 1000) : value;
  if (!Number.isFinite(seconds)) throw new TradingViewError('INVALID_ARGUMENT', `${name} must be a Date or Unix seconds`);
  return seconds;
}
