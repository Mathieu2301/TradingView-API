import type { ChartSession, MarketOptions, SeriesCompletedInfo } from '../chart/chart-session.js';
import { timeframeSeconds } from '../chart/timeframes.js';
import type {
  Adjustment, Candle, ChartType, ChartTypeInputs, Timeframe, Timezone, TradingSession,
} from '../chart/types.js';
import { TradingViewError } from '../errors.js';
import { toUnixSeconds, validateSymbol } from './operation.js';

/** Chart settings shared by candle and indicator queries. */
export interface ChartQuery {
  /** Exchange-qualified symbol, e.g. `BINANCE:BTCUSDT`. */
  symbol: string;
  /** Bar resolution (`1`, `15`, `60`, `240`, `D`, `W`, `M`, `1S`...). Default: `D`. */
  timeframe?: Timeframe;
  /** Number of most recent bars. Default: 100. */
  count?: number;
  /** Custom bar type: `HeikinAshi`, `Renko`, `LineBreak`, `Kagi`, `PointAndFigure` or `Range`. */
  chartType?: ChartType;
  /** Inputs for `chartType`. */
  chartInputs?: ChartTypeInputs;
  /** Convert prices to this currency, e.g. `EUR`. */
  currency?: string;
  /** `regular` or `extended` trading session. */
  session?: TradingSession;
  /** Price adjustment. Default: `splits`. */
  adjustment?: Adjustment;
  /** Back-adjust continuous futures contracts. */
  backAdjustment?: boolean;
  /** Chart timezone (affects how daily and longer bars are aligned). */
  timezone?: Timezone;
}

/** Historical range options. */
export interface RangeQuery {
  /**
   * Oldest bar time (Date or Unix seconds). When set, history is loaded back
   * to this time (deep history) and `count` is ignored.
   */
  from?: number | Date;
  /** Newest bar time (Date or Unix seconds). Default: now. */
  to?: number | Date;
  /** Safety cap on bars loaded for a `from` range. Default: 20 000. */
  maxCount?: number;
}

export interface HistoryPlan {
  symbol: string;
  market: MarketOptions;
  timezone?: Timezone;
  count: number;
  from?: number;
  to?: number;
  maxCount: number;
}

const MAX_CHUNK = 5_000;

function positiveInteger(value: number | undefined, name: string, fallback: number): number {
  const result = value ?? fallback;
  if (!Number.isInteger(result) || result < 1) {
    throw new TradingViewError('INVALID_ARGUMENT', `${name} must be a positive integer`);
  }
  return result;
}

/** Validates a query and computes how many bars to request first. */
export function planHistory(query: ChartQuery & RangeQuery): HistoryPlan {
  const symbol = validateSymbol(query.symbol);
  const count = positiveInteger(query.count, 'count', 100);
  const maxCount = positiveInteger(query.maxCount, 'maxCount', 20_000);
  const from = toUnixSeconds(query.from, 'from');
  const to = toUnixSeconds(query.to, 'to');
  if (from !== undefined && to !== undefined && from > to) {
    throw new TradingViewError('INVALID_ARGUMENT', 'from must be before to');
  }
  const timeframe = query.timeframe ?? 'D';

  let initial = Math.min(count, MAX_CHUNK);
  if (from !== undefined) {
    const step = timeframeSeconds(timeframe);
    const end = to ?? Math.floor(Date.now() / 1000);
    initial = step ? Math.ceil((end - from) / step) + 2 : 1_000;
    initial = Math.max(1, Math.min(initial, maxCount, MAX_CHUNK));
  }

  return {
    symbol,
    count,
    from,
    to,
    maxCount,
    timezone: query.timezone,
    market: {
      timeframe,
      count: initial,
      to,
      type: query.chartType,
      inputs: query.chartInputs,
      currency: query.currency,
      session: query.session,
      adjustment: query.adjustment,
      backAdjustment: query.backAdjustment,
    },
  };
}

/** Selects the requested bars from everything loaded on a chart. */
export function selectCandles(candles: Candle[], plan: Pick<HistoryPlan, 'from' | 'to' | 'count'>): Candle[] {
  let result = candles;
  if (plan.to !== undefined) result = result.filter((candle) => candle.time <= (plan.to as number));
  if (plan.from !== undefined) return result.filter((candle) => candle.time >= (plan.from as number));
  return result.slice(-plan.count);
}

/** Opens the market on a chart according to a plan. */
export function openMarket(chart: ChartSession, plan: HistoryPlan): void {
  if (plan.timezone) chart.setTimezone(plan.timezone);
  chart.setMarket(plan.symbol, plan.market);
}

/**
 * Loads history: after each `series_completed`, requests more bars until the
 * plan is satisfied or the server has no more data. `onDone` receives the
 * last completion info.
 */
export function loadHistory(
  chart: ChartSession,
  plan: HistoryPlan,
  deep: boolean,
  onDone: (info: SeriesCompletedInfo) => void,
): () => void {
  let previousSize = -1;
  let done = false;

  return chart.on('seriesCompleted', (info) => {
    if (done) return;
    const candles = chart.candles;
    const inRange = plan.to === undefined ? candles : candles.filter((c) => c.time <= (plan.to as number));
    const target = plan.from !== undefined ? plan.maxCount : plan.count;
    const satisfied = plan.from !== undefined
      ? (inRange[0] !== undefined && inRange[0].time <= plan.from)
      : inRange.length >= plan.count;
    const exhausted = info.dataCompleted !== undefined || candles.length <= previousSize;

    if (!deep || satisfied || exhausted || candles.length >= target) {
      done = true;
      onDone(info);
      return;
    }

    previousSize = candles.length;
    const missing = plan.from !== undefined ? MAX_CHUNK : plan.count - inRange.length;
    chart.fetchMore(Math.max(1, Math.min(missing, MAX_CHUNK, target - candles.length)));
  });
}

/** Error for an empty result, with the server's reason when known. */
export function noDataError(symbol: string, info?: SeriesCompletedInfo): TradingViewError {
  const reason = info?.dataCompleted === 'limit'
    ? ' (the server reported an access limit: this range or timeframe may need an account with access)'
    : '';
  return new TradingViewError('NO_DATA', `No candles available for ${symbol} in the requested range${reason}`, {
    details: info?.raw,
  });
}
