import { describe, expect, it } from 'vitest';
import { mergeStrategyReport, summarizeStrategyReport, type StrategyReport } from '../../src/chart/strategy.js';

const empty = (): StrategyReport => ({ trades: [], history: {}, performance: {} });

describe('strategy report normalization', () => {
  it('keeps buy-and-hold history without equity and preserves omitted series on updates', () => {
    const report = empty();
    expect(mergeStrategyReport(report, { buyHold: [1, 2], buyHoldPercent: [0, 0.1] }))
      .toEqual(['report.history']);
    mergeStrategyReport(report, { equity: [10, 11] });
    mergeStrategyReport(report, { buyHold: [] });
    expect(report.history).toEqual({ buyHold: [], buyHoldPercent: [0, 0.1], equity: [10, 11] });
    expect(mergeStrategyReport(report, { equity: null, buyHold: 'invalid' })).toEqual([]);
    expect(report.history.equity).toEqual([10, 11]);
  });

  it('uses aggregate counts even when every trade record has an exit valuation', () => {
    const report = empty();
    // Synthetic data reproduces the observed shape, not private strategy results.
    mergeStrategyReport(report, {
      currency: 'USD',
      performance: { all: { totalTrades: 2, totalOpenTrades: 1, netProfit: 12 }, openPL: -3 },
      trades: Array.from({ length: 3 }, (_, i) => ({
        e: { c: 'Entry', tp: 'le', p: 100, tm: i * 1000 },
        x: { c: '', p: 97, tm: (i + 1) * 1000 }, q: 1,
        tp: { v: -3, p: -0.03 }, cp: { v: 9, p: 0.09 },
        rn: { v: 1, p: 0.01 }, dd: { v: 3, p: 0.03 },
      })),
    });
    const before = structuredClone(report);
    expect(summarizeStrategyReport(report)).toEqual({
      currency: 'USD', tradeRecordCount: 3, closedTradeCount: 2, openTradeCount: 1,
      closedNetProfit: 12, openPnL: -3, totalPnL: 9,
    });
    expect(report).toEqual(before);
  });

  it('does not invent zero counts or total PnL for missing or invalid aggregates', () => {
    const report = empty();
    expect(summarizeStrategyReport(report)).toMatchObject({
      tradeRecordCount: 0, closedTradeCount: undefined, openTradeCount: undefined,
      closedNetProfit: undefined, openPnL: undefined, totalPnL: undefined,
    });
    mergeStrategyReport(report, {
      performance: { all: { totalTrades: -1, totalOpenTrades: 0.5, netProfit: 12 } },
    });
    expect(summarizeStrategyReport(report)).toMatchObject({
      closedTradeCount: undefined, openTradeCount: undefined, closedNetProfit: 12, totalPnL: undefined,
    });
    mergeStrategyReport(report, {
      performance: { all: { totalTrades: 0, totalOpenTrades: 0, netProfit: 0 }, openPL: 0 },
    });
    expect(summarizeStrategyReport(report)).toMatchObject({ closedTradeCount: 0, openTradeCount: 0, totalPnL: 0 });
    mergeStrategyReport(report, { performance: { all: { netProfit: Infinity }, openPL: NaN } });
    expect(summarizeStrategyReport(report)).toMatchObject({ closedNetProfit: undefined, openPnL: undefined, totalPnL: undefined });
  });
});
