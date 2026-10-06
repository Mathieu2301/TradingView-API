import { Buffer } from 'node:buffer';
import {
  Agent as HttpAgent, request as httpRequest, type ClientRequestArgs, type IncomingMessage, type RequestOptions,
} from 'node:http';
import { Agent as HttpsAgent, request as httpsRequest } from 'node:https';
import type { Socket } from 'node:net';
import type { Duplex } from 'node:stream';
import { connect as tlsConnect, type ConnectionOptions } from 'node:tls';
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib';

import { TradingViewError } from '../errors.js';
import {
  createWsTransport, wsTransportWith, type HttpAgentLike, type TransportFactory,
} from './transport.js';

/** Subset of Node `tls.ConnectionOptions`; other Node TLS options are passed through. */
export interface ProxyTlsOptions {
  /** Extra trusted certificate authorities (PEM). */
  ca?: string | Uint8Array | Array<string | Uint8Array>;
  rejectUnauthorized?: boolean;
  [option: string]: unknown;
}

export interface ProxyOptions {
  /**
   * TLS options for TradingView connections made through the tunnel, and for
   * the proxy itself when it uses `https:`. Use `ca` to trust an inspecting
   * corporate proxy.
   */
  tls?: ProxyTlsOptions;
  /** Time allowed for the proxy to open a tunnel. Default: 20 000 ms. */
  connectTimeoutMs?: number;
}

/** `fetch` and websocket transport that both go through the same proxy. */
export interface ProxyAdapter {
  /** Pass as the `fetch` option of HTTP functions, the client or the data API. */
  fetch: typeof fetch;
  /** Pass as the `transport` option of the client or the data API `clientOptions`. */
  transport: TransportFactory;
}

type ConnectionCallback = (error: Error | null, socket?: Socket) => void;

function proxyUrl(proxy: string | URL): URL {
  let url: URL;
  try {
    url = new URL(proxy);
  } catch {
    throw new TradingViewError('INVALID_ARGUMENT', 'Invalid proxy URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TradingViewError(
      'INVALID_ARGUMENT',
      `Unsupported proxy protocol "${url.protocol}": use an http(s) proxy URL or pass an Agent (e.g. for SOCKS)`,
    );
  }
  return url;
}

function proxyAuthorization(proxy: URL): string | undefined {
  if (!proxy.username && !proxy.password) return undefined;
  const user = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
  return `Basic ${Buffer.from(user).toString('base64')}`;
}

/** Opens an HTTP CONNECT tunnel. Errors never include the proxy credentials. */
function openTunnel(proxy: URL, target: string, options: ProxyOptions, callback: ConnectionCallback): void {
  const secure = proxy.protocol === 'https:';
  const authorization = proxyAuthorization(proxy);
  const connectOptions: RequestOptions & ConnectionOptions = {
    ...(secure ? options.tls as ConnectionOptions : {}),
    host: proxy.hostname.replace(/^\[|\]$/g, ''),
    port: Number(proxy.port) || (secure ? 443 : 80),
    method: 'CONNECT',
    path: target,
    agent: false,
    headers: { host: target, ...(authorization ? { 'proxy-authorization': authorization } : {}) },
  };
  const timeout = options.connectTimeoutMs ?? 20_000;
  let done = false;
  const finish = (error: Error | null, socket?: Socket) => {
    if (done) {
      socket?.destroy();
      return;
    }
    done = true;
    callback(error, socket);
  };

  const connect = (secure ? httpsRequest : httpRequest)(connectOptions);
  connect.setTimeout(timeout, () => {
    connect.destroy(new TradingViewError('TIMEOUT', `Proxy ${proxy.host} did not open a tunnel to ${target} in ${timeout} ms`));
  });
  connect.once('connect', (response: IncomingMessage, socket: Socket) => {
    connect.setTimeout(0);
    if (response.statusCode !== 200) {
      socket.destroy();
      finish(new TradingViewError(
        'CONNECTION_ERROR',
        `Proxy ${proxy.host} refused a tunnel to ${target} (HTTP ${response.statusCode})`,
        { details: { status: response.statusCode } },
      ));
      return;
    }
    finish(null, socket);
  });
  connect.once('error', (error) => {
    finish(error instanceof TradingViewError ? error : new TradingViewError(
      'CONNECTION_ERROR',
      `Proxy ${proxy.host} is unreachable: ${error.message}`,
      { cause: error },
    ));
  });
  connect.end();
}

function tunnelTarget(options: ClientRequestArgs, defaultPort: number): { host: string; target: string } {
  const host = String(options.hostname ?? options.host ?? 'localhost');
  const port = Number(options.port) || defaultPort;
  return { host, target: `${host.includes(':') ? `[${host}]` : host}:${port}` };
}

type AgentCallback = (error: Error | null, stream: Duplex) => void;

