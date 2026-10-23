import { timeframeSeconds } from '../chart/timeframes.js';
import type { Timeframe } from '../chart/types.js';
import { getCandles, type CandleQuery } from '../data/candles.js';
import type { MarketDataProvider } from '../data/provider.js';
import { TradingViewError } from '../errors.js';
import { defaultExits } from './exits.js';
import { simulate, splitSegments } from './simulate.js';
import {
  freezeSnapshot, snapshotInfo, type Snapshot, type SnapshotInfo,
} from './snapshot.js';
import {
  computeMetrics, createRng, deriveSeed, percentileRank, randomBaseline,
} from './stats.js';
import type {
  Bar, Baseline, Costs, Direction, Entry, ExitModel, ExitReason, Metrics, Segment, Signal, SignalFunction, Trade,
} from './types.js';

export interface BacktestOptions {
  /** Your entry rule. See `SignalFunction`. */
  signal: SignalFunction;
  /** Exits compared on the same entries. Default: `defaultExits()` (four reference exits). */
  exits?: readonly ExitModel[];
  /** Fee per side. Default 0.001 (0.1%). */
  fee?: number;
  /** Adverse slippage per side. Default 0.0005 (0.05%). */
  slippage?: number;
  /** In-sample share of the tradable bars. Default 0.7. */
  splitRatio?: number;
  /**
   * Bars never traded, used only to warm the indicators up. Default: the largest
   * `warmupBars` of the signal and the exits, or 200 when the signal does not declare one.
   */
  warmupBars?: number;
  /** Random-entry runs per exit and split. Default 1000; 0 disables the baseline. */
  runs?: number;
  /** Base seed of the random baseline. Default 42. */
  seed?: number;
  /**
   * Maximum number of signals whose causality is checked by rerunning `signal` on the history
   * that ends at their bar (plus 8 evenly spaced cuts). Default 100; 0 disables the check.
   */
  causalityChecks?: number;
  /** Tradable history wanted, in years: only used for the warning. */
  minYears?: number;
}

export const BACKTEST_DEFAULTS = Object.freeze({
  fee: 0.001,
  slippage: 0.0005,
  splitRatio: 0.7,
  runs: 1000,
  seed: 42,
  causalityChecks: 100,
  signalWarmupBars: 200,
  minYears: 2,
});

export interface SegmentInfo extends Segment {
  bars: number;
  /** Open time of the first bar, Unix seconds. */
  startTime: number | null;
  /** Open time of the last bar, Unix seconds. */
  endTime: number | null;
}

export interface SignalRecord {
  bar: number;
  time: number;
  direction: Direction;
  entryBar: number;
  entryTime: number | null;
  /** Segment containing both the signal and the entry, or null (warm-up, straddling the split, last bar). */
  split: 'IS' | 'OOS' | null;
  refs: Record<string, number>;
}

export interface TradeRecord {
  exit: string;
  split: string;
  direction: Direction;
  signalBar: number;
  signalTime: number;
  entryBar: number;
  entryTime: number;
  /** Times of the signal's `refs` bars. */
  refs: Record<string, number>;
  entryOpen: number;
  entryPrice: number;
  initialStop: number;
  target: number | null;
  exitBar: number;
  exitTime: number;
  exitLevel: number;
  exitPrice: number;
  reason: ExitReason;
  return: number;
}

export interface ReportRow {
  exit: string;
  exitLabel: string;
  split: string;
  metrics: Metrics;
  longs: number;
  shorts: number;
  skippedInPosition: number;
  /** Random-entry baseline without the raw returns; null without trades or with `runs: 0`. */
  baseline: Omit<Baseline, 'netReturns'> | null;
  /** 100 x share of random runs with a strictly lower net return; null without a baseline. */
  percentile: number | null;
}

export interface CausalityViolation {
  /** History length the signal function was rerun on (bars `0..cut-1`). */
  cut: number;
  bar: number;
  direction: Direction;
  /** `look_ahead`: present with full history, absent when history ends at `cut - 1`. `repaint`: the reverse. */
  kind: 'look_ahead' | 'repaint';
}

