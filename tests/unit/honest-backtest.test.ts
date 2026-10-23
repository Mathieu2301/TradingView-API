import { describe, expect, it } from 'vitest';
import {
  atrTrailingExit, computeMetrics, createRng, findPivots, findSignals, fillPrice, fixedExit, freezeSnapshot,
  percentileRank, quantile, randomBaseline, runBacktest, simulate, splitSegments, tradeReturn, tradesToCsv,
  type Bar, type Entry, type Indicators,
} from '../../examples/honest-backtest/engine.js';

const HOUR = 3_600;
const NO_COSTS = { fee: 0, slippage: 0 };

/** Flat bars: open = close = 100, high 101, low 99, one every 4 hours. */
function flatBars(n: number): Bar[] {
  return Array.from({ length: n }, (_, i) => ({ time: i * 4 * HOUR, open: 100, high: 101, low: 99, close: 100, volume: 1 }));
}

/** Seeded random walk, valid OHLC. */
function randomWalk(n: number, seed: number): Bar[] {
  const rng = createRng(seed);
  let price = 100;
  return Array.from({ length: n }, (_, i) => {
    const open = price;
    const close = open * (1 + (rng() - 0.5) * 0.04);
    price = close;
    return {
      time: i * 4 * HOUR, open, close,
      high: Math.max(open, close) * (1 + rng() * 0.01),
      low: Math.min(open, close) * (1 - rng() * 0.01),
      volume: 1,
    };
  });
}

const constant = (n: number, value: number) => new Array<number>(n).fill(value);
const longAt = (entryBar: number): Entry => ({ direction: 'long', signalBar: entryBar - 1, entryBar, pivotBar: null, prevPivotBar: null });
const whole = (bars: Bar[]) => ({ name: 'ALL', start: 0, end: bars.length });

