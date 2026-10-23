import { ema, findPivots, rsi } from './indicators.js';
import type { Direction, Signal, SignalFunction } from './types.js';

export interface RsiDivergenceOptions {
  /** Default 14. */
  rsiLength?: number;
  /** Trend filter EMA length. Default 200. */
  emaLength?: number;
  /** Bars on each side of a pivot; it is confirmed this many bars later. Default 5. */
  pivotLookback?: number;
  /** Bars between the two pivots of a divergence. Default 5 to 60. */
  minPivotDistance?: number;
  maxPivotDistance?: number;
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/**
 * Regular RSI divergence with an EMA trend filter, the reference strategy of the protocol.
 * For each newly confirmed pivot, compare it with the previous pivot of the same kind:
 * - long: lower price low, higher RSI low, and close above the EMA on the confirmation bar;
 * - short: higher price high, lower RSI high, and close below the EMA on the confirmation bar.
 * The signal fires at the close of the confirmation bar (`pivot + pivotLookback`), never on
 * the pivot itself. `refs` carries the two pivots.
 */
export function rsiDivergence(options: RsiDivergenceOptions = {}): SignalFunction {
  const {
    rsiLength = 14, emaLength = 200, pivotLookback = 5, minPivotDistance = 5, maxPivotDistance = 60,
  } = options;
  const find = (candles: Parameters<SignalFunction>[0]): Signal[] => {
    const closes = candles.map((c) => c.close);
    const rsiValues = rsi(closes, rsiLength);
    const trend = ema(closes, emaLength);
    const signals: Signal[] = [];
    const scan = (kind: 'low' | 'high', direction: Direction) => {
      const pivots = findPivots(candles.map((c) => (kind === 'low' ? c.low : c.high)), pivotLookback, kind);
      for (let k = 1; k < pivots.length; k++) {
        const prev = pivots[k - 1];
        const cur = pivots[k];
        const distance = cur.bar - prev.bar;
        if (distance < minPivotDistance || distance > maxPivotDistance) continue;
        const c = cur.confirmBar;
        const [r1, r2, level, close] = [rsiValues[prev.bar], rsiValues[cur.bar], trend[c], candles[c].close];
        if (![r1, r2, level].every(isNumber)) continue;
        const divergence = kind === 'low' ? cur.price < prev.price && r2 > r1 : cur.price > prev.price && r2 < r1;
        const trendOk = direction === 'long' ? close > level : close < level;
        if (divergence && trendOk) signals.push({ bar: c, direction, refs: { prev_pivot: prev.bar, pivot: cur.bar } });
      }
    };
    scan('low', 'long');
    scan('high', 'short');
    return signals.sort((a, b) => a.bar - b.bar);
  };
  return Object.assign(find, {
    warmupBars: Math.max(rsiLength, emaLength - 1),
    label: `RSI(${rsiLength}) divergence, EMA(${emaLength}) trend filter, pivot lookback ${pivotLookback}, pivots ${minPivotDistance}-${maxPivotDistance} bars apart`,
  });
}
