// Type declarations for engine.js (used by the TypeScript unit tests and editors).

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type Direction = 'long' | 'short';

export interface Options {
  symbol: string;
  timeframe: string;
  minYears: number;
  splitRatio: number;
  pivotLookback: number;
  minPivotDistance: number;
  maxPivotDistance: number;
  rsiLength: number;
  emaLength: number;
  atrLength: number;
  fee: number;
  slippage: number;
  stopPct: number;
  atrStopMult: number;
  atrTargetR: number;
  trailAtrMult: number;
  runs: number;
  seed: number;
}

export declare const DEFAULTS: Readonly<Options>;

export interface Gap { afterTime: number; beforeTime: number; missingBars: number }

export interface Snapshot {
  readonly symbol: string;
  readonly timeframe: string;
  readonly barSeconds: number;
  readonly count: number;
  readonly firstTime: number;
  readonly lastTime: number;
  readonly spanYears: number;
  readonly gaps: readonly Gap[];
  readonly droppedFormingBar: boolean;
  readonly sha256: string;
  readonly candles: readonly Readonly<Required<Bar>>[];
}

export declare function freezeSnapshot(
  candles: readonly Bar[],
  meta: { symbol: string; timeframe: string; barSeconds: number; now?: number },
): Snapshot;

export interface Indicators { rsi: number[]; ema: number[]; atr: number[]; warmupBars?: number }

export declare function ema(values: readonly number[], length: number): number[];
export declare function rsi(closes: readonly number[], length: number): number[];
export declare function atr(candles: readonly Bar[], length: number): number[];
export declare function computeIndicators(candles: readonly Bar[], options?: Partial<Options>): Required<Indicators>;

export interface Pivot { bar: number; confirmBar: number; price: number }
export declare function findPivots(values: readonly number[], lookback: number, kind: 'low' | 'high'): Pivot[];

export interface Entry {
  direction: Direction;
  signalBar: number;
  entryBar: number;
  pivotBar: number | null;
  prevPivotBar: number | null;
}
export declare function findSignals(candles: readonly Bar[], ind: Pick<Indicators, 'rsi' | 'ema'>, options?: Partial<Options>): Entry[];

export interface Segment { name: string; start: number; end: number }
export declare function splitSegments(barCount: number, warmupBars: number, ratio: number): { inSample: Segment; outOfSample: Segment };

export interface ExitContext { direction: Direction; candles: readonly Bar[]; ind: Indicators }
export interface ExitModel {
  id: string;
  label: string;
  levels(ctx: ExitContext & { refPrice: number; signalBar: number }): { stop: number; target: number | null } | null;
  trail?(stop: number, bar: number, ctx: ExitContext): number;
}
export declare function fixedExit(rr: number, stopPct: number): ExitModel;
export declare function atrExit(mult: number, rr: number): ExitModel;
export declare function atrTrailingExit(mult: number): ExitModel;
export declare function defaultExits(options?: Partial<Options>): ExitModel[];

export interface Costs { fee: number; slippage: number }
export declare function fillPrice(side: 'entry' | 'exit', direction: Direction, price: number, slippage: number): number;
export declare function tradeReturn(direction: Direction, entryFill: number, exitFill: number, fee: number): number;

export interface Trade extends Entry {
  exitBar: number;
  entryOpen: number;
  entryPrice: number;
  initialStop: number;
  target: number | null;
  exitLevel: number;
  exitPrice: number;
  reason: 'stop' | 'trailing_stop' | 'stop_gap' | 'target' | 'target_gap' | 'stop_and_target_same_bar' | 'segment_end';
  return: number;
  marks: number[];
  /** Stop in force on each bar from entry to exit (only with `trace: true`). */
  stops?: number[];
}

export declare function simulate(input: {
  candles: readonly Bar[];
  ind: Indicators;
  entries: readonly Entry[];
  exit: ExitModel;
  costs: Costs;
  segment: Segment;
  maxTrades?: number;
  trace?: boolean;
}): { trades: Trade[]; skippedInPosition: number; outsideSegment: number; invalidLevels: number };

export interface Metrics {
  trades: number;
  netReturn: number;
  winRate: number | null;
  profitFactor: number | null;
  maxDrawdown: number;
}
export declare function computeMetrics(trades: readonly Pick<Trade, 'return' | 'marks'>[]): Metrics;

export declare function createRng(seed: number): () => number;
export declare function deriveSeed(...parts: (string | number)[]): number;
export declare function quantile(sorted: readonly number[], q: number): number | null;

export interface Baseline {
  runs: number;
  seed: number;
  netReturns: number[];
  matchedRuns: number;
  meanTrades: number;
  p5: number | null;
  p50: number | null;
  p95: number | null;
}
export declare function randomBaseline(input: {
  candles: readonly Bar[];
  ind: Indicators;
  exit: ExitModel;
  costs: Costs;
  segment: Segment;
  tradeCount: number;
  longShare: number;
  runs: number;
  seed: number;
}): Baseline;
export declare function percentileRank(value: number, randomReturns: readonly number[]): number | null;

export interface ReportRow {
  exit: string;
  exitLabel: string;
  split: string;
  metrics: Metrics;
  longs: number;
  shorts: number;
  skippedInPosition: number;
  baseline: Omit<Baseline, 'netReturns'> | null;
  percentile: number | null;
}
export declare function runBacktest(snapshot: { candles: readonly Bar[] }, options?: Partial<Options> & { exits?: ExitModel[] }): {
  options: Options;
  warmupBars: number;
  segments: { inSample: Segment; outOfSample: Segment };
  signals: Entry[];
  rows: ReportRow[];
  trades: (Trade & { exit: string; split: string })[];
};

export declare function isoTime(seconds: number): string;
export declare function tradesToCsv(trades: readonly (Trade & { exit: string; split: string })[], candles: readonly Bar[]): string;
export declare function formatTable(rows: readonly ReportRow[]): string;