describe('honest backtest example: snapshot', () => {
  it('drops the forming bar, records gaps and freezes the data', () => {
    const bars = flatBars(10).filter((_, i) => i !== 4 && i !== 5);
    const last = bars[bars.length - 1]!;
    const snapshot = freezeSnapshot(bars, { symbol: 'X:Y', timeframe: '240', barSeconds: 4 * HOUR, now: last.time + HOUR });
    expect(snapshot.droppedFormingBar).toBe(true);
    expect(snapshot.count).toBe(7);
    expect(snapshot.lastTime).toBe(8 * 4 * HOUR);
    expect(snapshot.gaps).toEqual([{ afterTime: 3 * 4 * HOUR, beforeTime: 6 * 4 * HOUR, missingBars: 2 }]);
    expect(Object.isFrozen(snapshot.candles) && Object.isFrozen(snapshot.candles[0])).toBe(true);
    expect(snapshot.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects unordered candles', () => {
    const bars = flatBars(5);
    [bars[1], bars[2]] = [bars[2]!, bars[1]!];
    expect(() => freezeSnapshot(bars, { symbol: 'X:Y', timeframe: '240', barSeconds: 4 * HOUR, now: 1e12 })).toThrow(/ordered/);
  });
});

describe('honest backtest example: no look-ahead', () => {
  it('confirms a pivot only lookback bars later', () => {
    const lows = [10, 9, 8, 7, 6, 5, 6, 7, 8, 9, 10, 11];
    expect(findPivots(lows, 3, 'low')).toEqual([{ bar: 5, confirmBar: 8, price: 5 }]);
    // Without bar 8, the same pivot cannot be known yet.
    expect(findPivots(lows.slice(0, 8), 3, 'low')).toEqual([]);
  });

  it('fires on the confirmation bar close and enters at the next bar open', () => {
    const bars = flatBars(40).map((bar, i) => ({ ...bar, open: 100 + i / 100 }));
    bars[10] = { ...bars[10]!, low: 95 };
    bars[20] = { ...bars[20]!, low: 90 }; // Lower price low...
    const rsi = constant(40, 50);
    rsi[10] = 20;
    rsi[20] = 30; // ...with a higher RSI low: bullish divergence
    const ind: Indicators = { rsi, ema: constant(40, 50), atr: constant(40, 1) }; // Close 100 > EMA 50
    const options = { pivotLookback: 3, minPivotDistance: 5, maxPivotDistance: 60 };

    const signals = findSignals(bars, ind, options);
    expect(signals).toEqual([{ direction: 'long', signalBar: 23, entryBar: 24, pivotBar: 20, prevPivotBar: 10 }]);
    expect(findSignals(bars.slice(0, 23), ind, options)).toEqual([]);

    const costs = { fee: 0, slippage: 0.0005 };
    const { trades } = simulate({ candles: bars, ind, entries: signals, exit: fixedExit(2, 0.02), costs, segment: whole(bars) });
    expect(trades[0]!.entryBar).toBe(24);
    expect(trades[0]!.entryOpen).toBe(bars[24]!.open);
    expect(trades[0]!.entryPrice).toBeCloseTo(bars[24]!.open * 1.0005, 10);
  });

  it('ignores the divergence when the trend filter disagrees', () => {
    const bars = flatBars(40);
    bars[10] = { ...bars[10]!, low: 95 };
    bars[20] = { ...bars[20]!, low: 90 };
    const rsi = constant(40, 50);
    rsi[10] = 20;
    rsi[20] = 30;
    expect(findSignals(bars, { rsi, ema: constant(40, 150) }, { pivotLookback: 3 })).toEqual([]);
  });
});

describe('honest backtest example: fills and costs', () => {
  it('counts a bar touching both target and stop as a loss', () => {
    const bars = flatBars(10);
    bars[3] = { ...bars[3]!, high: 110, low: 90 };
    const { trades } = simulate({ candles: bars, ind: { rsi: [], ema: [], atr: [] }, entries: [longAt(2)], exit: fixedExit(2, 0.02), costs: NO_COSTS, segment: whole(bars) });
    expect(trades[0]).toMatchObject({ exitBar: 3, exitLevel: 98, reason: 'stop_and_target_same_bar' });
    expect(trades[0]!.return).toBeCloseTo(-0.02, 12);
  });

  it('fills a gap through the stop at the worse open', () => {
    const bars = flatBars(10);
    bars[3] = { ...bars[3]!, open: 95, high: 96, low: 94, close: 95 };
    const { trades } = simulate({ candles: bars, ind: { rsi: [], ema: [], atr: [] }, entries: [longAt(2)], exit: fixedExit(2, 0.02), costs: NO_COSTS, segment: whole(bars) });
    expect(trades[0]).toMatchObject({ exitBar: 3, exitLevel: 95, reason: 'stop_gap' });
  });

  it('applies fee and adverse slippage on entry and exit, long and short', () => {
    const fee = 0.001;
    const slippage = 0.0005;
    const bars = flatBars(10);
    bars[3] = { ...bars[3]!, high: 105 }; // Long target 104 hit
    const ind = { rsi: [], ema: [], atr: [] };
    const long = simulate({ candles: bars, ind, entries: [longAt(2)], exit: fixedExit(2, 0.02), costs: { fee, slippage }, segment: whole(bars) }).trades[0]!;
    expect(long.entryPrice).toBeCloseTo(100.05, 10);
    expect(long.exitPrice).toBeCloseTo(104 * 0.9995, 10);
    expect(long.return).toBeCloseTo(103.948 / 100.05 - 1 - fee - fee * (103.948 / 100.05), 12);

    const shortBars = flatBars(10);
    shortBars[3] = { ...shortBars[3]!, low: 95 }; // Short target 96 hit
    const short = simulate({ candles: shortBars, ind, entries: [{ ...longAt(2), direction: 'short' }], exit: fixedExit(2, 0.02), costs: { fee, slippage }, segment: whole(shortBars) }).trades[0]!;
    expect(short.entryPrice).toBeCloseTo(99.95, 10);
    expect(short.exitPrice).toBeCloseTo(96 * 1.0005, 10);
    expect(short.return).toBeCloseTo(1 - 96.048 / 99.95 - fee - fee * (96.048 / 99.95), 12);
    expect(fillPrice('exit', 'short', 100, slippage)).toBeCloseTo(100.05, 10);
  });

  it('charges the same costs in the random baseline', () => {
    const bars = flatBars(30); // Never reaches a 2% stop or target: every trade ends at the segment close
    const costs = { fee: 0.001, slippage: 0.0005 };
    const baseline = randomBaseline({
      candles: bars, ind: { rsi: [], ema: [], atr: [] }, exit: fixedExit(2, 0.02), costs,
      segment: whole(bars), tradeCount: 1, longShare: 1, runs: 20, seed: 1,
    });
    const expected = tradeReturn('long', 100.05, 100 * 0.9995, costs.fee);
    expect(expected).toBeLessThan(-0.002);
    expect(baseline.netReturns).toHaveLength(20);
    for (const value of baseline.netReturns) expect(value).toBeCloseTo(expected, 12);
  });
});

describe('honest backtest example: split', () => {
  it('never lets a position cross a segment boundary', () => {
    const bars = flatBars(20);
    const ind = { rsi: [], ema: [], atr: [] };
    const segments = splitSegments(20, 0, 0.5);
    const exit = fixedExit(2, 0.02);
    // Signal on the last in-sample bar, entry on the first out-of-sample bar: taken by neither.
    const straddling = longAt(10);
    expect(simulate({ candles: bars, ind, entries: [straddling], exit, costs: NO_COSTS, segment: segments.inSample }).trades).toEqual([]);
    expect(simulate({ candles: bars, ind, entries: [straddling], exit, costs: NO_COSTS, segment: segments.outOfSample }).trades).toEqual([]);
    // A trade still open at the end of the segment is closed on its last bar.
    const { trades } = simulate({ candles: bars, ind, entries: [longAt(5)], exit, costs: NO_COSTS, segment: segments.inSample });
    expect(trades[0]).toMatchObject({ exitBar: 9, reason: 'segment_end' });
  });

  it('keeps every trade of a full run inside its segment, after the warm-up', () => {
    const bars = randomWalk(1200, 7);
    const report = runBacktest({ candles: bars }, { emaLength: 50, pivotLookback: 3, runs: 10 });
    const { inSample, outOfSample } = report.segments;
    expect(inSample.start).toBe(report.warmupBars);
    expect(inSample.end).toBe(outOfSample.start);
    expect(outOfSample.end).toBe(bars.length);
    expect(report.trades.length).toBeGreaterThan(0);
    for (const trade of report.trades) {
      const segment = trade.split === 'IS' ? inSample : outOfSample;
      expect(trade.signalBar).toBeGreaterThanOrEqual(segment.start);
      expect(trade.entryBar).toBe(trade.signalBar + 1);
      expect(trade.exitBar).toBeLessThan(segment.end);
    }
    expect(report.rows).toHaveLength(8);
    const csv = tradesToCsv(report.trades, bars).trim().split('\n');
    expect(csv[0]).toContain('pivot_time,confirmation_time,entry_time');
    expect(csv).toHaveLength(report.trades.length + 1);
  });
});

describe('honest backtest example: trailing stop', () => {
  // Rising bars: close = 100.5 + i, ATR fixed at 1, multiplier 2 => the stop never triggers.
  const rising = (n: number): Bar[] => Array.from({ length: n }, (_, i) => ({
    time: i * 4 * HOUR, open: 100 + i, high: 101 + i, low: 99.5 + i, close: 100.5 + i, volume: 1,
  }));
  const ind = { rsi: [], ema: [], atr: constant(30, 1) };
  const exit = atrTrailingExit(2);

  it('ratchets from closed bars only', () => {
    const bars = rising(30);
    const { trades } = simulate({ candles: bars, ind, entries: [longAt(5)], exit, costs: NO_COSTS, segment: whole(bars), trace: true });
    const stops = trades[0]!.stops!;
    expect(stops[0]).toBe(bars[5]!.open - 2); // From the signal bar ATR, before any trailing
    for (let j = 1; j < stops.length; j++) {
      // The stop used on bar 5 + j comes from the close of bar 5 + j - 1, never from bar 5 + j itself.
      expect(stops[j]).toBe(Math.max(stops[j - 1]!, bars[5 + j - 1]!.close - 2));
    }
  });

  it('is unchanged on a bar when that bar or later bars change', () => {
    const a = rising(30);
    const b = rising(30).map((bar, i) => (i >= 12 ? { ...bar, high: bar.high + 500, close: bar.close + 400, open: bar.open + 300 } : bar));
    const run = (bars: Bar[]) => simulate({ candles: bars, ind, entries: [longAt(5)], exit, costs: NO_COSTS, segment: whole(bars), trace: true }).trades[0]!.stops!;
    const stopsA = run(a);
    const stopsB = run(b);
    expect(stopsB.slice(0, 12 - 5 + 1)).toEqual(stopsA.slice(0, 12 - 5 + 1)); // Up to and including bar 12
    expect(stopsB[13 - 5]).not.toBe(stopsA[13 - 5]); // Bar 13 sees bar 12's close
  });
});

describe('honest backtest example: random baseline and metrics', () => {
  const bars = randomWalk(600, 3);
  const ind = { rsi: [], ema: [], atr: constant(600, 2) };
  const input = {
    candles: bars, ind, exit: fixedExit(1.5, 0.02), costs: { fee: 0.001, slippage: 0.0005 },
    segment: { name: 'IS', start: 50, end: 600 }, tradeCount: 12, longShare: 0.5, runs: 50,
  };

  it('is reproducible with a seed', () => {
    const first = randomBaseline({ ...input, seed: 123 });
    const second = randomBaseline({ ...input, seed: 123 });
    const other = randomBaseline({ ...input, seed: 124 });
    expect(second.netReturns).toEqual(first.netReturns);
    expect(other.netReturns).not.toEqual(first.netReturns);
    expect(first.matchedRuns).toBe(50);
    expect(first.meanTrades).toBe(12);
  });

  it('computes percentile, quantiles, profit factor and drawdown as documented', () => {
    expect(percentileRank(0.1, [0, 0.1, 0.2, -0.1])).toBe(50); // Strictly lower only
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(quantile([0, 10], 0.05)).toBeCloseTo(0.5, 12);
    expect(computeMetrics([]).profitFactor).toBeNull();
    expect(computeMetrics([{ return: 0.1, marks: [] }]).profitFactor).toBeNull(); // No losing trade
    const m = computeMetrics([{ return: 0.1, marks: [] }, { return: -0.05, marks: [-0.2] }]);
    expect(m.netReturn).toBeCloseTo(1.1 * 0.95 - 1, 12);
    expect(m.profitFactor).toBeCloseTo(0.1 / (1.1 * 0.05), 12);
    expect(m.maxDrawdown).toBeCloseTo(0.2, 12); // Marked-to-market low while in the trade
    expect(m.winRate).toBe(0.5);
  });
});
