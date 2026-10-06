import { describe, expect, it } from 'vitest';
import {
  getWatchlists, getCandles, getIndicator, getIndicatorData, getPrivateIndicators, getUser, TradingViewClient,
} from '../../src/index.js';
import { credentials, LIVE } from './env.js';

// Needs SESSION and SIGNATURE cookies of a TradingView account.
describe.skipIf(!LIVE || !credentials)('live: authenticated', () => {
  const auth = credentials as NonNullable<typeof credentials>;

  it('gets the account', async () => {
    const user = await getUser(auth);
    expect(user.id).toBeGreaterThan(0);
    expect(user.username).toBeTruthy();
    expect(user.authToken).toBeTruthy();
    expect(user.session).toBe(auth.session);
  });

  it('opens an authenticated connection', async () => {
    const client = new TradingViewClient({ credentials: auth });
    await client.ready;
    expect(client.isAuthenticated).toBe(true);
    await client.close();
  });

  it('runs a Pine study and a strategy report', async () => {
    const rsi = await getIndicatorData({ symbol: 'BINANCE:BTCEUR', indicator: 'STD;RSI', credentials: auth, timeoutMs: 30_000 });
    expect(rsi.values.length).toBeGreaterThan(0);

    const strategy = await getIndicator('STD;Supertrend%Strategy');
    strategy.setInput('commission_type', 'percent').setInput('default_qty_value', 20);
    const result = await getIndicatorData({
      symbol: 'BINANCE:BTCEUR', timeframe: '60', indicator: strategy, credentials: auth, timeoutMs: 30_000,
    });
    expect(result.strategyReport.performance.all?.totalTrades).toBeTypeOf('number');
  });

  it('reads watchlists without changing account content', async () => {
    const lists = await getWatchlists({ credentials: auth, signal: AbortSignal.timeout(15_000) });
    expect(Array.isArray(lists)).toBe(true);
    for (const list of lists) {
      expect(list.id).toBeTypeOf('number');
      expect(list.name).toBeTypeOf('string');
      expect(Array.isArray(list.symbols)).toBe(true);
    }
  });

  it('runs the public Pine study covered by V3', async () => {
    const result = await getIndicatorData({
      symbol: 'BINANCE:BTCEUR', timeframe: '60', count: 30,
      indicator: 'PUB;uA35GeckoTA2EfgI63SD2WCSmca4njxp',
      credentials: auth, timeoutMs: 30_000,
    });
    const latest = result.values.at(-1);
    expect(latest?.VWAP).toBeTypeOf('number');
    expect(latest?.rsiMFI).toBeTypeOf('number');
    expect(latest?.Buy_and_sell_circle).toBeTypeOf('number');
  });

  it('lists and runs the account’s first private indicators', async () => {
    const list = await getPrivateIndicators(auth);
    expect(list.length).toBeGreaterThan(0);
    for (const item of list.slice(0, 3)) {
      expect(item.id).toBeTruthy();
      expect(item.name).toBeTruthy();
      const result = await getIndicatorData({
        symbol: 'BINANCE:BTCEUR', timeframe: 'D', count: 30,
        indicator: item.id, credentials: auth, timeoutMs: 30_000,
      });
      expect(result.candles.length).toBeGreaterThan(0);
      expect(result.values.length, item.id).toBeGreaterThan(0);
    }
  });

  it('uses an account timeframe with a recent historical reference', async () => {
    // Older references can be refused with data_completed=limit even for paid accounts.
    const to = Math.floor(Date.now() / 1000) - 7 * 86_400;
    const candles = await getCandles({ symbol: 'BINANCE:BTCEUR', timeframe: '240', count: 2, to, credentials: auth });
    expect(candles).toHaveLength(2);
    expect(candles.at(-1)?.time).toBeLessThanOrEqual(to);
    expect(candles[1].time - candles[0].time).toBe(4 * 3_600);
  });
});
