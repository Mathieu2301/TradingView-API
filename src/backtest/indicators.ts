import type { Bar } from './types.js';

// Causal indicators: the value at bar i only uses bars 0..i. NaN until defined.

/** Simple moving average. First value at index `length - 1`. */
export function sma(values: readonly number[], length: number): number[] {
  const out = new Array<number>(values.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= length) sum -= values[i - length];
    if (i >= length - 1) out[i] = sum / length;
  }
  return out;
}

/** EMA seeded with the SMA of the first `length` values. First value at index `length - 1`. */
export function ema(values: readonly number[], length: number): number[] {
  const out = new Array<number>(values.length).fill(NaN);
  if (values.length < length) return out;
  let sum = 0;
  for (let i = 0; i < length; i++) sum += values[i];
  out[length - 1] = sum / length;
  const k = 2 / (length + 1);
  for (let i = length; i < values.length; i++) out[i] = values[i] * k + out[i - 1] * (1 - k);
  return out;
}

/** Wilder RSI. First value at index `length`. */
export function rsi(closes: readonly number[], length: number): number[] {
  const out = new Array<number>(closes.length).fill(NaN);
  if (closes.length <= length) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= length; i++) {
    const change = closes[i] - closes[i - 1];
    gain += Math.max(change, 0);
    loss += Math.max(-change, 0);
  }
  gain /= length;
  loss /= length;
  const value = () => (loss === 0 ? (gain === 0 ? 50 : 100) : 100 - 100 / (1 + gain / loss));
  out[length] = value();
  for (let i = length + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gain = (gain * (length - 1) + Math.max(change, 0)) / length;
    loss = (loss * (length - 1) + Math.max(-change, 0)) / length;
    out[i] = value();
  }
  return out;
}

/** Wilder ATR. First value at index `length - 1`. */
export function atr(candles: readonly Bar[], length: number): number[] {
  const out = new Array<number>(candles.length).fill(NaN);
  if (candles.length < length) return out;
  const tr = candles.map((c, i) => (i === 0
    ? c.high - c.low
    : Math.max(c.high - c.low, Math.abs(c.high - candles[i - 1].close), Math.abs(c.low - candles[i - 1].close))));
  let sum = 0;
  for (let i = 0; i < length; i++) sum += tr[i];
  out[length - 1] = sum / length;
  for (let i = length; i < candles.length; i++) out[i] = (out[i - 1] * (length - 1) + tr[i]) / length;
  return out;
}

export interface Pivot {
  /** Bar of the pivot itself. */
  bar: number;
  /** First bar at whose close the pivot is known: `bar + lookback`. */
  confirmBar: number;
  price: number;
}

/**
 * A pivot low at bar p: lower than the `lookback` bars before it and not higher than the
 * `lookback` bars after it (mirror for highs). It needs those later bars, so it is only
 * known at the close of `confirmBar = p + lookback`. Never use it earlier.
 */
export function findPivots(values: readonly number[], lookback: number, kind: 'low' | 'high'): Pivot[] {
  const pivots: Pivot[] = [];
  for (let p = lookback; p + lookback < values.length; p++) {
    const v = values[p];
    let ok = true;
    for (let j = p - lookback; ok && j < p; j++) ok = kind === 'low' ? values[j] > v : values[j] < v;
    for (let j = p + 1; ok && j <= p + lookback; j++) ok = kind === 'low' ? values[j] >= v : values[j] <= v;
    if (ok) pivots.push({ bar: p, confirmBar: p + lookback, price: v });
  }
  return pivots;
}

const atrCache = new WeakMap<readonly Bar[], Map<number, number[]>>();

/** ATR memoised per candle array, so that several exits share one computation. */
export function cachedAtr(candles: readonly Bar[], length: number): number[] {
  let byLength = atrCache.get(candles);
  if (!byLength) atrCache.set(candles, byLength = new Map());
  let values = byLength.get(length);
  if (!values) byLength.set(length, values = atr(candles, length));
  return values;
}
