import { describe, it, expect } from 'vitest';
import { searchMarket, searchIndicator, searchMarketV3 } from '../main';

describe('Search functions', () => {
  it('market search (old): "BINANCE:" has results', async () => {
    console.log('Searching market: "BINANCE:"');
    const markets = await searchMarket('BINANCE:');
    console.log('Found', markets.length, 'markets');

    expect(markets.length).toBeGreaterThan(10);
  });

  it('market search: "BINANCE:" has results', async () => {
    console.log('Searching market: "BINANCE:"');
    const markets = await searchMarketV3('BINANCE:');
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
  const SEARCHES = {
    // search text: expected first result
    'binance:BTCUSD': 'BINANCE:BTCUSD',
    'nasdaq apple': 'NASDAQ:AAPL',
  };

  for (const marketName in SEARCHES) {
    it(`gets TA for '${marketName}'`, async () => {
      const foundMarkets = await searchMarketV3(marketName);
      const firstResult = foundMarkets[0];

      console.log(`Market search first result for '${marketName}':`, firstResult);

      expect(firstResult).toBeDefined();
      expect(firstResult.id).toBe(SEARCHES[marketName]);

      const ta = await firstResult.getTA();
      expect(ta).toBeDefined();

      for (const period of ['1', '5', '15', '60', '240', '1D', '1W', '1M']) {
        expect(ta[period]).toBeDefined();
        expect(ta[period].Other).toBeDefined();
        expect(ta[period].All).toBeDefined();
        expect(ta[period].MA).toBeDefined();
      }
    });
  }
});
