import { describe, expect, it } from 'vitest';
import { getWatchlists, getHotlist } from '../../src/data/index.js';

const credentials = { session: 'fixture', signature: 'signed' };
const reply = (data: unknown, status = 200) => (async () => new Response(JSON.stringify(data), { status })) as typeof fetch;

describe('getWatchlists', () => {
  it('reads ordered entries and metadata without following authenticated redirects', async () => {
    const lists = [{ id: 1, name: 'Example', symbols: ['###Section', 'NASDAQ:AAPL', 'BINANCE:BTCUSDT'], active: true }];
    const controller = new AbortController();
    const fetch = (async (url, init) => {
      expect(url).toBe('https://www.tradingview.com/api/v1/symbols_list/all/');
      expect(init?.redirect).toBe('manual');
      expect(init?.method).toBe('GET');
      expect(init?.signal).toBe(controller.signal);
      expect(init?.headers).toMatchObject({ cookie: 'sessionid=fixture;sessionid_sign=signed' });
      return new Response(JSON.stringify(lists));
    }) as typeof globalThis.fetch;
    expect(await getWatchlists({ credentials, fetch, signal: controller.signal })).toEqual(lists);
  });
  it('supports empty lists and rejects missing credentials', async () => {
    expect(await getWatchlists({ credentials, fetch: reply([]) })).toEqual([]);
    await expect(getWatchlists({ credentials: { session: '' } })).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
  });
  it('distinguishes access rejection from malformed data', async () => {
    for (const status of [301, 302, 401, 403]) {
      await expect(getWatchlists({ credentials, fetch: reply({}, status) })).rejects.toMatchObject({ code: 'AUTH_ERROR' });
    }
    for (const data of [{}, [null], [{ id: 1, name: 'x', symbols: [42] }]]) {
      await expect(getWatchlists({ credentials, fetch: reply(data) })).rejects.toMatchObject({ code: 'HTTP_ERROR' });
    }
    await expect(getWatchlists({ credentials, fetch: reply([], 429) })).rejects.toMatchObject({ code: 'HTTP_ERROR' });
  });
});

describe('getHotlist', () => {
  it('ranks the requested universe and preserves explicit filters and page ranges', async () => {
    for (const [kind, sortBy, sortOrder] of [
      ['gainers', 'change', 'desc'], ['losers', 'change', 'asc'],
      ['mostActive', 'volume', 'desc'], ['volumeGainers', 'relative_volume_10d_calc', 'desc'],
    ] as const) {
      const fetch = (async (url, init) => {
        expect(url).toBe('https://scanner.tradingview.com/crypto/scan');
        expect(JSON.parse(String(init?.body))).toMatchObject({
          columns: ['close'], sort: { sortBy, sortOrder }, filter: [], range: [5, 10],
        });
        return new Response(JSON.stringify({ totalCount: 0, data: [] }));
      }) as typeof globalThis.fetch;
      await getHotlist({ kind, market: 'crypto', columns: ['close'], filter: [], range: [5, 10] }, { fetch });
    }
  });
  it('defaults to America stocks and rejects unknown ranking kinds', async () => {
    const fetch = (async (url, init) => {
      expect(url).toBe('https://scanner.tradingview.com/america/scan');
      expect(JSON.parse(String(init?.body)).filter).toEqual([{ left: 'type', operation: 'equal', right: 'stock' }]);
      return new Response(JSON.stringify({ totalCount: 0, data: [] }));
    }) as typeof globalThis.fetch;
    await getHotlist({ kind: 'gainers' }, { fetch });
    await expect(getHotlist({ kind: 'unknown' as 'gainers' }, { fetch })).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
  });
});
