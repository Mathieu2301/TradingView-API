import { describe, expect, it } from 'vitest';
import { getScreener } from '../../src/data/index.js';

const reply = (data: unknown, status = 200) => (async () => new Response(JSON.stringify(data), { status })) as typeof fetch;

describe('getScreener', () => {
  it('forwards filters, sort, auth and cancellation and maps typed cells without coercion', async () => {
    const controller = new AbortController();
    const fetch = (async (url, init) => {
      expect(url).toBe('https://scanner.tradingview.com/america/scan');
      expect(init?.signal).toBe(controller.signal);
      expect(init?.headers).toMatchObject({ cookie: 'sessionid=test;sessionid_sign=signed' });
      expect(JSON.parse(String(init?.body))).toEqual({
        columns: ['close', 'Stoch.RSI.D', 'name'], range: [10, 20],
        filter: [{ left: 'close', operation: 'greater', right: 10 }],
        sort: { sortBy: 'close', sortOrder: 'desc' }, symbols: { tickers: ['NASDAQ:AAPL'] },
      });
      return new Response(JSON.stringify({ totalCount: 100, data: [{ s: 'NASDAQ:AAPL', d: [12, null, 'Apple'] }] }));
    }) as typeof globalThis.fetch;
    expect(await getScreener({
      market: 'america', columns: ['close', 'Stoch.RSI.D', 'name'], range: [10, 20],
      filter: [{ left: 'close', operation: 'greater', right: 10 }],
      sort: { sortBy: 'close', sortOrder: 'desc' }, symbols: ['NASDAQ:AAPL'],
    }, { fetch, signal: controller.signal, credentials: { session: 'test', signature: 'signed' } })).toEqual({
      totalCount: 100, rows: [{ symbol: 'NASDAQ:AAPL', values: { close: 12, 'Stoch.RSI.D': null, name: 'Apple' } }],
    });
  });

  it('accepts an empty page and preserves special column names safely', async () => {
    expect(await getScreener({ columns: ['close'] }, { fetch: reply({ totalCount: 0, data: [] }) }))
      .toEqual({ totalCount: 0, rows: [] });
    const result = await getScreener({ columns: ['__proto__'] }, {
      fetch: reply({ totalCount: 1, data: [{ s: 'X:Y', d: [42] }] }),
    });
    expect(Object.hasOwn(result.rows[0].values, '__proto__')).toBe(true);
    expect(result.rows[0].values.__proto__).toBe(42);
  });

  it('rejects unsafe paths, ambiguous columns and invalid ranges before fetching', async () => {
    for (const query of [
      { market: '../x', columns: ['close'] }, { columns: [] }, { columns: ['close', 'close'] },
      { columns: [''] }, { columns: ['close'], range: [-1, 2] as [number, number] },
      { columns: ['close'], range: [0, 0] as [number, number] },
      { columns: ['close'], range: [0, 1.5] as [number, number] },
    ]) {
      await expect(getScreener(query, { fetch: (async () => { throw new Error('must not fetch'); }) as typeof fetch }))
        .rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
    }
  });

  it('rejects non-success statuses, scanner errors and malformed row shapes', async () => {
    for (const data of [{ error: 'Unknown field' }, { totalCount: -1, data: [] },
      { totalCount: 1, data: [{ s: 'X:Y', d: [] }] }, { totalCount: 1, data: [null] }]) {
      await expect(getScreener({ columns: ['close'] }, { fetch: reply(data) }))
        .rejects.toMatchObject({ code: 'HTTP_ERROR' });
    }
    await expect(getScreener({ columns: ['close'] }, { fetch: reply({ totalCount: 0, data: [] }, 429) }))
      .rejects.toMatchObject({ code: 'HTTP_ERROR' });
  });
});
