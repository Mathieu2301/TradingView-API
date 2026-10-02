import type { Candle } from '../chart/types.js';
import { watchCandles, type CandleHandlers, type WatchCandlesQuery } from './candles.js';
import type { ConnectionOptions } from './operation.js';

/** Minimum lifecycle required of a streaming candle source. */
export interface CandleSourceWorker {
  /** First usable snapshot and subsequent updates, oldest first. */
  readonly latest: readonly Candle[];
  /** Releases resources. Safe to call more than once. */
  stop(): Promise<void>;
}

/**
 * Source-neutral candle contract. Applications can provide another market
 * data source without emulating TradingView's charts or websocket protocol.
 */
export interface MarketDataProvider {
  watchCandles(query: WatchCandlesQuery, handlers: CandleHandlers): Promise<CandleSourceWorker>;
}

/** Default candle source backed by TradingView, with optional connection defaults. */
export class TradingViewProvider implements MarketDataProvider {
  constructor(private readonly connection: ConnectionOptions = {}) {}

  watchCandles(query: WatchCandlesQuery, handlers: CandleHandlers): Promise<CandleSourceWorker> {
    return watchCandles({ ...this.connection, ...query }, handlers);
  }
}
