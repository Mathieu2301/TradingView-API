import { describe, expect, it } from 'vitest';
import {
  BuiltInIndicator, getIndicator, TradingViewClient, type TradingViewError,
} from '../../src/index.js';
import { LIVE, minGap, wait } from './env.js';

describe.skipIf(!LIVE)('live: low-level sessions', () => {
  it('changes market, timeframe, timezone and chart type on one chart', async () => {
    const client = new TradingViewClient();
    const chart = client.createChart();
    const completed = () => new Promise((resolve) => { chart.once('seriesCompleted', resolve); });

    chart.setMarket('BINANCE:BTCEUR', { timeframe: 'D' });
    await completed();
    expect(chart.symbolInfo?.full_name).toBe('BINANCE:BTCEUR');
    expect(minGap(chart.candles.map((c) => c.time))).toBe(86_400);

    chart.setTimeframe('15');
    await completed();
    expect(minGap(chart.candles.map((c) => c.time))).toBe(900);

    chart.setTimezone('Europe/Paris');
    chart.setMarket('BINANCE:ETHEUR', { timeframe: 'D', type: 'HeikinAshi' });
    await completed();
    expect(chart.symbolInfo?.full_name).toBe('BINANCE:ETHEUR');

    chart.fetchMore(50);
    await completed();
    expect(chart.candles.length).toBeGreaterThan(100);
    chart.delete();
    await client.close();
  });

  it('loads bars after a past reference with a negative count', async () => {
    const client = new TradingViewClient();
    const chart = client.createChart();
    chart.setMarket('BINANCE:BTCEUR', { timeframe: '240', count: -1, to: Math.round(Date.now() / 1000) - 86_400 * 7 });
    await new Promise((resolve) => { chart.once('seriesCompleted', resolve); });
    expect(chart.candles.length).toBeGreaterThan(0);
    await client.close();
  });

  it('reports server errors as typed errors', async () => {
    const client = new TradingViewClient();
    const errorOf = (setup: (chart: ReturnType<typeof client.createChart>) => void) => new Promise<TradingViewError>((resolve) => {
      const chart = client.createChart();
      chart.on('error', resolve);
      setup(chart);
    });
    expect((await errorOf((c) => c.setMarket('XXXXX'))).code).toBe('SYMBOL_ERROR');
    expect((await errorOf((c) => { c.setMarket('BINANCE:BTCEUR'); c.setTimezone('Nowhere/Nowhere'); })).message)
      .toBe('Critical error: invalid timezone');
    expect((await errorOf((c) => c.setMarket('BINANCE:BTCEUR', { timeframe: 'XX' }))).code).toBe('CRITICAL_ERROR');
    const premium = await errorOf((c) => c.setMarket('BINANCE:BTCEUR', { timeframe: '15', type: 'Renko' }));
    expect(premium.code).toBe('SERIES_ERROR');
    expect(premium.message).toMatch(/study_not_auth/);
    await client.close();
  });

  it('streams quotes through a quote session', async () => {
    const client = new TradingViewClient();
    const session = client.createQuoteSession({ fields: 'all' });
    const btc = session.subscribe('BINANCE:BTCEUR');
    await new Promise<void>((resolve) => { btc.once('loaded', () => resolve()); });
    expect(Object.keys(btc.data)).toEqual(expect.arrayContaining(['lp', 'ch', 'chp', 'description', 'currency_code', 'bid', 'ask']));
    btc.close();
    session.delete();
    await client.close();
  });

  it('replays history step by step', async () => {
    const client = new TradingViewClient();
    const chart = client.createChart();
    chart.setMarket('BINANCE:BTCEUR', { timeframe: 'D', replay: Math.round(Date.now() / 1000) - 86_400 * 5, count: 1 });
    await new Promise((resolve) => { chart.once('replayLoaded', resolve); });
    let ended = false;
    chart.once('replayEnd', () => { ended = true; });
    for (let i = 0; i < 20 && !ended; i += 1) await chart.replayStep(1);
    await wait(500);
    expect(ended).toBe(true);
    expect(minGap(chart.candles.map((c) => c.time))).toBe(86_400);
    await client.close();
  });

  it('reads a volume profile built-in study with graphics', async () => {
    const client = new TradingViewClient();
    const chart = client.createChart();
    chart.setMarket('BINANCE:BTCEUR', { timeframe: '60' });
    const profile = new BuiltInIndicator('VbPFixed@tv-basicstudies-241!');
    profile.setOption('first_bar_time', Date.now() - 10 ** 8);
    const study = chart.createStudy(profile);
    for (let i = 0; i < 100 && !study.graphics.horizHists.length; i += 1) await wait(100);
    expect(study.graphics.horizHists.length).toBeGreaterThan(5);
    study.remove();
    expect(chart.studies).toEqual([]);
    await client.close();
  });

  it('loads Pine indicator definitions', async () => {
    const strategy = await getIndicator('STD;Supertrend%Strategy');
    expect(strategy.description).toMatch(/supertrend strategy/i);
    strategy.setInput('commission_type', 'percent').setInput('initial_capital', 25_000);
    await expect(getIndicator('STD;XXXXXXX')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
