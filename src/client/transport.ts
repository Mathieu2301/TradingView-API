import WebSocket from 'ws';

/** Callbacks a transport must call. */
export interface TransportHandlers {
  onOpen(): void;
  onMessage(data: string): void;
  onClose(code?: number, reason?: string): void;
  onError(error: Error): void;
}

/** Minimal websocket abstraction used by `TradingViewClient`. */
export interface Transport {
  /** True when the connection is open and can send. */
  readonly isOpen: boolean;
  send(data: string): void;
  /** Starts a graceful close. `onClose` must be called once closed. */
  close(): void;
  /** Destroys the connection without a closing handshake (unresponsive peer). */
  terminate?(): void;
}

export interface TransportRequest {
  url: string;
  origin: string;
  headers: Record<string, string>;
}

/**
 * Creates a transport. The default uses the `ws` package (Node and Bun).
 * Provide your own to use another websocket library or a test double; see
 * `createProxy` for proxies.
 */
export type TransportFactory = (request: TransportRequest, handlers: TransportHandlers) => Transport;

function toText(data: WebSocket.RawData): string {
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf8');
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8');
  return data.toString('utf8');
}

/** A Node `http.Agent` (typed structurally so declarations do not need `@types/node`). */
export interface HttpAgentLike {
  destroy(): void;
}

export interface WsTransportOptions {
  /** Node `Agent` used for the handshake, e.g. a proxy agent. May depend on the websocket URL. */
  agent?: HttpAgentLike | ((url: string) => HttpAgentLike);
}

/** Creates a transport based on the `ws` package. */
export function createWsTransport(options: WsTransportOptions = {}): TransportFactory {
  return wsTransportWith((url) => {
    const agent = typeof options.agent === 'function' ? options.agent(url) : options.agent;
    return agent ? { agent } : {};
  });
}

/** @internal */
export function wsTransportWith(extra: (url: string) => Record<string, unknown>): TransportFactory {
  // Extra `ws` client options; Bun's built-in `ws` also reads `proxy` and `tls`.
  return (request, handlers) => {
    // Bun's `ws` implementation ignores the `origin` option: also send it as a header.
    const socket = new WebSocket(request.url, {
      ...extra(request.url),
      origin: request.origin,
      headers: { Origin: request.origin, ...request.headers },
    } as WebSocket.ClientOptions);
    socket.on('open', () => handlers.onOpen());
    socket.on('message', (data) => handlers.onMessage(toText(data)));
    socket.on('close', (code, reason) => handlers.onClose(code, reason.toString()));
    socket.on('error', (error) => handlers.onError(error));

    return {
      get isOpen() {
        return socket.readyState === WebSocket.OPEN;
      },
      send(data) {
        socket.send(data);
      },
      close() {
        if (socket.readyState === WebSocket.CLOSED) return;
        if (socket.readyState === WebSocket.CONNECTING) socket.terminate();
        else socket.close();
      },
      terminate() {
        if (socket.readyState !== WebSocket.CLOSED) socket.terminate();
      },
    };
>>>>>>> 40d00b9 (Add createProxy for HTTP and WebSocket proxy support)
  };
}

/** Default transport based on the `ws` package. */
export const wsTransport: TransportFactory = wsTransportWith(() => ({}));
