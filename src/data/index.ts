/**
 * High-level data API: one-shot functions and watchers that manage
 * connections, sessions, timeouts and cleanup for you.
 *
 * @module @mathieuc/tradingview/data
 */
export { getCandles, watchCandles } from './candles.js';
export type {
  CandleHandlers, CandleQuery, CandleWatcher, WatchCandlesQuery,
} from './candles.js';
export { TradingViewProvider } from './provider.js';
export type { CandleSourceWorker, MarketDataProvider } from './provider.js';
export { getQuote, getQuotes, watchQuotes } from './quotes.js';
export type {
  QuoteHandlers, QuoteOptions, QuoteQuery, QuotesQuery, QuoteWatcher,
} from './quotes.js';
export { getSymbolInfo } from './symbols.js';
export type { SymbolInfoQuery } from './symbols.js';
export { getIndicatorData, watchIndicator } from './indicators.js';
export type {
  IndicatorData, IndicatorHandlers, IndicatorQuery, IndicatorWatcher,
} from './indicators.js';
export type { ChartQuery, RangeQuery } from './history.js';
export { DEFAULT_TIMEOUT_MS } from './operation.js';
export type {
  ConnectionOptions, OperationOptions, WatchHandlers, Watcher,
} from './operation.js';

// Plain HTTP lookups are already one-shot; they are part of the data API too.
export {
  getTechnicalAnalysis, searchIndicators, searchMarkets,
} from '../http/index.js';
export type {
  Credentials, IndicatorSearchResult, MarketSearchResult, SearchMarketsOptions, TechnicalAnalysis, TechnicalRating,
} from '../http/index.js';

export { TradingViewError } from '../errors.js';
export type { TradingViewErrorCode } from '../errors.js';
export type {
  Candle, ChartType, ChartTypeInputs, SymbolInfo, Timeframe, Timezone,
} from '../chart/types.js';
export type { QuoteData, QuoteField } from '../quote/fields.js';
export type { StudyValue } from '../chart/study.js';
export type { GraphicsData } from '../chart/graphics.js';
export type { StrategyReport } from '../chart/strategy.js';

export { summarizeStrategyReport } from '../chart/strategy.js';
export type { StrategySummary } from '../chart/strategy.js';
export { getScreener } from '../http/screener.js';
export type { ScreenerFilter, ScreenerQuery, ScreenerResult, ScreenerRow } from '../http/screener.js';
export { getWatchlists, getHotlist } from '../http/watchlists.js';
export type { Watchlist, WatchlistOptions, HotlistKind, HotlistQuery } from '../http/watchlists.js';
