/**
 * Agent-friendly market data API.
 * https://github.com/Mathieu2301/TradingView-API
 * https://www.npmjs.com/package/@mathieuc/tradingview
 */

export interface Candle {
  /** Unix timestamp in seconds. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleQuery {
  /** Exchange-qualified symbol, for example BINANCE:BTCUSDT. */
  symbol: string;
  /** TradingView resolution, for example 1, 60, D or W. */
  timeframe?: string;
  /** Requested number of historical candles; the source may return fewer. */
  limit?: number;
  /** Maximum wait for the first usable snapshot. Default: 15 seconds. */
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface CandleWorker {
  /** Most recent immutable snapshot, oldest candle first. */
  readonly latest: readonly Candle[];
  /** Idempotently release the chart session and connection. */
  stop(): Promise<void>;
}

export interface CandleHandlers {
  onData(candles: readonly Candle[]): void;
  onError?(error: Error): void;
}

/** Adapter contract for future sources; no TradingView dependency in callers. */
export interface MarketDataProvider {
  watchCandles(query: CandleQuery, handlers: CandleHandlers): Promise<CandleWorker>;
}

interface LegacyBar {
  time: number;
  open: number;
  max: number;
  min: number;
  close: number;
  volume: number;
}

interface LegacyChart {
  readonly periods: ReadonlyArray<LegacyBar>;
  setMarket(symbol: string, options: { timeframe?: string; range?: number }): void;
  onSymbolLoaded(callback: () => void): void;
  onUpdate(callback: () => void): void;
  onError(callback: (...messages: unknown[]) => void): void;
  delete(): void;
}

interface LegacyClient {
  Session: { Chart: new () => LegacyChart };
  onDisconnected(callback: () => void): void;
  onError(callback: (...messages: unknown[]) => void): void;
  end(): Promise<void>;
}

export interface TradingViewProviderOptions {
  /** Passed to the historical Client; credentials stay in the caller's environment. */
  clientOptions?: { token?: string; signature?: string; server?: 'data' | 'prodata' | 'widgetdata' };
  /** Useful for custom transports and isolated tests. */
  clientFactory?: (options: TradingViewProviderOptions['clientOptions']) => LegacyClient;
}

function asError(messages: unknown[]): Error {
  return new Error(messages.map((value) => (value instanceof Error ? value.message : String(value))).join(' '));
}

function validate(query: CandleQuery): void {
  if (!query.symbol?.trim()) throw new TypeError('symbol is required');
  if (query.limit !== undefined && (!Number.isInteger(query.limit) || query.limit < 1)) {
    throw new RangeError('limit must be a positive integer');
  }
  if (query.timeoutMs !== undefined && (!Number.isFinite(query.timeoutMs) || query.timeoutMs < 1)) {
    throw new RangeError('timeoutMs must be positive');
  }
}

/** TradingView transport, isolated from the provider-neutral agent API. */
export class TradingViewProvider implements MarketDataProvider {
  private readonly options: TradingViewProviderOptions;

  constructor(options: TradingViewProviderOptions = {}) {
    this.options = options;
  }

  async watchCandles(query: CandleQuery, handlers: CandleHandlers): Promise<CandleWorker> {
    validate(query);
    if (typeof handlers?.onData !== 'function') throw new TypeError('onData must be a function');
    if (query.signal?.aborted) throw query.signal.reason ?? new Error('Aborted');

    // The old entry point remains untouched for existing users.
    const createClient = this.options.clientFactory ?? ((options) => {
      // Resolve from dist/ after compilation; the legacy entry stays at package root.
      // eslint-disable-next-line global-require, import/no-unresolved, import/extensions
      const { Client } = require('../main.js') as {
        Client: new (clientOptions?: TradingViewProviderOptions['clientOptions']) => LegacyClient;
      };
      return new Client(options);
    });
    const client = createClient(this.options.clientOptions);
    let chart: LegacyChart;
    try {
      chart = new client.Session.Chart();
    } catch (error) {
      await client.end();
      throw error;
    }

    let active = true;
    let settled = false;
    let symbolLoaded = false;
    let latest: readonly Candle[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopPromise: Promise<void> | undefined;
    let resolveReady!: (worker: CandleWorker) => void;
    let rejectReady!: (error: Error) => void;

    const stop = (): Promise<void> => {
      if (stopPromise) return stopPromise;
      active = false;
      if (timer) clearTimeout(timer);
      query.signal?.removeEventListener('abort', onAbort);
      stopPromise = (async () => {
        try { chart.delete(); } finally { await client.end(); }
      })();
      return stopPromise;
    };

    const worker: CandleWorker = {
      get latest() { return latest; },
      stop,
    };

    const fail = (error: Error): void => {
      if (!active) return;
      const beforeReady = !settled;
      settled = true;
      const closing = stop();
      if (beforeReady) {
        void closing.then(() => rejectReady(error), () => rejectReady(error));
      } else {
        try { handlers.onError?.(error); } catch { /* User callback must not prevent cleanup. */ }
        void closing.catch((cleanupError) => {
          try { handlers.onError?.(asError([cleanupError])); } catch { /* Already closing. */ }
        });
      }
    };

    const onAbort = (): void => fail(asError([query.signal?.reason ?? 'Aborted']));
    const emit = (): void => {
      if (!active || !symbolLoaded || chart.periods.length === 0) return;
      latest = Object.freeze(chart.periods.map((bar) => Object.freeze({
        time: bar.time,
        open: bar.open,
        high: bar.max,
        low: bar.min,
        close: bar.close,
        volume: bar.volume,
      })).sort((a, b) => a.time - b.time));
      try { handlers.onData(latest); } catch (error) {
        try { handlers.onError?.(asError([error])); } catch { /* Isolate user callbacks. */ }
      }
      if (!settled) {
        settled = true;
        if (timer) clearTimeout(timer);
        resolveReady(worker);
      }
    };

    const ready = new Promise<CandleWorker>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });

    chart.onSymbolLoaded(() => { symbolLoaded = true; emit(); });
    chart.onUpdate(emit);
    chart.onError((...messages) => fail(asError(messages)));
    client.onError((...messages) => fail(asError(messages)));
    client.onDisconnected(() => fail(new Error('Market data connection disconnected')));
    query.signal?.addEventListener('abort', onAbort, { once: true });
    timer = setTimeout(() => fail(new Error(`Timed out waiting for ${query.symbol} candles`)), query.timeoutMs ?? 15_000);
    try {
      chart.setMarket(query.symbol, { timeframe: query.timeframe ?? 'D', range: query.limit ?? 100 });
    } catch (error) {
      fail(asError([error]));
    }
    return ready;
  }
}

/** One-shot fetch; always closes its worker after the first usable snapshot. */
export async function fetchCandles(
  query: CandleQuery,
  provider: MarketDataProvider = new TradingViewProvider(),
): Promise<readonly Candle[]> {
  let snapshot: readonly Candle[] = [];
  const worker = await provider.watchCandles(query, {
    onData: (candles) => { snapshot = candles; },
  });
  try {
    return snapshot;
  } finally {
    await worker.stop();
  }
}

/** Start a real-time worker; call worker.stop() when finished. */
export function watchCandles(
  query: CandleQuery,
  handlers: CandleHandlers,
  provider: MarketDataProvider = new TradingViewProvider(),
): Promise<CandleWorker> {
  return provider.watchCandles(query, handlers);
}