export interface CausalityCheck {
  /** Number of truncated reruns. 0 when disabled. */
  reruns: number;
  /** Signals whose own cut was checked, out of `totalSignals`. */
  checkedSignals: number;
  totalSignals: number;
}

/** Plain JSON: save it, render it or send it as it is. */
export interface BacktestReport {
  snapshot: SnapshotInfo;
  settings: {
    signal: string;
    fee: number;
    slippage: number;
    splitRatio: number;
    warmupBars: number;
    runs: number;
    seed: number;
    exits: { id: string; label: string }[];
  };
  segments: { warmup: SegmentInfo; inSample: SegmentInfo; outOfSample: SegmentInfo };
  /** Tradable years after warm-up. */
  tradableYears: number;
  signals: SignalRecord[];
  rows: ReportRow[];
  trades: TradeRecord[];
  causality: CausalityCheck;
  /** Plain-language warnings: few trades, short history, unmatched random runs... */
  warnings: string[];
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

function invalid(message: string): TradingViewError {
  return new TradingViewError('INVALID_ARGUMENT', message);
}

function checkOption(name: string, value: number, ok: boolean): number {
  if (!isNumber(value) || !ok) throw invalid(`${name} is out of range: ${value}`);
  return value;
}

/** Validates and sorts (stable, by bar) what the signal function returned. */
function normaliseSignals(raw: unknown, barCount: number): Signal[] {
  if (!Array.isArray(raw)) throw invalid('signal() must return an array of { bar, direction }');
  raw.forEach((s: Signal, i) => {
    if (!s || !Number.isInteger(s.bar) || s.bar < 0 || s.bar >= barCount) {
      throw invalid(`signal() returned an invalid bar at index ${i}: ${s?.bar} (expected an integer bar index from 0 to ${barCount - 1})`);
    }
    if (s.direction !== 'long' && s.direction !== 'short') throw invalid(`signal() returned an invalid direction at index ${i}: ${s.direction}`);
  });
  return [...(raw as Signal[])].sort((a, b) => a.bar - b.bar);
}

function signalCounts(signals: readonly Signal[], before: number): Map<string, number> {
  const counts = new Map<string, number>();
  for (const s of signals) {
    if (s.bar >= before) break;
    const key = `${s.bar}:${s.direction}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function violationsAt(cut: number, full: readonly Signal[], truncated: readonly Signal[]): CausalityViolation[] {
  const expected = signalCounts(full, cut);
  const actual = signalCounts(truncated, cut);
  const out: CausalityViolation[] = [];
  const diff = (a: Map<string, number>, b: Map<string, number>, kind: CausalityViolation['kind']) => {
    for (const [key, count] of a) {
      if ((b.get(key) ?? 0) < count) {
        const [bar, direction] = key.split(':');
        out.push({ cut, bar: Number(bar), direction: direction as Direction, kind });
      }
    }
  };
  diff(expected, actual, 'look_ahead');
  diff(actual, expected, 'repaint');
  return out.sort((a, b) => a.bar - b.bar);
}

/**
 * Reruns `signal` on truncated copies of the candles and compares the signals it gives up to
 * each cut with those of the full run. A signal must be identical whether or not later bars
 * exist; otherwise it used information from after its bar (look-ahead) or changes when new
 * bars arrive (repaint). Cuts: the bar right after each checked signal (at most `maxSignals`,
 * picked with a seeded draw when there are more) and 8 evenly spaced bars after `fromBar`.
 */
export function checkCausality(
  signal: SignalFunction,
  candles: readonly Readonly<Required<Bar>>[],
  options: { fullSignals?: readonly Signal[]; maxSignals?: number; fromBar?: number; seed?: number } = {},
): { violations: CausalityViolation[]; check: CausalityCheck } {
  const full = options.fullSignals ?? normaliseSignals(signal(candles), candles.length);
  const maxSignals = options.maxSignals ?? BACKTEST_DEFAULTS.causalityChecks;
  const fromBar = Math.max(1, options.fromBar ?? 0);
  const candidates = [...new Set(full.map((s) => s.bar + 1))].filter((cut) => cut < candles.length);
  let signalCuts = candidates;
  if (candidates.length > maxSignals) {
    const rng = createRng(options.seed ?? BACKTEST_DEFAULTS.seed);
    const picked = new Set<number>();
    while (picked.size < maxSignals) picked.add(candidates[Math.floor(rng() * candidates.length)]);
    signalCuts = [...picked];
  }
  const cuts = new Set(signalCuts);
  if (maxSignals > 0) {
    for (let j = 1; j <= 8; j++) {
      const cut = fromBar + Math.round(((candles.length - fromBar) * j) / 9);
      if (cut > 1 && cut < candles.length) cuts.add(cut);
    }
  }
  const violations: CausalityViolation[] = [];
  for (const cut of [...cuts].sort((a, b) => a - b)) {
    const prefix = Object.freeze(candles.slice(0, cut));
    violations.push(...violationsAt(cut, full, normaliseSignals(signal(prefix), cut)));
  }
  const checkedBars = new Set(signalCuts.map((cut) => cut - 1));
  return {
    violations,
    check: {
      reruns: cuts.size,
      checkedSignals: full.filter((s) => checkedBars.has(s.bar)).length,
      totalSignals: full.length,
    },
  };
}

function lookAheadError(violations: readonly CausalityViolation[], candles: readonly Bar[]): TradingViewError {
  const first = violations[0];
  const time = new Date(candles[first.bar].time * 1000).toISOString();
  const what = first.kind === 'look_ahead'
    ? `appears with the full history but not when the history ends at bar ${first.cut - 1}: it uses bars after its own bar`
    : `appears when the history ends at bar ${first.cut - 1} but not with the full history: it changes when later bars arrive (repaint)`;
  return new TradingViewError('LOOK_AHEAD', `The ${first.direction} signal at bar ${first.bar} (${time}) ${what}. `
    + `${violations.length} causality violation(s) found. A signal decided at the close of bar i may only use bars 0..i `
    + '(a pivot with lookback N is only known N bars later). Results would be unreliable, so the backtest stopped.', { details: violations });
}

function toSnapshot(input: Snapshot | readonly Bar[]): Snapshot {
  if (Array.isArray(input)) return freezeSnapshot(input);
  const snapshot = input as Snapshot;
  if (!snapshot || !Array.isArray(snapshot.candles) || !Object.isFrozen(snapshot.candles) || typeof snapshot.sha256 !== 'string') {
    throw invalid('runBacktest() expects candles or a snapshot from freezeSnapshot() / loadSnapshot()');
  }
  return snapshot;
}

function segmentInfo(segment: Segment, candles: readonly Bar[]): SegmentInfo {
  const empty = segment.end <= segment.start;
  return {
    ...segment,
    bars: Math.max(0, segment.end - segment.start),
    startTime: empty ? null : candles[segment.start].time,
    endTime: empty ? null : candles[segment.end - 1].time,
  };
}

const refTimes = (refs: Readonly<Record<string, number>> | undefined, candles: readonly Bar[]) => Object.fromEntries(
  Object.entries(refs ?? {}).filter(([, bar]) => Number.isInteger(bar) && candles[bar]).map(([name, bar]) => [name, candles[bar].time]),
);

/** Resolves the warm-up: explicit option, else the largest need of the signal and exits. */
export function resolveWarmupBars(signal: SignalFunction, exits: readonly ExitModel[], warmupBars?: number): number {
  if (warmupBars !== undefined) return checkOption('warmupBars', warmupBars, Number.isInteger(warmupBars) && warmupBars >= 0);
  return Math.max(signal.warmupBars ?? BACKTEST_DEFAULTS.signalWarmupBars, ...exits.map((e) => e.warmupBars ?? 0));
}

type ResolvedOptions = Required<Omit<BacktestOptions, 'exits' | 'warmupBars'>> & { exits: readonly ExitModel[]; warmupBars: number };

function resolveOptions(options: BacktestOptions): ResolvedOptions {
  if (typeof options?.signal !== 'function') throw invalid('options.signal must be a function (candles) => [{ bar, direction }]');
  const o = { ...BACKTEST_DEFAULTS, ...options } as Required<Omit<BacktestOptions, 'exits' | 'warmupBars'>>;
  checkOption('fee', o.fee, o.fee >= 0 && o.fee < 1);
  checkOption('slippage', o.slippage, o.slippage >= 0 && o.slippage < 1);
  checkOption('splitRatio', o.splitRatio, o.splitRatio > 0 && o.splitRatio < 1);
  checkOption('runs', o.runs, Number.isInteger(o.runs) && o.runs >= 0);
  checkOption('seed', o.seed, Number.isInteger(o.seed));
  checkOption('causalityChecks', o.causalityChecks, Number.isInteger(o.causalityChecks) && o.causalityChecks >= 0);
  const exits = options.exits ?? defaultExits();
  if (!Array.isArray(exits) || exits.length === 0) throw invalid('exits must be a non-empty array');
  if (new Set(exits.map((e) => e.id)).size !== exits.length) throw invalid('exit ids must be unique');
  return { ...o, exits, warmupBars: resolveWarmupBars(options.signal, exits, options.warmupBars) };
}

/** Signals of the full history, rejected when the same rule on shorter history disagrees. */
function causalSignals(o: ResolvedOptions, candles: Snapshot['candles']): { signals: Signal[]; causality: CausalityCheck } {
  const signals = normaliseSignals(o.signal(candles), candles.length);
  if (o.causalityChecks === 0) return { signals, causality: { reruns: 0, checkedSignals: 0, totalSignals: signals.length } };
  const result = checkCausality(o.signal, candles, {
    fullSignals: signals, maxSignals: o.causalityChecks, fromBar: o.warmupBars, seed: o.seed,
  });
  if (result.violations.length) throw lookAheadError(result.violations, candles);
  return { signals, causality: result.check };
}

function tradeRecord(t: Trade, exit: string, split: string, candles: readonly Bar[]): TradeRecord {
  return {
    exit,
    split,
    direction: t.direction,
    signalBar: t.signalBar,
    signalTime: candles[t.signalBar].time,
    entryBar: t.entryBar,
    entryTime: candles[t.entryBar].time,
    refs: refTimes(t.refs, candles),
    entryOpen: t.entryOpen,
    entryPrice: t.entryPrice,
    initialStop: t.initialStop,
    target: t.target,
    exitBar: t.exitBar,
    exitTime: candles[t.exitBar].time,
    exitLevel: t.exitLevel,
    exitPrice: t.exitPrice,
    reason: t.reason,
    return: t.return,
  };
}

/** One exit on one segment: strategy trades, metrics and the random baseline. */
function evaluate(
  o: ResolvedOptions, candles: readonly Bar[], entries: readonly Entry[], exit: ExitModel, segment: Segment,
): { row: ReportRow; trades: TradeRecord[] } {
  const costs: Costs = { fee: o.fee, slippage: o.slippage };
  const result = simulate({ candles, entries, exit, costs, segment });
  const metrics = computeMetrics(result.trades);
  const longs = result.trades.filter((t) => t.direction === 'long').length;
  const baseline = metrics.trades > 0 && o.runs > 0
    ? randomBaseline({
      candles, exit, costs, segment,
      tradeCount: metrics.trades,
      longShare: longs / metrics.trades,
      runs: o.runs,
      seed: deriveSeed(o.seed, exit.id, segment.name),
    })
    : null;
  const row: ReportRow = {
    exit: exit.id,
    exitLabel: exit.label,
    split: segment.name,
    metrics,
    longs,
    shorts: metrics.trades - longs,
    skippedInPosition: result.skippedInPosition,
    baseline: baseline && {
      runs: baseline.runs, seed: baseline.seed, matchedRuns: baseline.matchedRuns, meanTrades: baseline.meanTrades,
      p5: baseline.p5, p50: baseline.p50, p95: baseline.p95,
    },
    percentile: baseline && percentileRank(metrics.netReturn, baseline.netReturns),
  };
  return { row, trades: result.trades.map((t) => tradeRecord(t, exit.id, segment.name, candles)) };
}

function reportWarnings(
  o: ResolvedOptions, snapshot: Snapshot, tradableYears: number, signals: readonly Signal[], rows: readonly ReportRow[],
): string[] {
  const warnings: string[] = [];
  if (tradableYears < o.minYears) {
    warnings.push(`Only ${tradableYears.toFixed(2)} years of tradable history after warm-up (${o.minYears} wanted): results are even less conclusive.`);
  }
  if (signals.length === 0) warnings.push('The signal returned no signal at all.');
  const fewest = Math.min(...rows.map((r) => r.metrics.trades));
  if (fewest < 30) warnings.push(`As few as ${fewest} trades in a row: with so few trades, net return and percentile are mostly noise.`);
  for (const row of rows) {
    if (row.baseline && row.baseline.matchedRuns < row.baseline.runs) {
      warnings.push(`${row.exit} ${row.split}: ${row.baseline.matchedRuns}/${row.baseline.runs} random runs reached ${row.metrics.trades} trades (mean ${row.baseline.meanTrades.toFixed(1)}).`);
    }
  }
  if (o.causalityChecks === 0) warnings.push('Causality check disabled: look-ahead in the signal would go unnoticed.');
  if (snapshot.gaps.length) warnings.push(`${snapshot.gaps.length} gap(s) in the data (market closures also count).`);
  return warnings;
}

function signalRecord(s: Signal, candles: readonly Bar[], segments: readonly Segment[]): SignalRecord {
  const segment = segments.find((seg) => s.bar >= seg.start && s.bar + 1 < seg.end);
  return {
    bar: s.bar,
    time: candles[s.bar].time,
    direction: s.direction,
    entryBar: s.bar + 1,
    entryTime: candles[s.bar + 1]?.time ?? null,
    split: (segment?.name ?? null) as SignalRecord['split'],
    refs: refTimes(s.refs, candles),
  };
}

/**
 * Runs the full protocol on frozen candles, synchronously and without network:
 * causality check of the signal, warm-up, chronological IS/OOS split, every exit on the same
 * entries, costs on both sides, metrics per exit and split, seeded random-entry baseline.
 * Throws a `LOOK_AHEAD` TradingViewError when the signal uses future bars.
 *
 * @example
 * const report = runBacktest(candles, { signal: (bars) => bars.flatMap((b, i) => ...) });
 * console.log(formatReport(report));
 */
export function runBacktest(input: Snapshot | readonly Bar[], options: BacktestOptions): BacktestReport {
  const o = resolveOptions(options);
  const snapshot = toSnapshot(input);
  const { candles } = snapshot;

  // 1. Signals, then their causality: the same rule on shorter history must agree.
  const { signals, causality } = causalSignals(o, candles);

  // 2. Chronological split and entries (always the open of the bar after the signal).
  const { inSample, outOfSample } = splitSegments(candles.length, o.warmupBars, o.splitRatio);
  const entries: Entry[] = signals.map((s) => ({
    direction: s.direction, signalBar: s.bar, entryBar: s.bar + 1, ...(s.refs ? { refs: s.refs } : {}),
  }));

  // 3. Every exit on every segment, with its random baseline.
  const results = o.exits.flatMap((exit) => [inSample, outOfSample].map((segment) => evaluate(o, candles, entries, exit, segment)));
  const rows = results.map((r) => r.row);
  const tradableYears = ((candles.length - inSample.start) * snapshot.barSeconds) / (365.25 * 86_400);

  return {
    snapshot: snapshotInfo(snapshot),
    settings: {
      signal: o.signal.label ?? (o.signal.name || 'custom signal'),
      fee: o.fee,
      slippage: o.slippage,
      splitRatio: o.splitRatio,
      warmupBars: o.warmupBars,
      runs: o.runs,
      seed: o.seed,
      exits: o.exits.map((e) => ({ id: e.id, label: e.label })),
    },
    segments: {
      warmup: segmentInfo({ name: 'warmup', start: 0, end: inSample.start }, candles),
      inSample: segmentInfo(inSample, candles),
      outOfSample: segmentInfo(outOfSample, candles),
    },
    tradableYears,
    signals: signals.map((s) => signalRecord(s, candles, [inSample, outOfSample])),
    rows,
    trades: results.flatMap((r) => r.trades),
    causality,
    warnings: reportWarnings(o, snapshot, tradableYears, signals, rows),
  };
}

export interface FetchSnapshotQuery {
  symbol: string;
  timeframe?: Timeframe;
  /** Tradable years wanted after warm-up. Default 2. Ignored with `count` or `from`. */
  years?: number;
  /** Warm-up bars added to the request. Default 200. */
  warmupBars?: number;
  count?: number;
  from?: number;
  to?: number;
  credentials?: CandleQuery['credentials'];
  client?: CandleQuery['client'];
  clientOptions?: CandleQuery['clientOptions'];
  /** Cancels the download. */
  abortSignal?: AbortSignal;
  /** Default 120000: deep history takes several server batches. */
  timeoutMs?: number;
  provider?: MarketDataProvider;
}

/**
 * Downloads candles once with `getCandles` and freezes them (forming bar dropped, gaps and
 * SHA-256 recorded). Save the result with `JSON.stringify` and replay it with `loadSnapshot`.
 */
export async function fetchSnapshot(query: FetchSnapshotQuery): Promise<Snapshot> {
  const timeframe = query.timeframe ?? '240';
  const barSeconds = timeframeSeconds(timeframe);
  if (!barSeconds) throw invalid(`Backtests need a time-based timeframe, got ${timeframe}`);
  const years = query.years ?? BACKTEST_DEFAULTS.minYears;
  const warmup = query.warmupBars ?? BACKTEST_DEFAULTS.signalWarmupBars;
  const range = query.from !== undefined
    ? { from: query.from, to: query.to }
    : { count: query.count ?? Math.ceil((years * 365.25 * 86_400) / barSeconds) + warmup + 1 };
  const candles = await getCandles({
    symbol: query.symbol,
    timeframe,
    ...range,
    timeoutMs: query.timeoutMs ?? 120_000,
    ...(query.credentials ? { credentials: query.credentials } : {}),
    ...(query.client ? { client: query.client } : {}),
    ...(query.clientOptions ? { clientOptions: query.clientOptions } : {}),
    ...(query.abortSignal ? { signal: query.abortSignal } : {}),
  }, query.provider);
  return freezeSnapshot(candles, { symbol: query.symbol, timeframe, barSeconds });
}

export type BacktestQuery = FetchSnapshotQuery & Omit<BacktestOptions, 'minYears'> & {
  /** Replay a saved snapshot instead of downloading candles. */
  snapshot?: Snapshot;
};

/**
 * One call: download (or replay) the candles, freeze them, run the whole protocol.
 * Returns the JSON report and the frozen snapshot (candles included, for charts and replays).
 *
 * @example
 * import { backtest, formatReport } from '@mathieuc/tradingview/backtest';
 * const { report, snapshot } = await backtest({
 *   symbol: 'BINANCE:BTCUSDT', timeframe: '240', years: 2,
 *   signal: (candles) => candles.flatMap((c, i) => (i > 0 && c.close > candles[i - 1].high ? [{ bar: i, direction: 'long' }] : [])),
 * });
 * console.log(formatReport(report));
 * writeFileSync('snapshot.json', JSON.stringify(snapshot)); // Replay later with { snapshot: loadSnapshot(...) }
 */
export async function backtest(query: BacktestQuery): Promise<{ report: BacktestReport; snapshot: Snapshot }> {
  if (typeof query?.signal !== 'function') throw invalid('signal must be a function (candles) => [{ bar, direction }]');
  const exits = query.exits ?? defaultExits();
  const warmupBars = resolveWarmupBars(query.signal, exits, query.warmupBars);
  const snapshot = query.snapshot ?? await fetchSnapshot({ ...query, warmupBars });
  const report = runBacktest(snapshot, {
    ...query, exits, warmupBars, minYears: query.years ?? BACKTEST_DEFAULTS.minYears,
  });
  return { report, snapshot };
}