function connectionCallback(callback?: AgentCallback): ConnectionCallback {
  return (error, socket) => callback?.(error, socket as Duplex);
}

/** Agent for `http:`/`ws:` targets: a CONNECT tunnel, then the raw socket. */
class HttpTunnelAgent extends HttpAgent {
  readonly #proxy: URL;

  readonly #settings: ProxyOptions;

  constructor(proxy: URL, settings: ProxyOptions) {
    super({ keepAlive: false });
    this.#proxy = proxy;
    this.#settings = settings;
  }

  override createConnection(options: ClientRequestArgs, callback?: AgentCallback): undefined {
    openTunnel(this.#proxy, tunnelTarget(options, 80).target, this.#settings, connectionCallback(callback));
    return undefined;
  }
}

/** Agent for `https:`/`wss:` targets: a CONNECT tunnel, then TLS to the target. */
class HttpsTunnelAgent extends HttpsAgent {
  readonly #proxy: URL;

  readonly #settings: ProxyOptions;

  constructor(proxy: URL, settings: ProxyOptions) {
    super({ keepAlive: false });
    this.#proxy = proxy;
    this.#settings = settings;
  }

  override createConnection(options: ClientRequestArgs & { servername?: string }, callback?: AgentCallback): undefined {
    const done = connectionCallback(callback);
    const { host, target } = tunnelTarget(options, 443);
    openTunnel(this.#proxy, target, this.#settings, (error, socket) => {
      if (error || !socket) {
        done(error ?? new Error('No tunnel socket'));
        return;
      }
      const servername = options.servername || (host.includes(':') ? undefined : host);
      done(null, tlsConnect({ ...this.#settings.tls as ConnectionOptions, socket, servername }));
    });
    return undefined;
  }
}

const REDIRECTS = new Set([301, 302, 303, 307, 308]);
const NULL_BODY = new Set([101, 103, 204, 205, 304]);

function decodeBody(body: Buffer, encoding: string | null): Buffer {
  switch (encoding?.trim().toLowerCase()) {
    case 'gzip':
    case 'x-gzip':
      return gunzipSync(body);
    case 'deflate':
      return inflateSync(body);
    case 'br':
      return brotliDecompressSync(body);
    default:
      return body;
  }
}

function abortError(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('This operation was aborted', 'AbortError');
}

interface RawResponse {
  status: number;
  statusText: string;
  headers: Headers;
  body: Buffer;
}

function send(url: URL, method: string, headers: Headers, body: Buffer | undefined, agent: HttpAgent,
  signal: AbortSignal | null): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError(signal));
      return;
    }
    const outgoing: Record<string, string> = {};
    headers.forEach((value, key) => { outgoing[key] = value; });
    outgoing['accept-encoding'] ??= 'gzip, deflate, br';
    if (body) outgoing['content-length'] = String(body.length);

    const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, { method, headers: outgoing, agent });
    const onAbort = () => request.destroy(abortError(signal as AbortSignal) as Error);
    signal?.addEventListener('abort', onAbort, { once: true });
    const cleanup = () => signal?.removeEventListener('abort', onAbort);

    request.once('error', (error) => {
      cleanup();
      reject(error);
    });
    request.once('response', (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.once('error', (error) => {
        cleanup();
        reject(error);
      });
      response.once('end', () => {
        cleanup();
        const responseHeaders = new Headers();
        for (let i = 0; i < response.rawHeaders.length; i += 2) {
          responseHeaders.append(response.rawHeaders[i], response.rawHeaders[i + 1]);
        }
        try {
          let decoded: Buffer = Buffer.concat(chunks);
          if (method !== 'HEAD' && responseHeaders.has('content-encoding')) {
            decoded = decodeBody(decoded, responseHeaders.get('content-encoding'));
            responseHeaders.delete('content-encoding');
            responseHeaders.delete('content-length');
          }
          resolve({
            status: response.statusCode ?? 0,
            statusText: response.statusMessage ?? '',
            headers: responseHeaders,
            body: decoded,
          });
        } catch (error) {
          reject(error);
        }
      });
    });
    request.end(body);
  });
}

