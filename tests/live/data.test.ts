import { describe, expect, it } from 'vitest';
import {
  getCandles, getQuote, getQuotes, getSymbolInfo, getTechnicalAnalysis, searchIndicators, searchMarkets,
  watchCandles, watchQuotes, getIndicatorData,
} from '../../src/data/index.js';
import { LIVE, minGap } from './env.js';

describe.skipIf(!LIVE)('live: high-level data API', () => {
  it('gets daily candles', async () => {
    const candles = await getCandles({ symbol: 'BINANCE:BTCEUR', timeframe: 'D', count: 20 });
    expect(candles).toHaveLength(20);
    expect(minGap(candles.map((c) => c.time))).toBe(86_400);
    expect(candles[0].time).toBeLessThan(candles[19].time);
  });

  it('loads deep history and a from/to range', async () => {
    const deep = await getCandles({ symbol: 'BINANCE:BTCEUR', timeframe: '60', count: 3_000, timeoutMs: 30_000 });
    expect(deep.length).toBeGreaterThanOrEqual(3_000);
    const from = Math.floor(Date.now() / 1000) - 7 * 86_400;
    const range = await getCandles({ symbol: 'BINANCE:BTCEUR', timeframe: '240', from });
    expect(range[0].time).toBeGreaterThanOrEqual(from);
    expect(range.length).toBeGreaterThanOrEqual(40);
  });

  it('gets custom chart types', async () => {
    for (const chartType of ['HeikinAshi', 'Renko', 'LineBreak', 'Kagi', 'PointAndFigure', 'Range'] as const) {
      const candles = await getCandles({ symbol: 'BINANCE:BTCEUR', timeframe: 'D', count: 10, chartType });
      expect(candles.length, chartType).toBeGreaterThan(0);
    }
  });

  it('watches candles and stops cleanly', async () => {
    let updates = 0;
    const watcher = await watchCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: '1', count: 5 }, {
      onData: () => { updates += 1; },
    });
    expect(watcher.latest).toHaveLength(5);
    expect(updates).toBeGreaterThanOrEqual(1);
    await watcher.stop();
    expect(watcher.isActive).toBe(false);
  });

  it('gets and watches quotes', async () => {
    const quote = await getQuote('BINANCE:BTCEUR');
    expect(typeof quote.lp).toBe('number');
    const quotes = await getQuotes({ symbols: ['BINANCE:BTCEUR', 'NASDAQ:AAPL'], fields: 'price' });
    expect(Object.keys(quotes).sort()).toEqual(['BINANCE:BTCEUR', 'NASDAQ:AAPL']);
    const watcher = await watchQuotes({ symbols: ['BINANCE:BTCUSDT'] }, { onData: () => {} });
    expect(watcher.latest['BINANCE:BTCUSDT']?.lp).toBeTypeOf('number');
    await watcher.stop();
  });

  it('reports errors with codes', async () => {
    await expect(getCandles('XXXXX')).rejects.toMatchObject({ code: 'SYMBOL_ERROR' });
    await expect(getQuote('XXXX:NOPE')).rejects.toMatchObject({ code: 'QUOTE_ERROR' });
    await expect(getCandles({ symbol: 'BINANCE:BTCEUR', timeframe: 'XX' })).rejects.toMatchObject({ code: 'CRITICAL_ERROR' });
  });

  it('resolves symbol info', async () => {
    // Anonymous sessions may be served by a substitute feed (full_name BATS:AAPL); pro_name stays NASDAQ:AAPL.
    expect(await getSymbolInfo('NASDAQ:AAPL')).toMatchObject({ pro_name: 'NASDAQ:AAPL', currency_code: 'USD' });
  });

  it('runs a built-in study without an account', async () => {
    const { values } = await getIndicatorData({ symbol: 'BINANCE:BTCEUR', indicator: 'Volume@tv-basicstudies-241', count: 10 });
    expect(values.at(-1)?.plot_0).toBeTypeOf('number');
  });

  it('searches markets and indicators, and gets technical analysis', async () => {
    expect((await searchMarkets('BINANCE:')).length).toBeGreaterThan(10);
    expect((await searchMarkets('nasdaq apple'))[0]?.id).toBe('NASDAQ:AAPL');
    expect((await searchIndicators('RSI')).length).toBeGreaterThan(10);
    const ta = await getTechnicalAnalysis('BINANCE:BTCUSD');
    for (const period of ['1', '5', '15', '60', '240', '1D', '1W', '1M'] as const) {
      expect(ta?.[period]).toMatchObject({ Other: expect.any(Number), All: expect.any(Number), MA: expect.any(Number) });
    }
  });
});
