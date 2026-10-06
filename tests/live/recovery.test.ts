import { describe, expect, it } from 'vitest';
import { TradingViewClient, wsTransport, type Transport } from '../../src/index.js';
import { getCandles, watchCandles, watchQuotes, type CandleWatcher, type QuoteWatcher } from '../../src/data/index.js';
import { LIVE } from './env.js';

describe.skipIf(!LIVE)('live: connection recovery', () => {
  it('stops active watchers on an abrupt socket loss and starts fresh on a new connection', async () => {
    const symbol = 'BINANCE:BTCUSDT';
    let socket: Transport | undefined;
    const client = new TradingViewClient({
      transport: (request, handlers) => {
        socket = wsTransport(request, handlers);
        return socket;
      },
    });
    const closeCode = new Promise<number | undefined>((resolve) => { client.on('close', (code) => resolve(code)); });
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
      // Destroy the TCP socket without a closing handshake, as a lost network would.
      socket?.terminate?.();
      await Promise.all([candles.closed, quotes.closed]);
      expect(await closeCode).toBe(1006);
      expect(client.isClosed).toBe(true);
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
