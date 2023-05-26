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
