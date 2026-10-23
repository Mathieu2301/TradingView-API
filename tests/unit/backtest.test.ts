import { describe, expect, it } from 'vitest';
import {
  atrExit, atrTrailingExit, backtest, backtestMany, chartData, checkCausality, computeMetrics, createRng, defaultExits, ema, fillPrice, findPivots,
  fixedExit, formatReport, formatWarning, freezeSnapshot, loadSnapshot, percentileRank, quantile, randomBaseline, rsiDivergence,
  runBacktest, simulate, sma, splitSegments, tradeReturn, tradesToCsv, TradingViewError,
  type Bar, type Entry, type Signal, type SignalFunction,
} from '../../src/backtest/index.js';
import type { MarketDataProvider } from '../../src/data/provider.js';

const HOUR = 3_600;
const NO_COSTS = { fee: 0, slippage: 0 };

/** Flat bars: open = close = 100, high 101, low 99, one every 4 hours. */
function flatBars(n: number): Bar[] {
  return Array.from({ length: n }, (_, i) => ({ time: i * 4 * HOUR, open: 100, high: 101, low: 99, close: 100, volume: 1 }));
}

/** Seeded random walk, valid OHLC, with a small gap between each close and the next open. */
function randomWalk(n: number, seed: number): Bar[] {
  const rng = createRng(seed);
  let price = 100;
  return Array.from({ length: n }, (_, i) => {
    const open = price * (1 + (rng() - 0.5) * 0.002);
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

const longAt = (entryBar: number): Entry => ({ direction: 'long', signalBar: entryBar - 1, entryBar });
const whole = (bars: Bar[]) => ({ name: 'ALL', start: 0, end: bars.length });
const fixed2R = fixedExit({ stopPct: 0.02, targetR: 2 });
const SMALL = { rsiLength: 14, emaLength: 50, pivotLookback: 3 };

/** Long when the close crosses above its SMA(20): causal. */
const smaCross: SignalFunction = Object.assign((candles: readonly Bar[]) => {
  const closes = candles.map((c) => c.close);
  const avg = sma(closes, 20);
  const out: Signal[] = [];
  for (let i = 20; i < candles.length; i++) {
    if (closes[i - 1] <= avg[i - 1] && closes[i] > avg[i]) out.push({ bar: i, direction: 'long', refs: { cross: i } });
  }
  return out;
}, { warmupBars: 19, label: 'SMA(20) cross' });

describe('backtest: snapshot', () => {
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

  it('rejects unordered or inconsistent candles', () => {
    const bars = flatBars(5);
    [bars[1], bars[2]] = [bars[2]!, bars[1]!];
    expect(() => freezeSnapshot(bars, { barSeconds: 4 * HOUR, now: 1e12 })).toThrow(/ordered/);
    const broken = flatBars(5);
    broken[2] = { ...broken[2]!, high: 50 };
    expect(() => freezeSnapshot(broken, { now: 1e12 })).toThrow(/OHLC/);
  });

  it('infers the bar duration and replays a saved snapshot only with a matching checksum', () => {
    const snapshot = freezeSnapshot(flatBars(20), { symbol: 'X:Y', timeframe: '240', now: 1e12 });
    expect(snapshot.barSeconds).toBe(4 * HOUR);
    const saved = JSON.stringify(snapshot);
    const replay = loadSnapshot(saved);
    expect(replay.sha256).toBe(snapshot.sha256);
    expect(replay.candles).toEqual(snapshot.candles);
    const tampered = JSON.parse(saved);
    tampered.candles[3].close = 100.5;
    expect(() => loadSnapshot(tampered)).toThrow(/checksum/);
  });
});

describe('backtest: no look-ahead', () => {
  it('confirms a pivot only lookback bars later', () => {
    const lows = [10, 9, 8, 7, 6, 5, 6, 7, 8, 9, 10, 11];
    expect(findPivots(lows, 3, 'low')).toEqual([{ bar: 5, confirmBar: 8, price: 5 }]);
    // Without bar 8, the same pivot cannot be known yet.
    expect(findPivots(lows.slice(0, 8), 3, 'low')).toEqual([]);
  });

  it('fires the divergence on the confirmation bar, never on the pivot', () => {
    const bars = freezeSnapshot(randomWalk(1500, 11), { now: 1e12 }).candles;
    const signal = rsiDivergence(SMALL);
    const signals = signal(bars);
    expect(signals.length).toBeGreaterThan(5);
    for (const s of signals) {
      expect(s.bar).toBe(s.refs!.pivot! + 3);
      const key = (list: readonly Signal[]) => list.some((x) => x.bar === s.bar && x.direction === s.direction);
      expect(key(signal(bars.slice(0, s.bar + 1)))).toBe(true); // Known at the close of its bar...
      expect(key(signal(bars.slice(0, s.bar)))).toBe(false); // ...and not one bar earlier.
    }
  });

  it('enters at the open of the bar after the signal', () => {
    const report = runBacktest(randomWalk(1200, 7), { signal: rsiDivergence(SMALL), runs: 0 });
    const candles = freezeSnapshot(randomWalk(1200, 7)).candles;
    expect(report.trades.length).toBeGreaterThan(0);
    for (const trade of report.trades) {
      expect(trade.entryBar).toBe(trade.signalBar + 1);
      expect(trade.entryOpen).toBe(candles[trade.entryBar]!.open);
      expect(trade.entryOpen).not.toBe(candles[trade.signalBar]!.close);
    }
    const costs = { fee: 0, slippage: 0.0005 };
    const bars = randomWalk(40, 1);
    const { trades } = simulate({ candles: bars, entries: [longAt(24)], exit: fixed2R, costs, segment: whole(bars) });
    expect(trades[0]!.entryOpen).toBe(bars[24]!.open);
    expect(trades[0]!.entryPrice).toBeCloseTo(bars[24]!.open * 1.0005, 10);
  });

  it('stops the run with LOOK_AHEAD when a signal uses later bars', () => {
    const bars = randomWalk(1200, 7);
    const honest = rsiDivergence(SMALL);
    const backdated: SignalFunction = (candles) => honest(candles).map((s) => ({ ...s, bar: s.refs!.pivot! }));
    const error = (() => {
      try {
        runBacktest(bars, { signal: backdated, runs: 0 });
      } catch (caught) {
        return caught;
      }
      return null;
    })();
    expect(error).toBeInstanceOf(TradingViewError);
    expect((error as TradingViewError).code).toBe('LOOK_AHEAD');
    expect((error as TradingViewError).message).toMatch(/uses bars after its own bar/);
    // Peeking at the next close is caught too.
    const peek: SignalFunction = (candles) => candles.flatMap((c, i) => (candles[i + 1] && candles[i + 1]!.close > c.close * 1.015 ? [{ bar: i, direction: 'long' as const }] : []));
    expect(() => runBacktest(bars, { signal: peek, runs: 0, warmupBars: 10 })).toThrow(/LOOK_AHEAD|after its own bar/);
  });

  it('flags a signal that changes when later bars arrive (repaint)', () => {
    const candles = freezeSnapshot(randomWalk(400, 5), { now: 1e12 }).candles;
    // Signals on the 10 last bars of whatever history it gets: they move when history grows.
    const repaint: SignalFunction = (bars) => bars.slice(-10).map((_, k) => ({ bar: bars.length - 10 + k, direction: 'long' }));
    const { violations } = checkCausality(repaint, candles, { fromBar: 50 });
    expect(violations.some((v) => v.kind === 'repaint')).toBe(true);
    expect(checkCausality(smaCross, candles).violations).toEqual([]);
  });

  it('validates what the signal function returns', () => {
    const bars = flatBars(300);
    expect(() => runBacktest(bars, { signal: () => [{ bar: 1.5, direction: 'long' }] })).toThrow(/invalid bar/);
    expect(() => runBacktest(bars, { signal: () => [{ bar: 400, direction: 'long' }] })).toThrow(/invalid bar/);
    expect(() => runBacktest(bars, { signal: () => [{ bar: 10, direction: 'up' as never }] })).toThrow(/invalid direction/);
    expect(() => runBacktest(bars, { signal: (() => 'long') as never })).toThrow(/array/);
    expect(() => runBacktest(bars, {} as never)).toThrow(/signal must be a function/);
  });
});

describe('backtest: fills and costs', () => {
  it('counts a bar touching both target and stop as a loss', () => {
    const bars = flatBars(10);
    bars[3] = { ...bars[3]!, high: 110, low: 90 };
    const { trades } = simulate({ candles: bars, entries: [longAt(2)], exit: fixed2R, costs: NO_COSTS, segment: whole(bars) });
    expect(trades[0]).toMatchObject({ exitBar: 3, exitLevel: 98, reason: 'stop_and_target_same_bar' });
    expect(trades[0]!.return).toBeCloseTo(-0.02, 12);
  });

  it('fills a gap through the stop at the worse open, and a gap through the target at the open', () => {
    const bars = flatBars(10);
    bars[3] = { ...bars[3]!, open: 95, high: 96, low: 94, close: 95 };
    const { trades } = simulate({ candles: bars, entries: [longAt(2)], exit: fixed2R, costs: NO_COSTS, segment: whole(bars) });
    expect(trades[0]).toMatchObject({ exitBar: 3, exitLevel: 95, reason: 'stop_gap' });
    const up = flatBars(10);
    up[3] = { ...up[3]!, open: 106, high: 107, low: 105, close: 106 };
    const win = simulate({ candles: up, entries: [longAt(2)], exit: fixed2R, costs: NO_COSTS, segment: whole(up) }).trades[0]!;
    expect(win).toMatchObject({ exitBar: 3, exitLevel: 106, reason: 'target_gap' });
  });

  it('applies fee and adverse slippage on entry and exit, long and short', () => {
    const fee = 0.001;
    const slippage = 0.0005;
    const bars = flatBars(10);
    bars[3] = { ...bars[3]!, high: 105 }; // Long target 104 hit
    const long = simulate({ candles: bars, entries: [longAt(2)], exit: fixed2R, costs: { fee, slippage }, segment: whole(bars) }).trades[0]!;
    expect(long.entryPrice).toBeCloseTo(100.05, 10);
    expect(long.exitPrice).toBeCloseTo(104 * 0.9995, 10);
    expect(long.return).toBeCloseTo(103.948 / 100.05 - 1 - fee - fee * (103.948 / 100.05), 12);

    const shortBars = flatBars(10);
    shortBars[3] = { ...shortBars[3]!, low: 95 }; // Short target 96 hit
    const short = simulate({ candles: shortBars, entries: [{ ...longAt(2), direction: 'short' }], exit: fixed2R, costs: { fee, slippage }, segment: whole(shortBars) }).trades[0]!;
    expect(short.entryPrice).toBeCloseTo(99.95, 10);
    expect(short.exitPrice).toBeCloseTo(96 * 1.0005, 10);
    expect(short.return).toBeCloseTo(1 - 96.048 / 99.95 - fee - fee * (96.048 / 99.95), 12);
    expect(fillPrice('exit', 'short', 100, slippage)).toBeCloseTo(100.05, 10);
  });

  it('charges the same costs in the random baseline', () => {
    const bars = flatBars(30); // Never reaches a 2% stop or target: every trade ends at the segment close
    const costs = { fee: 0.001, slippage: 0.0005 };
    const baseline = randomBaseline({
      candles: bars, exit: fixed2R, costs, segment: whole(bars), tradeCount: 1, longShare: 1, runs: 20, seed: 1,
    });
    const expected = tradeReturn('long', 100.05, 100 * 0.9995, costs.fee);
    expect(expected).toBeLessThan(-0.002);
    expect(baseline.netReturns).toHaveLength(20);
    for (const value of baseline.netReturns) expect(value).toBeCloseTo(expected, 12);
  });

  it('passes the fee and slippage options through the full run', () => {
    const bars = randomWalk(800, 21);
    const free = runBacktest(bars, { signal: smaCross, runs: 0, fee: 0, slippage: 0 });
    const paid = runBacktest(bars, { signal: smaCross, runs: 0, fee: 0.002, slippage: 0.001 });
    expect(paid.settings).toMatchObject({ fee: 0.002, slippage: 0.001 });
    const first = (r: typeof free) => r.trades.find((t) => t.exit === 'fixed_2R')!;
    expect(first(paid).entryPrice).toBeCloseTo(first(free).entryOpen * 1.001, 10);
    expect(first(paid).return).toBeLessThan(first(free).return);
  });
});

describe('backtest: split', () => {
  it('never lets a position cross a segment boundary', () => {
    const bars = flatBars(20);
    const segments = splitSegments(20, 0, 0.5);
    // Signal on the last in-sample bar, entry on the first out-of-sample bar: taken by neither.
    const straddling = longAt(10);
    expect(simulate({ candles: bars, entries: [straddling], exit: fixed2R, costs: NO_COSTS, segment: segments.inSample }).trades).toEqual([]);
    expect(simulate({ candles: bars, entries: [straddling], exit: fixed2R, costs: NO_COSTS, segment: segments.outOfSample }).trades).toEqual([]);
    // A trade still open at the end of the segment is closed on its last bar.
    const { trades } = simulate({ candles: bars, entries: [longAt(5)], exit: fixed2R, costs: NO_COSTS, segment: segments.inSample });
    expect(trades[0]).toMatchObject({ exitBar: 9, reason: 'segment_end' });
  });

  it('keeps every trade of a full run inside its segment, after the warm-up', () => {
    const bars = randomWalk(1200, 7);
    const report = runBacktest(bars, { signal: rsiDivergence(SMALL), runs: 10 });
    const { warmup, inSample, outOfSample } = report.segments;
    expect(report.settings.warmupBars).toBe(49);
    expect(warmup).toMatchObject({ start: 0, end: 49, bars: 49 });
    expect(inSample.start).toBe(49);
    expect(inSample.end).toBe(outOfSample.start);
    expect(outOfSample.end).toBe(bars.length);
    expect(inSample.startTime).toBe(bars[49]!.time);
    expect(report.trades.length).toBeGreaterThan(0);
    for (const trade of report.trades) {
      const segment = trade.split === 'IS' ? inSample : outOfSample;
      expect(trade.signalBar).toBeGreaterThanOrEqual(segment.start);
      expect(trade.exitBar).toBeLessThan(segment.end);
      expect(trade.exitTime).toBe(bars[trade.exitBar]!.time);
    }
    expect(report.rows).toHaveLength(8);
    expect(report.rows.map((r) => `${r.exit}/${r.split}`)).toEqual([
      'fixed_1.5R/IS', 'fixed_1.5R/OOS', 'fixed_2R/IS', 'fixed_2R/OOS', 'atr1.5_2R/IS', 'atr1.5_2R/OOS', 'trail_atr3/IS', 'trail_atr3/OOS',
    ]);
    for (const signal of report.signals.filter((s) => s.split !== null)) {
      const segment = signal.split === 'IS' ? inSample : outOfSample;
      expect(signal.bar >= segment.start && signal.entryBar < segment.end).toBe(true);
    }
  });
});

describe('backtest: trailing stop', () => {
  // Rising bars: close = 100.5 + i, ATR(1) = 1.5 on every bar, multiplier 2 => the stop never triggers.
  const rising = (n: number): Bar[] => Array.from({ length: n }, (_, i) => ({
    time: i * 4 * HOUR, open: 100 + i, high: 101 + i, low: 99.5 + i, close: 100.5 + i, volume: 1,
  }));
  const exit = atrTrailingExit({ mult: 2, length: 1 });
  const atrOf = (bars: Bar[], i: number) => Math.max(bars[i]!.high - bars[i]!.low, i ? Math.abs(bars[i]!.high - bars[i - 1]!.close) : 0);

  it('ratchets from closed bars only', () => {
    const bars = rising(30);
    const { trades } = simulate({ candles: bars, entries: [longAt(5)], exit, costs: NO_COSTS, segment: whole(bars), trace: true });
    const stops = trades[0]!.stops!;
    expect(stops[0]).toBe(bars[5]!.open - 2 * atrOf(bars, 4)); // From the signal bar ATR, before any trailing
    for (let j = 1; j < stops.length; j++) {
      // The stop used on bar 5 + j comes from the close of bar 5 + j - 1, never from bar 5 + j itself.
      expect(stops[j]).toBe(Math.max(stops[j - 1]!, bars[5 + j - 1]!.close - 2 * atrOf(bars, 5 + j - 1)));
    }
  });

  it('is unchanged on a bar when that bar or later bars change', () => {
    const a = rising(30);
    const b = rising(30).map((bar, i) => (i >= 12 ? { ...bar, high: bar.high + 500, close: bar.close + 400, open: bar.open + 300 } : bar));
    const run = (bars: Bar[]) => simulate({ candles: bars, entries: [longAt(5)], exit, costs: NO_COSTS, segment: whole(bars), trace: true }).trades[0]!.stops!;
    const stopsA = run(a);
    const stopsB = run(b);
    expect(stopsB.slice(0, 12 - 5 + 1)).toEqual(stopsA.slice(0, 12 - 5 + 1)); // Up to and including bar 12
    expect(stopsB[13 - 5]).not.toBe(stopsA[13 - 5]); // Bar 13 sees bar 12's close
  });
});

describe('backtest: exits', () => {
  it('builds the four reference exits and stop-only variants', () => {
    expect(defaultExits().map((e) => e.id)).toEqual(['fixed_1.5R', 'fixed_2R', 'atr1.5_2R', 'trail_atr3']);
    const bars = flatBars(30);
    const ctx = { direction: 'short' as const, entryOpen: 100, signalBar: 20, candles: bars };
    expect(fixedExit({ stopPct: 0.05, targetR: null }).levels(ctx)).toEqual({ stop: 105, target: null });
    expect(atrExit({ mult: 2, targetR: 3, length: 14 }).levels(ctx)).toEqual({ stop: 104, target: 88 });
    expect(atrExit({ mult: 2, targetR: 3, length: 14 }).levels({ ...ctx, signalBar: 5 })).toBeNull(); // ATR not defined yet
    expect(() => fixedExit({ stopPct: -1, targetR: 2 })).toThrow(/stopPct/);
  });

  it('rejects duplicate exit ids and bad options', () => {
    const bars = flatBars(300);
    expect(() => runBacktest(bars, { signal: smaCross, exits: [fixed2R, fixed2R] })).toThrow(/unique/);
    expect(() => runBacktest(bars, { signal: smaCross, splitRatio: 1 })).toThrow(/splitRatio/);
    expect(() => runBacktest(bars, { signal: smaCross, runs: -1 })).toThrow(/runs/);
  });
});

describe('backtest: random baseline and metrics', () => {
  const bars = randomWalk(600, 3);
  const input = {
    candles: bars, exit: fixedExit({ stopPct: 0.02, targetR: 1.5 }), costs: { fee: 0.001, slippage: 0.0005 },
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
    expect(computeMetrics([]).winRate).toBeNull();
    expect(computeMetrics([{ return: 0.1, marks: [] }]).profitFactor).toBeNull(); // No losing trade
    const m = computeMetrics([{ return: 0.1, marks: [] }, { return: -0.05, marks: [-0.2] }]);
    expect(m.netReturn).toBeCloseTo(1.1 * 0.95 - 1, 12);
    expect(m.profitFactor).toBeCloseTo(0.1 / (1.1 * 0.05), 12);
    expect(m.maxDrawdown).toBeCloseTo(0.2, 12); // Marked-to-market low while in the trade
    expect(m.winRate).toBe(0.5);
  });

  it('gives the same report twice and a percentile per row', () => {
    const run = () => runBacktest(randomWalk(900, 9), { signal: smaCross, runs: 30 });
    // Same data and seed => same report, apart from the run and freeze times.
    const stable = (r: ReturnType<typeof run>) => JSON.stringify({ ...r, createdAt: 0, snapshot: { ...r.snapshot, fetchedAt: 0 } });
    const a = run();
    expect(stable(run())).toBe(stable(a));
    for (const row of a.rows.filter((r) => r.metrics.trades > 0)) {
      expect(row.baseline).toMatchObject({ runs: 30 });
      expect(row.baseline).not.toHaveProperty('netReturns');
      expect(row.percentile).toBeGreaterThanOrEqual(0);
    }
    const none = runBacktest(randomWalk(900, 9), { signal: smaCross, runs: 0 });
    expect(none.rows.every((r) => r.baseline === null && r.percentile === null)).toBe(true);
  });
});

describe('backtest: report and one-call API', () => {
  it('exports JSON, text and CSV with the signal refs', () => {
    const bars = randomWalk(900, 9);
    const report = runBacktest(bars, { signal: smaCross, runs: 10 });
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
    expect(report.settings.signal).toEqual({ id: 'custom', params: {}, label: 'SMA(20) cross' });
    expect(report.causality.reruns).toBeGreaterThan(0);
    expect(report.causality.checkedSignals).toBe(Math.min(100, report.causality.totalSignals));
    const text = formatReport(report);
    for (const part of ['== Split', 'Out-of-sample:', 'no look-ahead found', 'Rand p50', 'WARNING: Only']) expect(text).toContain(part);
    const csv = tradesToCsv(report.trades).trim().split('\n');
    expect(csv[0]).toBe('exit,split,direction,cross_time,signal_time,entry_time,entry_open,entry_price,initial_stop,target,exit_time,exit_level,exit_price,exit_reason,return_pct');
    expect(csv).toHaveLength(report.trades.length + 1);
    expect(csv[1]!.split(',')[3]).toBe(csv[1]!.split(',')[4]); // The cross is the signal bar
  });

  it('downloads candles once through a provider, drops the forming bar and runs', async () => {
    const now = Math.floor(Date.now() / 1000);
    const bars = randomWalk(900, 4).map((bar, i) => ({ ...bar, time: now - (899 - i) * 4 * HOUR - 60, volume: 1 }));
    const queries: unknown[] = [];
    const provider: MarketDataProvider = {
      async watchCandles(query, handlers) {
        queries.push(query);
        handlers.onData(bars);
        return { latest: bars, symbolInfo: undefined, stop: async () => undefined } as never;
      },
    };
    const { report, snapshot } = await backtest({ symbol: 'TEST:X', timeframe: '240', years: 0.1, signal: smaCross, runs: 5, provider });
    expect(queries).toHaveLength(1);
    expect(queries[0]).toMatchObject({ symbol: 'TEST:X', timeframe: '240', count: Math.ceil((0.1 * 365.25 * 86_400) / (4 * HOUR)) + 19 + 1 }); // Warm-up from the signal
    expect(snapshot.droppedFormingBar).toBe(true);
    expect(snapshot.count).toBe(899);
    expect(report.snapshot).toMatchObject({ symbol: 'TEST:X', timeframe: '240', sha256: snapshot.sha256 });
    expect(report.snapshot).not.toHaveProperty('candles');
    const replay = await backtest({ symbol: 'TEST:X', snapshot: loadSnapshot(JSON.stringify(snapshot)), signal: smaCross, runs: 5 });
    expect(replay.report.rows).toEqual(report.rows);
    await expect(backtest({ symbol: 'TEST:X', timeframe: '1T' as never, signal: smaCross })).rejects.toThrow(/time-based/);
  });

  it('keeps ema and sma causal', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(sma(values, 3).slice(2)).toEqual([2, 3, 4, 5, 6, 7]);
    expect(ema(values.slice(0, 5), 3)).toEqual(ema(values, 3).slice(0, 5));
  });
});

describe('backtest: page and chart data', () => {
  const bars = randomWalk(1200, 7);
  const signal = rsiDivergence(SMALL);
  const run = () => runBacktest(bars, { signal, runs: 5 });

  it('returns identifiers and parameters, not interface text', () => {
    const report = run();
    expect(report.library).toEqual({ name: '@mathieuc/tradingview', version: expect.stringMatching(/^4\./) });
    expect(report.createdAt).toBeGreaterThan(1.7e9);
    expect(report.snapshot.fetchedAt).toBeGreaterThan(1.7e9);
    expect(report.settings.signal).toMatchObject({
      id: 'rsi_divergence', params: { rsiLength: 14, emaLength: 50, pivotLookback: 3, minPivotDistance: 5, maxPivotDistance: 60, trendFilter: true },
    });
    expect(report.settings.exits.map((e) => [e.id, e.kind, e.params])).toEqual([
      ['fixed_1.5R', 'fixed', { stopPct: 0.02, targetR: 1.5 }],
      ['fixed_2R', 'fixed', { stopPct: 0.02, targetR: 2 }],
      ['atr1.5_2R', 'atr', { mult: 1.5, targetR: 2, length: 14 }],
      ['trail_atr3', 'atr_trailing', { mult: 3, length: 14 }],
    ]);
    expect(report.rows[0]).not.toHaveProperty('exitLabel');
    expect(report.warnings.map((w) => w.code)).toContain('short_history');
    for (const w of report.warnings) expect(formatWarning(w)).not.toMatch(/^\{/);
    expect(new Set(report.trades.map((t) => t.reason)).size).toBeGreaterThan(0);
  });

  it('gives buy and hold per segment with the same costs, and refs as bar indices', () => {
    const report = run();
    const { inSample, outOfSample } = report.segments;
    const expected = (s: typeof inSample) => (bars[s.end - 1]!.close * 0.9995) / (bars[s.start]!.open * 1.0005) - 1 - 0.001 - 0.001 * ((bars[s.end - 1]!.close * 0.9995) / (bars[s.start]!.open * 1.0005));
    expect(inSample.buyHold).toBeCloseTo(expected(inSample), 12);
    expect(outOfSample.buyHold).toBeCloseTo(expected(outOfSample), 12);
    for (const t of report.trades) {
      expect(t.refBars.pivot).toBe(t.signalBar - 3);
      expect(t.refs.pivot).toBe(bars[t.refBars.pivot!]!.time);
    }
    const raw = rsiDivergence({ ...SMALL, trendFilter: false })(freezeSnapshot(bars).candles).length;
    expect(raw).toBeGreaterThanOrEqual(report.signals.length);
  });

  it('builds chart data: candles, indicators, split times, signals and trades by exit', () => {
    const snapshot = freezeSnapshot(bars);
    const report = runBacktest(snapshot, { signal, runs: 5 });
    const chart = chartData(report, snapshot, signal);
    expect(chart.bars).toHaveLength(snapshot.count);
    expect(Object.keys(chart.indicators)).toEqual(['rsi', 'ema']);
    expect(chart.indicators.ema![10]).toBeNull();
    expect(chart.indicators.ema![100]).toBeCloseTo(ema(snapshot.candles.map((c) => c.close), 50)[100]!, 12);
    expect(chart.splitTime).toBe(bars[report.segments.outOfSample.start]!.time);
    expect(chart.warmupEndTime).toBe(bars[49]!.time);
    expect(Object.keys(chart.trades)).toEqual(['fixed_1.5R', 'fixed_2R', 'atr1.5_2R', 'trail_atr3']);
    expect(Object.values(chart.trades).flat()).toHaveLength(report.trades.length);
    expect(JSON.parse(JSON.stringify(chart))).toEqual(chart);
    expect(chartData(report, snapshot).indicators).toEqual({});
    expect(() => chartData(report, freezeSnapshot(randomWalk(300, 1)))).toThrow(/not the one/);
  });

  it('runs several markets, with exits per market, and one CSV for all', async () => {
    const now = Math.floor(Date.now() / 1000);
    const series = (seed: number, step: number) => randomWalk(700, seed).map((bar, i) => ({ ...bar, time: now - (700 - i) * step, volume: 1 }));
    const provider: MarketDataProvider = {
      async watchCandles(query, handlers) {
        const data = series(query.symbol === 'TEST:A' ? 1 : 2, query.timeframe === 'D' ? 86_400 : 4 * HOUR);
        handlers.onData(data);
        return { latest: data, symbolInfo: undefined, stop: async () => undefined } as never;
      },
    };
    const results = await backtestMany({
      markets: [{ symbol: 'TEST:A', timeframe: '240' }, { symbol: 'TEST:B', timeframe: 'D' }],
      exits: (m) => [fixedExit({ stopPct: m.timeframe === 'D' ? 0.07 : 0.03, targetR: 2 })],
      signal: smaCross, runs: 5, provider,
    });
    expect(results.map((r) => r.id)).toEqual(['TEST:A_240', 'TEST:B_D']);
    expect(results[1]!.report.settings.exits[0]!.params).toEqual({ stopPct: 0.07, targetR: 2 });
    const trades = results.flatMap((r) => r.report.trades);
    expect(trades.every((t) => t.series === 'TEST:A_240' || t.series === 'TEST:B_D')).toBe(true);
    const csv = tradesToCsv(trades).split('\n');
    expect(csv[0]!.startsWith('series,exit,split,direction,cross_time')).toBe(true);
    await expect(backtestMany({ markets: [], signal: smaCross })).rejects.toThrow(/markets/);
  });
});

