// Backtest engine for examples/honest-backtest: pure functions, no network, no file I/O.
// Every rule of the protocol (see README.md next to this file) lives here so that it can
// be unit-tested on synthetic candles. Bars are indexed oldest first; `time` is Unix seconds.
import { createHash } from 'node:crypto';

export const DEFAULTS = Object.freeze({
  symbol: 'BINANCE:BTCUSDT',
  timeframe: '240',
  minYears: 2, // Tradable history wanted after warm-up
  splitRatio: 0.7, // In-sample share of the tradable bars
  pivotLookback: 5, // Bars on each side of a pivot; it is confirmed this many bars later
  minPivotDistance: 5, // Bars between the two pivots of a divergence
  maxPivotDistance: 60,
  rsiLength: 14,
  emaLength: 200,
  atrLength: 14,
  fee: 0.001, // 0.1% per side
  slippage: 0.0005, // 0.05% per side, always adverse
  stopPct: 0.02, // Fixed stop distance for the fixed R:R exits
  atrStopMult: 1.5, // ATR exit: stop = 1.5 x ATR(14), target = 2R
  atrTargetR: 2,
  trailAtrMult: 3, // ATR trailing stop multiplier
  runs: 1000, // Random-entry runs per exit variant and split
  seed: 42,
});

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

// ---------------------------------------------------------------------------
// 1. Frozen snapshot
// ---------------------------------------------------------------------------

function freezeDeep(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const key of Object.keys(value)) freezeDeep(value[key]);
    Object.freeze(value);
  }
  return value;
}

/**
 * Validates candles once and freezes them. The bar that is still forming (its close time is
 * after `now`) is dropped: its high, low and close are not final yet.
 * Gaps are intervals longer than 1.5 bars (market closures also show up as gaps).
 */
export function freezeSnapshot(rawCandles, { symbol, timeframe, barSeconds, now = Date.now() / 1000 }) {
  if (!isNumber(barSeconds) || barSeconds <= 0) throw new Error('barSeconds must be a positive number');
  const candles = rawCandles.map(({ time, open, high, low, close, volume }) => ({
    time, open, high, low, close, volume: volume ?? 0,
  }));
  candles.forEach((c, i) => {
    if (![c.time, c.open, c.high, c.low, c.close].every(isNumber)) throw new Error(`Invalid candle at index ${i}`);
    if (c.high < Math.max(c.open, c.close) || c.low > Math.min(c.open, c.close)) throw new Error(`Inconsistent OHLC at index ${i}`);
    if (i > 0 && c.time <= candles[i - 1].time) throw new Error(`Candles are not strictly ordered at index ${i}`);
  });

  let droppedFormingBar = false;
  if (candles.length > 0 && candles[candles.length - 1].time + barSeconds > now) {
    candles.pop();
    droppedFormingBar = true;
  }
  if (candles.length < 2) throw new Error('Not enough closed candles');

  const gaps = [];
  for (let i = 1; i < candles.length; i++) {
    const diff = candles[i].time - candles[i - 1].time;
    if (diff > barSeconds * 1.5) {
      gaps.push({ afterTime: candles[i - 1].time, beforeTime: candles[i].time, missingBars: Math.round(diff / barSeconds) - 1 });
    }
  }

  const firstTime = candles[0].time;
  const lastTime = candles[candles.length - 1].time;
  return freezeDeep({
    symbol,
    timeframe: String(timeframe),
    barSeconds,
    count: candles.length,
    firstTime,
    lastTime,
    spanYears: (lastTime + barSeconds - firstTime) / (365.25 * 86_400),
    gaps,
    droppedFormingBar,
    sha256: createHash('sha256').update(JSON.stringify(candles)).digest('hex'),
    candles,
  });
}

// ---------------------------------------------------------------------------
// 2. Causal indicators (value at bar i only uses bars 0..i)
// ---------------------------------------------------------------------------

