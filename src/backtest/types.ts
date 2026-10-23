/** One OHLC bar, oldest first; `time` is the bar open time in Unix seconds. */
export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type Direction = 'long' | 'short';

/**
 * A decision taken at the CLOSE of bar `bar`. The engine enters at the open of `bar + 1`;
 * there is no way to enter on the signal bar itself.
 */
export interface Signal {
  bar: number;
  direction: Direction;
  /**
   * Optional bars worth showing next to the trade (a pivot, a crossover...), by name.
   * They are exported with their times in the report and the CSV; they never change the fills.
   */
  refs?: Readonly<Record<string, number>>;
}

/**
 * Your entry rule: receives the frozen candles (oldest first) and returns every signal.
 * It must only use bars up to each signal's bar: the engine reruns it on truncated
 * history and rejects any signal that depends on later bars.
 */
export interface SignalFunction {
  (candles: readonly Readonly<Required<Bar>>[]): readonly Signal[];
  /** Bars needed before the first valid signal (indicator warm-up). */
  readonly warmupBars?: number;
  /** Shown in the report. */
  readonly label?: string;
}

/** A signal turned into an order: decided at the close of `signalBar`, entered at the open of `entryBar`. */
export interface Entry {
  direction: Direction;
  signalBar: number;
  entryBar: number;
  refs?: Readonly<Record<string, number>>;
}

export interface Segment {
  name: string;
  /** First bar (inclusive). */
  start: number;
  /** Last bar + 1 (exclusive). */
  end: number;
}

export interface Costs {
  /** Fee per side, as a fraction of the notional (0.001 = 0.1%). */
  fee: number;
  /** Adverse slippage per side, as a fraction of the price. */
  slippage: number;
}

export interface ExitContext {
  direction: Direction;
  candles: readonly Bar[];
}

/**
 * An exit model. Entries never depend on it, so exits can be swapped freely.
 * - `levels` returns the initial stop and target (target may be null) from information known
 *   at entry: the entry bar open and bars up to `signalBar`. Return null to skip the entry.
 * - `trail`, if present, runs after bar `bar` has CLOSED and returns the stop used from `bar + 1`.
 */
export interface ExitModel {
  id: string;
  label: string;
  /** Bars needed before `levels` can work (ATR length - 1...). */
  warmupBars?: number;
  levels(ctx: ExitContext & { entryOpen: number; signalBar: number }): { stop: number; target: number | null } | null;
  trail?(stop: number, bar: number, ctx: ExitContext): number;
}

export type ExitReason =
  | 'stop' | 'trailing_stop' | 'stop_gap' | 'target' | 'target_gap' | 'stop_and_target_same_bar' | 'segment_end';

export interface Trade extends Entry {
  exitBar: number;
  /** Open of the entry bar, before slippage. */
  entryOpen: number;
  /** Entry fill, after slippage. */
  entryPrice: number;
  initialStop: number;
  target: number | null;
  /** Level that triggered the exit (stop, target, gap open or segment close), before slippage. */
  exitLevel: number;
  /** Exit fill, after slippage. */
  exitPrice: number;
  reason: ExitReason;
  /** Net return on equity, after fees and slippage on both sides. */
  return: number;
  /** Mark-to-market return at each bar close while the position was open (exit costs included). */
  marks: number[];
  /** Stop in force on each bar from entry to exit (only with `trace: true`). */
  stops?: number[];
}

export interface Metrics {
  trades: number;
  /** Compounded net return of the closed trades. */
  netReturn: number;
  /** Share of trades with a positive net return; null without trades. */
  winRate: number | null;
  /** Gross profit / gross loss; null without trades or without a losing trade. */
  profitFactor: number | null;
  /** Largest peak-to-trough fall of equity, marked to market at bar closes (positive fraction). */
  maxDrawdown: number;
}

export interface Baseline {
  runs: number;
  seed: number;
  netReturns: number[];
  /** Runs that reached the strategy's trade count. */
  matchedRuns: number;
  meanTrades: number;
  p5: number | null;
  p50: number | null;
  p95: number | null;
}
