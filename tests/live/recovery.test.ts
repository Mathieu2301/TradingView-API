import { describe, expect, it } from 'vitest';
import { TradingViewClient } from '../../src/index.js';
import { getCandles, watchCandles, watchQuotes, type CandleWatcher, type QuoteWatcher } from '../../src/data/index.js';
import { LIVE } from './env.js';

describe.skipIf(!LIVE)('live: connection recovery', () => {
  it('closes active watchers and starts fresh on a new connection', async () => {
    const symbol = 'BINANCE:BTCUSDT';
    const client = new TradingViewClient();
    const errors: string[] = [];
    let candles: CandleWatcher | undefined;
    let quotes: QuoteWatcher | undefined;
    try {
      candles = await watchCandles({ symbol, timeframe: '1', count: 5, client }, {
        onData: () => {}, onError: (error) => errors.push(error.code),
      });
      quotes = await watchQuotes({ symbols: [symbol], fields: 'price', client }, {
        onData: () => {}, onError: (error) => errors.push(error.code),
      });
      expect(candles.latest).toHaveLength(5);
      expect(quotes.latest[symbol]?.lp).toBeTypeOf('number');
      // End the transport while subscriptions are still live, as a lost socket would.
      await client.close();
      await Promise.all([candles.closed, quotes.closed]);
      expect(candles.isActive).toBe(false);
      expect(quotes.isActive).toBe(false);
      expect(errors.sort()).toEqual(['DISCONNECTED', 'DISCONNECTED']);
    } finally {
      await Promise.allSettled([candles?.stop(), quotes?.stop()]);
      await client.close();
    }

    const replacement = new TradingViewClient();
    try {
      const resumed = await getCandles({ symbol, timeframe: '1', count: 5, client: replacement });
      expect(resumed).toHaveLength(5);
      expect(replacement.isClosed).toBe(false);
    } finally {
      await replacement.close();
    }
  });
});