/** `fetch` built on `node:http(s)` so requests can use an `Agent` (proxy tunnels). */
function agentFetch(agentFor: (url: URL) => HttpAgent): typeof fetch {
  return async (input, init) => {
    const initial = new Request(input, init);
    let url = new URL(initial.url);
    let method = initial.method;
    const headers = new Headers(initial.headers);
    let body = initial.body ? Buffer.from(await initial.arrayBuffer()) : undefined;

    for (let redirects = 0; ; redirects += 1) {
      const raw = await send(url, method, headers, body, agentFor(url), initial.signal);
      const location = raw.headers.get('location');
      if (initial.redirect !== 'manual' && REDIRECTS.has(raw.status) && location) {
        if (initial.redirect === 'error') throw new TypeError(`Unexpected redirect from ${url.origin}`);
        if (redirects >= 20) throw new TypeError('Too many redirects');
        const next = new URL(location, url);
        if (raw.status === 303 || ((raw.status === 301 || raw.status === 302) && method === 'POST')) {
          if (method !== 'HEAD') method = 'GET';
          body = undefined;
          for (const name of ['content-type', 'content-length', 'content-encoding', 'content-language', 'content-location']) {
            headers.delete(name);
          }
        }
        if (next.origin !== url.origin) {
          for (const name of ['authorization', 'cookie', 'proxy-authorization', 'host']) headers.delete(name);
        }
        url = next;
        continue;
      }

      const response = new Response(NULL_BODY.has(raw.status) || method === 'HEAD' ? null : new Uint8Array(raw.body), {
        status: raw.status, statusText: raw.statusText, headers: raw.headers,
      });
      Object.defineProperty(response, 'url', { value: url.toString() });
      Object.defineProperty(response, 'redirected', { value: redirects > 0 });
      return response;
    }
  };
}

function isAgent(value: unknown): value is HttpAgentLike {
  return typeof value === 'object' && value !== null && !(value instanceof URL);
}

/** Oldest Bun whose `WebSocket` honours the `proxy` option (older ones silently connect directly). */
const BUN_MIN_PROXY_VERSION = [1, 3, 6];

function bunVersion(): number[] | undefined {
  const version = (globalThis as { Bun?: { version?: string } }).Bun?.version;
  return version ? version.split(/[.-]/).slice(0, 3).map(Number) : undefined;
}

/** Bun ignores Node agents: use its native `proxy` option for `fetch` and `WebSocket`. */
function bunProxy(proxy: string | URL | HttpAgentLike, options: ProxyOptions, version: number[]): ProxyAdapter {
  if (isAgent(proxy)) {
    throw new TradingViewError('INVALID_ARGUMENT', 'Bun ignores Node agents: pass the proxy URL instead');
  }
  const parsed = proxyUrl(proxy);
  const url = parsed.toString();
  const supported = BUN_MIN_PROXY_VERSION.findIndex((part, i) => version[i] !== part);
  if (supported !== -1 && version[supported] < BUN_MIN_PROXY_VERSION[supported]) {
    throw new TradingViewError(
      'INVALID_STATE',
      `Bun ${version.join('.')} cannot proxy websockets: Bun ${BUN_MIN_PROXY_VERSION.join('.')} or later is required`,
    );
  }
  const tls = options.tls ? { tls: options.tls } : {};
  const nativeFetch = globalThis.fetch;
  return {
    fetch: (async (input, init) => {
      const response = await nativeFetch(input, { ...init, proxy: url, ...tls } as unknown as RequestInit);
      // Plain-HTTP targets are forwarded, not tunnelled: surface a refusal like a failed tunnel.
      if (response.status === 407) {
        await response.body?.cancel();
        throw new TradingViewError('CONNECTION_ERROR', `Proxy ${parsed.host} refused the request (HTTP 407)`, {
          details: { status: 407 },
        });
      }
      return response;
    }) as typeof fetch,
    transport: wsTransportWith(() => ({ proxy: url, ...tls })),
  };
}

/**
 * Routes HTTP requests and websockets through a proxy. Pass the result where a
 * `fetch` or `transport` is accepted:
 *
 * ```ts
 * const proxy = createProxy('http://user:password@proxy.local:3128');
 * const client = new TradingViewClient({ ...proxy, credentials });
 * await getCandles({ symbol: 'BINANCE:BTCUSDT', clientOptions: proxy });
 * await searchMarkets('BTC', { fetch: proxy.fetch });
 * ```
 *
 * A URL creates a built-in HTTP CONNECT tunnel (`http:` or `https:` proxy,
 * optional basic auth from the URL). On Node, any other `Agent` (for example
 * from `socks-proxy-agent`) is used as-is for both paths. On Bun (1.3.6+),
 * the URL is passed to Bun's native `proxy` support.
 */
export function createProxy(proxy: string | URL | HttpAgentLike, options: ProxyOptions = {}): ProxyAdapter {
  const bun = bunVersion();
  if (bun) return bunProxy(proxy, options, bun);

  let agentFor: (url: URL) => HttpAgent;
  if (isAgent(proxy)) {
    agentFor = () => proxy as HttpAgent;
  } else {
    const url = proxyUrl(proxy);
    const http = new HttpTunnelAgent(url, options);
    const https = new HttpsTunnelAgent(url, options);
    agentFor = (target) => (target.protocol === 'https:' || target.protocol === 'wss:' ? https : http);
  }
  return {
    fetch: agentFetch(agentFor),
    transport: createWsTransport({ agent: (url) => agentFor(new URL(url)) }),
  };
}
