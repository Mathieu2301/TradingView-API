import type { ChartSession } from '../chart/chart-session.js';
import type { GraphicsData } from '../chart/graphics.js';
import type { StrategyReport } from '../chart/strategy.js';
import type { Study, StudyValue } from '../chart/study.js';
import type { Candle } from '../chart/types.js';
import { TradingViewError, toTradingViewError } from '../errors.js';
import { getIndicator } from '../http/indicators.js';
import { BuiltInIndicator } from '../indicators/builtin-indicator.js';
import type { Indicator } from '../indicators/index.js';
import { PineIndicator } from '../indicators/pine-indicator.js';
import {
  loadHistory, noDataError, openMarket, planHistory, selectCandles,
  type ChartQuery, type HistoryPlan,
} from './history.js';
import {
  runOperation, startWatcher, throwIfAborted, type OperationOptions, type WatchHandlers, type Watcher,
} from './operation.js';

export interface IndicatorQuery extends ChartQuery, OperationOptions {
  /**
   * Indicator to run: a script ID (`STD;RSI`, `PUB;xxxx`, `USER;xxxx`), a
   * built-in study type (`Volume@tv-basicstudies-241`), or an instance.
   */
  indicator: string | Indicator;
  /** Script version when `indicator` is a script ID. Default: `last`. */
  version?: string;
  /** Input values (Pine) or options (built-in) to apply. */
  inputs?: Record<string, unknown>;
  /** Newest bar time (Date or Unix seconds). Default: now. */
  to?: number | Date;
}

export interface IndicatorData {
  indicator: Indicator;
  /** Chart bars, oldest first. */
  candles: Candle[];
  /**
   * Plot values, oldest first. The server may compute a few rows before the
   * first returned candle.
   */
  values: StudyValue[];
  /** Drawings (labels, lines, boxes, tables...). */
  graphics: GraphicsData;
  /** Strategy report (strategies only; otherwise empty). */
  strategyReport: StrategyReport;
}

/** Resolves an indicator ID or instance and applies inputs. */
export async function resolveIndicator(query: IndicatorQuery): Promise<Indicator> {
  const { indicator, inputs } = query;
  let resolved: Indicator;
  if (indicator instanceof PineIndicator) resolved = indicator.clone();
  else if (indicator instanceof BuiltInIndicator) resolved = new BuiltInIndicator(indicator.type, indicator.options);
  else if (typeof indicator === 'string' && indicator.trim()) {
    resolved = indicator.includes('@')
      ? new BuiltInIndicator(indicator)
      : await getIndicator(indicator, {
        version: query.version,
        credentials: query.credentials,
        signal: query.signal,
        fetch: query.clientOptions?.fetch,
      });
  } else {
    throw new TradingViewError('INVALID_ARGUMENT', 'indicator must be a script ID, a built-in type or an indicator instance');
  }

  for (const [key, value] of Object.entries(inputs ?? {})) {
    if (resolved instanceof PineIndicator) resolved.setInput(key, value);
    else resolved.setOption(key, value);
  }
  return resolved;
}

function snapshot(chart: ChartSession, study: Study, plan: HistoryPlan): IndicatorData {
  return {
    indicator: study.indicator,
    candles: selectCandles(chart.candles, plan),
    values: study.values,
    graphics: study.graphics,
    strategyReport: structuredClone(study.strategyReport),
  };
}

/**
 * Runs history loading and the study together; calls `onReady` once both
 * the bars and the study computation are complete.
 */
function trackReadiness(
  chart: ChartSession,
  study: Study,
  plan: HistoryPlan,
  deep: boolean,
  onReady: () => void,
  onEmpty: (error: TradingViewError) => void,
): void {
  let historyDone = false;
  let studyLoading = true;
  let fired = false;
  const check = () => {
    if (fired || !historyDone || studyLoading) return;
    fired = true;
    onReady();
  };
  study.on('loading', () => { studyLoading = true; });
  study.on('ready', () => { studyLoading = false; check(); });
  loadHistory(chart, plan, deep, (info) => {
    if (chart.candles.length === 0) {
      fired = true;
      onEmpty(noDataError(plan.symbol, info));
      return;
    }
    historyDone = true;
    check();
  });
}

function prepare(query: IndicatorQuery): HistoryPlan {
  return planHistory({ ...query, from: undefined });
}

/**
 * Runs an indicator or strategy once and returns its values, drawings and
 * strategy report.
 *
 * @example
 * const { values } = await getIndicatorData({ symbol: 'BINANCE:BTCUSDT', indicator: 'STD;RSI' });
 */
export async function getIndicatorData(query: IndicatorQuery): Promise<IndicatorData> {
  const plan = prepare(query);
  throwIfAborted(query.signal);
  const indicator = await resolveIndicator(query).catch((error) => {
    throw toTradingViewError(error, 'NOT_FOUND');
  });

  return runOperation<IndicatorData>(query, `getIndicatorData(${plan.symbol})`, ({ client, resolve, reject }) => {
    const chart = client.createChart();
    chart.on('error', reject);
    openMarket(chart, plan);
    const study = chart.createStudy(indicator);
    study.on('error', reject);
    trackReadiness(chart, study, plan, true, () => resolve(snapshot(chart, study, plan)), reject);
    return () => chart.delete();
  });
}

export interface IndicatorHandlers extends WatchHandlers {
  /** Receives a fresh result on every study update. */
  onData(data: IndicatorData): void;
}

export interface IndicatorWatcher extends Watcher {
  /** Latest result. */
  readonly latest: IndicatorData | undefined;
}

/** Streams an indicator in real time. Call `stop()` when finished. */
export async function watchIndicator(query: IndicatorQuery, handlers: IndicatorHandlers): Promise<IndicatorWatcher> {
  if (typeof handlers?.onData !== 'function') throw new TradingViewError('INVALID_ARGUMENT', 'onData must be a function');
  const plan = prepare({ ...query, to: undefined });
  throwIfAborted(query.signal);
  const indicator = await resolveIndicator(query).catch((error) => {
    throw toTradingViewError(error, 'NOT_FOUND');
  });

  let latest: IndicatorData | undefined;

  return startWatcher(query, `watchIndicator(${plan.symbol})`, handlers, (ctx) => {
    const chart = ctx.client.createChart();
    let started = false;
    const publish = () => {
      latest = snapshot(chart, study, plan);
      try {
        handlers.onData(latest);
      } catch (error) {
        ctx.warn(new TradingViewError('CALLBACK_ERROR', 'onData callback threw', { cause: error }));
      }
    };

    chart.on('error', (error) => ctx.fail(error));
    openMarket(chart, plan);
    const study = chart.createStudy(indicator);
    study.on('error', (error) => ctx.fail(error));
    study.on('update', () => {
      if (started && ctx.isActive()) publish();
    });
    trackReadiness(chart, study, plan, false, () => {
      started = true;
      publish();
      ctx.ready();
    }, (error) => ctx.fail(error));
    return () => chart.delete();
  }, (base) => ({
    stop: base.stop,
    closed: base.closed,
    get isActive() { return base.isActive; },
    get latest() { return latest; },
  }));
}