/** EMA seeded with the SMA of the first `length` values. NaN before. */
export function ema(values, length) {
  const out = new Array(values.length).fill(NaN);
  if (values.length < length) return out;
  let sum = 0;
  for (let i = 0; i < length; i++) sum += values[i];
  out[length - 1] = sum / length;
  const k = 2 / (length + 1);
  for (let i = length; i < values.length; i++) out[i] = values[i] * k + out[i - 1] * (1 - k);
  return out;
}

/** Wilder RSI. First value at index `length`. */
export function rsi(closes, length) {
  const out = new Array(closes.length).fill(NaN);
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
export function atr(candles, length) {
  const out = new Array(candles.length).fill(NaN);
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

/** Indicators plus `warmupBars`: the first bar index where all of them are defined. */
export function computeIndicators(candles, options = {}) {
  const { rsiLength, emaLength, atrLength } = { ...DEFAULTS, ...options };
  const closes = candles.map((c) => c.close);
  return {
    rsi: rsi(closes, rsiLength),
    ema: ema(closes, emaLength),
    atr: atr(candles, atrLength),
    warmupBars: Math.max(rsiLength, emaLength - 1, atrLength - 1),
  };
}

// ---------------------------------------------------------------------------
// 3. Pivots and divergence signals (no look-ahead)
// ---------------------------------------------------------------------------

/**
 * A pivot low at bar p: lower than the `lookback` bars before it and not higher than the
 * `lookback` bars after it (mirror for highs). It needs those later bars, so it is only
 * known at the close of `confirmBar = p + lookback`. Never use it earlier.
 */
export function findPivots(values, lookback, kind) {
  const pivots = [];
  for (let p = lookback; p + lookback < values.length; p++) {
    const v = values[p];
    let ok = true;
    for (let j = p - lookback; ok && j < p; j++) ok = kind === 'low' ? values[j] > v : values[j] < v;
    for (let j = p + 1; ok && j <= p + lookback; j++) ok = kind === 'low' ? values[j] >= v : values[j] <= v;
    if (ok) pivots.push({ bar: p, confirmBar: p + lookback, price: v });
  }
  return pivots;
}

/**
 * Regular RSI divergence with a trend filter. For each newly confirmed pivot, compare it with
 * the previous pivot of the same kind:
 * - long: lower price low, higher RSI low, and close above the EMA on the confirmation bar;
 * - short: higher price high, lower RSI high, and close below the EMA on the confirmation bar.
 * The signal fires at the close of the confirmation bar; the entry is the NEXT bar's open.
 * `ind` only needs `rsi` and `ema` arrays (tests can pass synthetic ones).
 */
export function findSignals(candles, ind, options = {}) {
  const { pivotLookback, minPivotDistance, maxPivotDistance } = { ...DEFAULTS, ...options };
  const signals = [];
  const scan = (kind, direction) => {
    const pivots = findPivots(candles.map((c) => (kind === 'low' ? c.low : c.high)), pivotLookback, kind);
    for (let k = 1; k < pivots.length; k++) {
      const prev = pivots[k - 1];
      const cur = pivots[k];
      const distance = cur.bar - prev.bar;
      if (distance < minPivotDistance || distance > maxPivotDistance) continue;
      const c = cur.confirmBar;
      const [r1, r2, trend, close] = [ind.rsi[prev.bar], ind.rsi[cur.bar], ind.ema[c], candles[c].close];
      if (![r1, r2, trend].every(isNumber)) continue;
      const divergence = kind === 'low' ? cur.price < prev.price && r2 > r1 : cur.price > prev.price && r2 < r1;
      const trendOk = direction === 'long' ? close > trend : close < trend;
      if (divergence && trendOk) {
        signals.push({ direction, signalBar: c, entryBar: c + 1, pivotBar: cur.bar, prevPivotBar: prev.bar });
      }
    }
  };
  scan('low', 'long');
  scan('high', 'short');
  return signals.sort((a, b) => a.signalBar - b.signalBar);
}

// ---------------------------------------------------------------------------
// 4. Chronological split
// ---------------------------------------------------------------------------

/**
 * Bars before `warmupBars` only warm the indicators up. The remaining bars are split
 * chronologically: in-sample `[start, splitBar)`, out-of-sample `[splitBar, end)`.
 */
export function splitSegments(barCount, warmupBars, ratio) {
  if (!(ratio > 0 && ratio < 1)) throw new Error('splitRatio must be between 0 and 1');
  const start = Math.min(warmupBars, barCount);
  const splitBar = start + Math.floor((barCount - start) * ratio);
  return {
    inSample: { name: 'IS', start, end: splitBar },
    outOfSample: { name: 'OOS', start: splitBar, end: barCount },
  };
}

// ---------------------------------------------------------------------------
// 5. Exits (interchangeable: entries never depend on them)
// ---------------------------------------------------------------------------
// An exit model has `id`, `label`, `levels(ctx)` returning the initial `{ stop, target }`
// (target may be null) from information known at entry, and optionally `trail(stop, i, ctx)`
// which runs after bar i has CLOSED and returns the stop used from bar i + 1.

const offset = (direction, price, distance) => (direction === 'long' ? price + distance : price - distance);

/** Fixed stop at `stopPct` from the entry bar open, target at `rr` times that distance. */
export function fixedExit(rr, stopPct) {
  return {
    id: `fixed_${rr}R`,
    label: `Fixed ${(stopPct * 100).toFixed(1)}% stop, ${rr}:1 target`,
    levels({ direction, refPrice }) {
      const d = refPrice * stopPct;
      return { stop: offset(direction, refPrice, -d), target: offset(direction, refPrice, rr * d) };
    },
  };
}

/** Stop at `mult` x ATR of the signal bar (last closed bar before entry), target at `rr` R. */
export function atrExit(mult, rr) {
  return {
    id: `atr${mult}_${rr}R`,
    label: `ATR x${mult} stop, ${rr}R target`,
    levels({ direction, refPrice, signalBar, ind }) {
      const d = mult * ind.atr[signalBar];
      if (!isNumber(d) || d <= 0) return null;
      return { stop: offset(direction, refPrice, -d), target: offset(direction, refPrice, rr * d) };
    },
  };
}

/** ATR trailing stop, no target. Ratchets on each closed bar: close -/+ mult x ATR(that bar). */
export function atrTrailingExit(mult) {
  return {
    id: `trail_atr${mult}`,
    label: `ATR x${mult} trailing stop`,
    levels({ direction, refPrice, signalBar, ind }) {
      const d = mult * ind.atr[signalBar];
      if (!isNumber(d) || d <= 0) return null;
      return { stop: offset(direction, refPrice, -d), target: null };
    },
    trail(stop, i, { direction, candles, ind }) {
      const candidate = offset(direction, candles[i].close, -mult * ind.atr[i]);
      if (!isNumber(candidate)) return stop;
      return direction === 'long' ? Math.max(stop, candidate) : Math.min(stop, candidate);
    },
  };
}

export function defaultExits(options = {}) {
  const o = { ...DEFAULTS, ...options };
  return [fixedExit(1.5, o.stopPct), fixedExit(2, o.stopPct), atrExit(o.atrStopMult, o.atrTargetR), atrTrailingExit(o.trailAtrMult)];
}

// ---------------------------------------------------------------------------
// 6. Simulation (costs, one position at a time, no position across a segment boundary)
// ---------------------------------------------------------------------------

/** Fill price after adverse slippage. */
export function fillPrice(side, direction, price, slippage) {
  const buying = (side === 'entry') === (direction === 'long');
  return buying ? price * (1 + slippage) : price * (1 - slippage);
}

/**
 * Return on equity of one trade (100% of equity, no leverage), after slippage on both fills
 * and a fee on the notional of each side.
 */
export function tradeReturn(direction, entryFill, exitFill, fee) {
  const ratio = exitFill / entryFill;
  const gross = direction === 'long' ? ratio - 1 : 1 - ratio;
  return gross - fee - fee * ratio;
}

function runTrade(entry, exit, context) {
  const { candles, ind, costs, end, trace } = context;
  const { direction, entryBar: e } = entry;
  const long = direction === 'long';
  const refPrice = candles[e].open;
  const levels = exit.levels({ direction, refPrice, signalBar: entry.signalBar, ind, candles });
  if (!levels) return null;
  const entryPrice = fillPrice('entry', direction, refPrice, costs.slippage);
  let { stop } = levels;
  const { target } = levels;
  const stops = trace ? [] : undefined;
  const marks = [];

  for (let i = e; i < end; i++) {
    const bar = candles[i];
    stops?.push(stop);
    let level;
    let reason;
    if (i > e) {
      // The bar opened beyond a level: the order fills at the open, the worse price for a stop.
      if (long ? bar.open <= stop : bar.open >= stop) [level, reason] = [bar.open, 'stop_gap'];
      else if (target !== null && (long ? bar.open >= target : bar.open <= target)) [level, reason] = [bar.open, 'target_gap'];
    }
    if (level === undefined) {
      const hitStop = long ? bar.low <= stop : bar.high >= stop;
      const hitTarget = target !== null && (long ? bar.high >= target : bar.low <= target);
      // Intrabar order is unknown: when both are touched, assume the stop came first.
      if (hitStop && hitTarget) [level, reason] = [stop, 'stop_and_target_same_bar'];
      else if (hitStop) [level, reason] = [stop, exit.trail ? 'trailing_stop' : 'stop'];
      else if (hitTarget) [level, reason] = [target, 'target'];
    }
    if (level === undefined && i === end - 1) [level, reason] = [bar.close, 'segment_end'];
    if (level !== undefined) {
      const exitPrice = fillPrice('exit', direction, level, costs.slippage);
      return {
        ...entry,
        exitBar: i,
        entryOpen: refPrice,
        entryPrice,
        initialStop: levels.stop,
        target,
        exitLevel: level,
        exitPrice,
        reason,
        return: tradeReturn(direction, entryPrice, exitPrice, costs.fee),
        marks,
        ...(trace ? { stops } : {}),
      };
    }
    // Still open at the close: mark to market as if closed there (with exit costs).
    marks.push(tradeReturn(direction, entryPrice, fillPrice('exit', direction, bar.close, costs.slippage), costs.fee));
    if (exit.trail) stop = exit.trail(stop, i, { direction, candles, ind });
  }
  return null; // Only reached when the entry bar is outside the segment
}

/**
 * Simulates entries (sorted by `entryBar`) inside one segment. An entry is taken only if its
 * signal bar and entry bar are inside the segment and the previous trade exited on an earlier
 * bar. A trade still open on the last bar of the segment is closed at that bar's close.
 */
export function simulate({ candles, ind, entries, exit, costs, segment, maxTrades = Infinity, trace = false }) {
  const context = { candles, ind, costs, end: segment.end, trace };
  const trades = [];
  let freeFrom = segment.start;
  let skippedInPosition = 0;
  let outsideSegment = 0;
  let invalidLevels = 0;
  for (const entry of entries) {
    if (trades.length >= maxTrades) break;
    if (entry.signalBar < segment.start || entry.entryBar >= segment.end) {
      outsideSegment++;
      continue;
    }
    if (entry.entryBar < freeFrom) {
      skippedInPosition++;
      continue;
    }
    const trade = runTrade(entry, exit, context);
    if (!trade) {
      invalidLevels++;
      continue;
    }
    trades.push(trade);
    freeFrom = trade.exitBar + 1;
  }
  return { trades, skippedInPosition, outsideSegment, invalidLevels };
}

// ---------------------------------------------------------------------------
// 7. Metrics
// ---------------------------------------------------------------------------

/**
 * - netReturn: compounded return of all closed trades.
 * - winRate: share of trades with a positive net return (null without trades).
 * - profitFactor: gross profit / gross loss in equity terms; null when undefined
 *   (no trade, or no losing trade).
 * - maxDrawdown: largest peak-to-trough fall of equity, marked to market at every bar close
 *   while in a position and at every exit (fraction, positive number).
 */
export function computeMetrics(trades) {
  let equity = 1;
  let peak = 1;
  let maxDrawdown = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let wins = 0;
  const visit = (value) => {
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

// ---------------------------------------------------------------------------
// 8. Seeded random-entry baseline
// ---------------------------------------------------------------------------

/** mulberry32: small, fast, seedable PRNG returning floats in [0, 1). */
export function createRng(seed) {
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
export function deriveSeed(...parts) {
  let h = 0x811c9dc5;
  for (const ch of parts.join('|')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function sample(pool, k, rng) {
  const copy = [...pool];
  const n = Math.min(k, copy.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/** Linear-interpolated quantile of an ascending array (q in [0, 1]). */
export function quantile(sorted, q) {
  if (sorted.length === 0) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/**
 * Random entries on the same eligible bars as the strategy (signal bar and entry bar inside the
 * segment), with the same exit, costs, sizing and one-position rule. Each run draws `tradeCount`
 * distinct entry bars uniformly; entries skipped because a position was open are replaced by
 * bars drawn among the remaining free bars, so the run matches `tradeCount` when the segment
 * has room. Each entry is long with probability `longShare`.
 */
export function randomBaseline({ candles, ind, exit, costs, segment, tradeCount, longShare, runs, seed }) {
  const eligible = [];
  for (let e = segment.start + 1; e < segment.end; e++) eligible.push(e);
  const rng = createRng(seed);
  const netReturns = [];
  let matchedRuns = 0;
  let totalTrades = 0;
  for (let run = 0; run < runs; run++) {
    const direction = new Map();
    const draw = (bars) => bars.forEach((bar) => direction.set(bar, rng() < longShare ? 'long' : 'short'));
    draw(sample(eligible, tradeCount, rng));
    let result;
    for (let round = 0; round < 20; round++) {
      const entries = [...direction.keys()].sort((a, b) => a - b)
        .map((bar) => ({ direction: direction.get(bar), signalBar: bar - 1, entryBar: bar, pivotBar: null, prevPivotBar: null }));
      result = simulate({ candles, ind, entries, exit, costs, segment, maxTrades: tradeCount });
      const missing = tradeCount - result.trades.length;
      if (missing <= 0) break;
      const busy = new Set(direction.keys());
      for (const t of result.trades) for (let b = t.entryBar; b <= t.exitBar; b++) busy.add(b);
      const free = eligible.filter((b) => !busy.has(b));
      if (free.length === 0) break;
      draw(sample(free, missing, rng));
    }
    if (result.trades.length === tradeCount) matchedRuns++;
    totalTrades += result.trades.length;
    netReturns.push(computeMetrics(result.trades).netReturn);
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
export function percentileRank(value, randomReturns) {
  if (randomReturns.length === 0) return null;
  return (100 * randomReturns.filter((r) => r < value).length) / randomReturns.length;
}

// ---------------------------------------------------------------------------
// 9. Full protocol
// ---------------------------------------------------------------------------

export function runBacktest(snapshot, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const { candles } = snapshot;
  const ind = computeIndicators(candles, o);
  const segments = splitSegments(candles.length, ind.warmupBars, o.splitRatio);
  const signals = findSignals(candles, ind, o);
  const exits = options.exits ?? defaultExits(o);
  const costs = { fee: o.fee, slippage: o.slippage };
  const rows = [];
  const trades = [];
  for (const exit of exits) {
    for (const segment of [segments.inSample, segments.outOfSample]) {
      const result = simulate({ candles, ind, entries: signals, exit, costs, segment });
      const metrics = computeMetrics(result.trades);
      const longs = result.trades.filter((t) => t.direction === 'long').length;
      let baseline = null;
      let percentile = null;
      if (metrics.trades > 0 && o.runs > 0) {
        baseline = randomBaseline({
          candles, ind, exit, costs, segment,
          tradeCount: metrics.trades,
          longShare: longs / metrics.trades,
          runs: o.runs,
          seed: deriveSeed(o.seed, exit.id, segment.name),
        });
        percentile = percentileRank(metrics.netReturn, baseline.netReturns);
      }
      rows.push({
        exit: exit.id,
        exitLabel: exit.label,
        split: segment.name,
        metrics,
        longs,
        shorts: metrics.trades - longs,
        skippedInPosition: result.skippedInPosition,
        baseline: baseline && { ...baseline, netReturns: undefined },
        percentile,
      });
      for (const t of result.trades) trades.push({ ...t, exit: exit.id, split: segment.name });
    }
  }
  return { options: o, warmupBars: ind.warmupBars, segments, signals, rows, trades };
}

// ---------------------------------------------------------------------------
// 10. Output helpers
// ---------------------------------------------------------------------------

export const isoTime = (seconds) => new Date(seconds * 1000).toISOString().replace('.000Z', 'Z');

const CSV_COLUMNS = [
  'exit', 'split', 'direction', 'prev_pivot_time', 'pivot_time', 'confirmation_time', 'entry_time',
  'entry_open', 'entry_price', 'initial_stop', 'target', 'exit_time', 'exit_level', 'exit_price',
  'exit_reason', 'return_pct',
];

/** Trades as CSV. Times are bar open times (ISO, UTC); prices include slippage. */
export function tradesToCsv(trades, candles) {
  const time = (bar) => (bar === null || bar === undefined ? '' : isoTime(candles[bar].time));
  const num = (value) => (value === null || value === undefined ? '' : String(Number(value.toPrecision(10))));
  const lines = trades.map((t) => [
    t.exit, t.split, t.direction, time(t.prevPivotBar), time(t.pivotBar), time(t.signalBar), time(t.entryBar),
    num(t.entryOpen), num(t.entryPrice), num(t.initialStop), num(t.target), time(t.exitBar), num(t.exitLevel),
    num(t.exitPrice), t.reason, (t.return * 100).toFixed(4),
  ].join(','));
  return [CSV_COLUMNS.join(','), ...lines].join('\n') + '\n';
}

const pct = (value, digits = 1) => (value === null || value === undefined ? 'N/A' : `${(value * 100).toFixed(digits)}%`);

/** Compact side-by-side table: one row per exit variant and split. */
export function formatTable(rows) {
  const head = ['Exit', 'Split', 'Trades', 'Net', 'Win', 'PF', 'MaxDD', 'Rand p5', 'Rand p50', 'Rand p95', 'Pctl'];
  const body = rows.map((row) => {
    const m = row.metrics;
    const b = row.baseline;
    return [
      row.exit, row.split, String(m.trades), pct(m.netReturn), pct(m.winRate, 0),
      m.profitFactor === null ? 'N/A' : m.profitFactor.toFixed(2), pct(m.maxDrawdown),
      pct(b?.p5), pct(b?.p50), pct(b?.p95), row.percentile === null ? 'N/A' : row.percentile.toFixed(1),
    ];
  });
  const all = [head, ...body];
  const widths = head.map((_, c) => Math.max(...all.map((r) => r[c].length)));
  return all.map((r) => r.map((v, c) => (c < 2 ? v.padEnd(widths[c]) : v.padStart(widths[c]))).join('  ')).join('\n');
}
