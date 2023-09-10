import { describe, it, expect } from 'vitest';
import { searchMarket, searchIndicator } from '../main';

describe('Search functions', () => {
  it('market search: "BINANCE:" has results', async () => {
    console.log('Searching market: "BINANCE:"');
    const markets = await searchMarket('BINANCE:');
    console.log('Found', markets.length, 'markets');

    expect(markets.length).toBeGreaterThan(10);
  });

  it('indicator search: "RSI" has results', async () => {
    console.log('Searching indicator: "RSI"');
    const indicators = await searchIndicator('RSI');
    console.log('Found', indicators.length, 'indicators');

    expect(indicators.length).toBeGreaterThan(10);
  });
});

describe('Technical Analysis', () => {
  function checkTA(ta = {}) {
    expect(ta).toBeDefined();
    for (const period of ['1', '5', '15', '60', '240', '1D', '1W', '1M']) {
      expect(ta[period]).toBeDefined();
      expect(ta[period].Other).toBeDefined();
      expect(ta[period].All).toBeDefined();
      expect(ta[period].MA).toBeDefined();
    }
  }

  it('gets TA for BINANCE:BTCUSD', async () => {
    checkTA(await (await searchMarket('BINANCE:BTCUSD'))[0].getTA());
  });

  it('gets TA for "NASDAQ APPLE"', async () => {
    checkTA(await (await searchMarket('NASDAQ APPLE'))[0].getTA());
  });
});
