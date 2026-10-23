/**
 * Honest backtests on candles: you write the entry rule, the module applies the protocol
 * (frozen data, no look-ahead, costs, pessimistic fills, IS/OOS split, interchangeable exits,
 * seeded random-entry baseline) and returns a JSON report. It makes no claim of profitability.
 *
 * @module @mathieuc/tradingview/backtest
 */
export {
  backtest, BACKTEST_DEFAULTS, backtestMany, checkCausality, fetchSnapshot, resolveWarmupBars, runBacktest,
} from './run.js';
export type {
  BacktestManyQuery, BacktestOptions, BacktestQuery, BacktestReport, CausalityCheck, CausalityViolation, FetchSnapshotQuery,
  Market, MarketResult, ReportRow, ReportWarning, SegmentInfo, SignalRecord, TradeRecord,
} from './run.js';
export { freezeSnapshot, loadSnapshot, snapshotInfo } from './snapshot.js';
export type { Gap, Snapshot, SnapshotInfo, SnapshotMeta } from './snapshot.js';
export { rsiDivergence } from './signals.js';
export type { RsiDivergenceOptions } from './signals.js';
export { atrExit, atrTrailingExit, defaultExits, fixedExit } from './exits.js';
export type { AtrExitOptions, AtrTrailingExitOptions, DefaultExitOptions, FixedExitOptions } from './exits.js';
export { fillPrice, simulate, splitSegments, tradeReturn } from './simulate.js';
export type { SimulateInput, SimulateResult } from './simulate.js';
export {
  computeMetrics, createRng, deriveSeed, percentileRank, quantile, randomBaseline,
} from './stats.js';
export type { BaselineInput } from './stats.js';
export { atr, ema, findPivots, rsi, sma } from './indicators.js';
export type { Pivot } from './indicators.js';
export { formatReport, formatTable, formatWarning, isoTime, tradesToCsv } from './report.js';
export { chartData } from './chart.js';
export type { ChartData } from './chart.js';
export type {
  Bar, Baseline, Costs, Direction, Entry, ExitContext, ExitModel, ExitReason, Metrics, Segment, Signal, SignalFunction, Trade,
} from './types.js';
export { TradingViewError } from '../errors.js';
export type { TradingViewErrorCode } from '../errors.js';
