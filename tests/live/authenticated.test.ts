import { describe, expect, it } from 'vitest';
import {
  getCandles, getIndicator, getIndicatorData, getPrivateIndicators, getUser, TradingViewClient,
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

  it('lists private indicators', async () => {
    const list = await getPrivateIndicators(auth);
    expect(Array.isArray(list)).toBe(true);
  });

  it('uses account timeframes', async () => {
    const candles = await getCandles({ symbol: 'BINANCE:BTCEUR', timeframe: '240', count: 2, to: 1_700_000_000, credentials: auth });
    expect(candles.at(-1)?.time).toBeLessThanOrEqual(1_700_000_000);
  });
});
