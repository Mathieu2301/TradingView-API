import { simulate } from './simulate.js';
import type {
  Bar, Baseline, Costs, Direction, Entry, ExitModel, Metrics, Segment, Trade,
} from './types.js';

/**
 * - netReturn: compounded return of all closed trades.
 * - winRate: share of trades with a positive net return (null without trades).
 * - profitFactor: gross profit / gross loss in equity terms; null when undefined
 *   (no trade, or no losing trade).
 * - maxDrawdown: largest peak-to-trough fall of equity, marked to market at every bar close
 *   while in a position and at every exit (fraction, positive number).
 */
export function computeMetrics(trades: readonly Pick<Trade, 'return' | 'marks'>[]): Metrics {
  let equity = 1;
  let peak = 1;
  let maxDrawdown = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let wins = 0;
  const visit = (value: number) => {
    peak = Math.max(peak, value);
    maxDrawdown = Math.max(maxDrawdown, (peak - value) / peak);
  };
  for (const trade of trades) {
    for (const mark of trade.marks ?? []) visit(equity * (1 + mark));
    const pnl = equity * trade.return;
    if (pnl > 0) {
      grossProfit += pnl;
      wins++;
    } else grossLoss -= pnl;
    equity += pnl;
    visit(equity);
  }
  return {
    trades: trades.length,
    netReturn: equity - 1,
    winRate: trades.length ? wins / trades.length : null,
    profitFactor: trades.length && grossLoss > 0 ? grossProfit / grossLoss : null,
    maxDrawdown,
  };
}

/** mulberry32: small, fast, seedable PRNG returning floats in [0, 1). */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Deterministic 32-bit seed for one (base seed, variant, split) combination (FNV-1a). */
export function deriveSeed(...parts: (string | number)[]): number {
  let h = 0x811c9dc5;
  for (const ch of parts.join('|')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function sample<T>(pool: readonly T[], k: number, rng: () => number): T[] {
  const copy = [...pool];
  const n = Math.min(k, copy.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/** Linear-interpolated quantile of an ascending array (q in [0, 1]). */
export function quantile(sorted: readonly number[], q: number): number | null {
  if (sorted.length === 0) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export interface BaselineInput {
  candles: readonly Bar[];
  exit: ExitModel;
  costs: Costs;
  segment: Segment;
  /** Trades each run tries to reach (the strategy's trade count). */
  tradeCount: number;
  /** Probability that a random entry is long. */
  longShare: number;
  runs: number;
  seed: number;
}

/**
 * Random entries on the same eligible bars as the strategy (signal bar and entry bar inside the
 * segment), with the same exit, costs, sizing and one-position rule. Each run draws `tradeCount`
 * distinct entry bars uniformly; entries skipped because a position was open are replaced by
 * bars drawn among the remaining free bars, so the run matches `tradeCount` when the segment
 * has room. Each entry is long with probability `longShare`.
 */
export function randomBaseline({
  candles, exit, costs, segment, tradeCount, longShare, runs, seed,
}: BaselineInput): Baseline {
  const eligible: number[] = [];
  for (let e = segment.start + 1; e < segment.end; e++) eligible.push(e);
  const rng = createRng(seed);
  const netReturns: number[] = [];
  let matchedRuns = 0;
  let totalTrades = 0;
  for (let run = 0; run < runs; run++) {
    const direction = new Map<number, Direction>();
    const draw = (bars: number[]) => bars.forEach((bar) => direction.set(bar, rng() < longShare ? 'long' : 'short'));
    draw(sample(eligible, tradeCount, rng));
    let trades: Trade[] = [];
    for (let round = 0; round < 20; round++) {
      const entries: Entry[] = [...direction.keys()].sort((a, b) => a - b)
        .map((bar) => ({ direction: direction.get(bar) as Direction, signalBar: bar - 1, entryBar: bar }));
      trades = simulate({ candles, entries, exit, costs, segment, maxTrades: tradeCount }).trades;
      const missing = tradeCount - trades.length;
      if (missing <= 0) break;
      const busy = new Set(direction.keys());
      for (const t of trades) for (let b = t.entryBar; b <= t.exitBar; b++) busy.add(b);
      const free = eligible.filter((b) => !busy.has(b));
      if (free.length === 0) break;
      draw(sample(free, missing, rng));
    }
    if (trades.length === tradeCount) matchedRuns++;
    totalTrades += trades.length;
    netReturns.push(computeMetrics(trades).netReturn);
  }
  const sorted = [...netReturns].sort((a, b) => a - b);
  return {
    runs,
    seed,
    netReturns,
    matchedRuns,
    meanTrades: runs ? totalTrades / runs : 0,
    p5: quantile(sorted, 0.05),
    p50: quantile(sorted, 0.5),
    p95: quantile(sorted, 0.95),
  };
}

/** 100 x share of random runs with a strictly lower net return than the strategy. */
export function percentileRank(value: number, randomReturns: readonly number[]): number | null {
  if (randomReturns.length === 0) return null;
  return (100 * randomReturns.filter((r) => r < value).length) / randomReturns.length;
}
