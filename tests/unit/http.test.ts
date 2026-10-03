import { describe, expect, it, vi } from 'vitest';
import {
  getChartToken, getDrawings, getIndicator, getPrivateIndicators, getTechnicalAnalysis, getUser, loginUser,
  PinePermissionManager, searchIndicators, searchMarkets,
} from '../../src/http/index.js';

type Route = (url: URL, init: RequestInit) => Response | Promise<Response>;

/** Mock fetch that records calls and answers through `route`. */
function mockFetch(route: Route) {
  const calls: Array<{ url: URL; init: RequestInit }> = [];
  const fetch = vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input);
    calls.push({ url, init });
    return route(url, init);
  });
  return { fetch: fetch as unknown as typeof globalThis.fetch, calls };
}

const json = (body: unknown, init: ResponseInit = {}) => {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(body), { ...init, headers });
};

describe('searchMarkets', () => {
  it('queries symbol search v3 with exchange prefixes, filters and pagination', async () => {
    const { fetch, calls } = mockFetch(() => json({
      symbols: [
        { symbol: '<em>BTC</em>USD', exchange: 'Binance', description: 'Bitcoin / <em>US</em> Dollar', type: 'spot', currency_code: 'USD' },
        { symbol: 'AAPL', exchange: 'NASDAQ Stock Market', prefix: 'NASDAQ', description: 'Apple', type: 'stock', country: 'US' },
      ],
    }));
    const results = await searchMarkets('binance:btc usd', { type: 'crypto', offset: 50, fetch });
    expect(calls[0].url.origin + calls[0].url.pathname).toBe('https://symbol-search.tradingview.com/symbol_search/v3/');
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
      text: 'BTC USD', exchange: 'BINANCE', search_type: 'crypto', start: '50',
    });
    expect((calls[0].init.headers as any).origin).toBe('https://www.tradingview.com');
    expect(results).toEqual([
      {
        id: 'BINANCE:BTCUSD', exchange: 'Binance', fullExchange: 'Binance', symbol: 'BTCUSD', description: 'Bitcoin / US Dollar', type: 'spot', currency: 'USD', country: undefined,
      },
      {
        id: 'NASDAQ:AAPL', exchange: 'NASDAQ', fullExchange: 'NASDAQ Stock Market', symbol: 'AAPL', description: 'Apple', type: 'stock', currency: undefined, country: 'US',
      },
    ]);
  });

  it('combines country and sector filters with exchange, type and pagination', async () => {
    const { fetch, calls } = mockFetch(() => json({ symbols: [] }));
    await searchMarkets('', {
      country: 'US', sector: 'Finance', exchange: 'NASDAQ', type: 'common_stock', offset: 20, fetch,
    });
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
      text: '', exchange: 'NASDAQ', search_type: 'common_stock', start: '20', country: 'US', sector: 'Finance',
    });
  });

  it('throws HTTP_ERROR for unexpected payloads and 5xx statuses', async () => {
    await expect(searchMarkets('x', { fetch: mockFetch(() => json({ nope: true })).fetch })).rejects.toMatchObject({ code: 'HTTP_ERROR' });
    await expect(searchMarkets('x', { fetch: mockFetch(() => new Response('down', { status: 503 })).fetch }))
      .rejects.toMatchObject({ code: 'HTTP_ERROR', message: expect.stringContaining('503') });
  });

  it('wraps network failures', async () => {
    const fetch = vi.fn(async () => { throw new TypeError('fetch failed'); }) as any;
    await expect(searchMarkets('x', { fetch })).rejects.toMatchObject({ code: 'HTTP_ERROR', message: 'fetch failed' });
  });
});

describe('getTechnicalAnalysis', () => {
  it('requests every period and scales ratings', async () => {
    const { fetch, calls } = mockFetch(async (_url, init) => {
      const body = JSON.parse(init.body as string);
      return json({ data: [{ s: 'BINANCE:BTCUSD', d: body.columns.map((_: string, i: number) => (i % 3) / 4 - 0.25) }] });
    });
    const ta = await getTechnicalAnalysis('BINANCE:BTCUSD', { fetch });
    const body = JSON.parse(calls[0].init.body as string);
    expect(body.symbols).toEqual({ tickers: ['BINANCE:BTCUSD'] });
    expect(body.columns.slice(0, 3)).toEqual(['Recommend.Other|1', 'Recommend.All|1', 'Recommend.MA|1']);
    expect(body.columns).toContain('Recommend.All');
    expect(Object.keys(ta ?? {})).toEqual(['1', '5', '15', '60', '240', '1D', '1W', '1M']);
    expect(ta?.['1D']).toEqual({ Other: -0.5, All: 0, MA: 0.5 });
  });

  it('returns null without data', async () => {
    expect(await getTechnicalAnalysis('X', { fetch: mockFetch(() => json({ data: [] })).fetch })).toBeNull();
  });
});

describe('indicators', () => {
  const builtIn = (name: string) => ({
    scriptIdPart: `STD;${name}`, version: 1, scriptName: name, userId: 7, extra: { kind: 'study', shortDescription: name },
  });

  it('searches built-in and community indicators', async () => {
    const { fetch, calls } = mockFetch((url) => {
      if (url.pathname.endsWith('/list')) {
        const filter = url.searchParams.get('filter');
        return json(filter === 'standard' ? [builtIn('Relative Strength Index'), builtIn('MACD')] : []);
      }
      return json({
        results: [{
          scriptIdPart: 'PUB;abc', version: 2, scriptName: 'My RSI', author: { id: 3, username: 'bob' }, imageUrl: 'img', access: 3, scriptSource: '', extra: { kind: 'strategy' },
        }],
      });
    });
    const results = await searchIndicators('relative strength', { fetch });
    expect(calls.map((c) => c.url.searchParams.get('filter') ?? c.url.searchParams.get('search'))).toEqual([
      'standard', 'candlestick', 'fundamental', 'relative strength',
    ]);
    expect(results).toEqual([
      {
        id: 'STD;Relative Strength Index', version: '1', name: 'Relative Strength Index', author: { id: 7, username: '@TRADINGVIEW@' }, image: '', source: '', type: 'study', access: 'closed_source',
      },
      {
        id: 'PUB;abc', version: '2', name: 'My RSI', author: { id: 3, username: 'bob' }, image: 'img', source: '', type: 'strategy', access: 'invite_only',
      },
    ]);
  });

  it('loads an indicator definition with credentials and encodes the ID', async () => {
    const { fetch, calls } = mockFetch(() => json({
      success: true,
      result: {
        ilTemplate: 'IL',
        metaInfo: {
          scriptIdPart: 'STD;Supertrend%Strategy', description: 'Supertrend Strategy', shortDescription: 'ST', pine: { version: '5.0' }, inputs: [], styles: {}, plots: [],
        },
      },
    }));
    const indicator = await getIndicator('STD;Supertrend%Strategy', { version: '5.0', credentials: { session: 's' }, fetch });
    expect(calls[0].url.toString()).toBe('https://pine-facade.tradingview.com/pine-facade/translate/STD;Supertrend%25Strategy/5.0');
    expect((calls[0].init.headers as any).cookie).toBe('sessionid=s');
    expect(indicator.description).toBe('Supertrend Strategy');
  });

  it('throws NOT_FOUND for unknown indicators', async () => {
    const { fetch } = mockFetch(() => json({ success: false, reason: 'not found' }));
    await expect(getIndicator('STD;XXXXXXX', { fetch })).rejects.toMatchObject({
      code: 'NOT_FOUND', message: 'Inexistent or unsupported indicator: "not found"',
    });
  });

  it('lists private indicators with credentials', async () => {
    const { fetch, calls } = mockFetch(() => json([{ scriptIdPart: 'USER;1', version: 4, scriptName: 'Mine', imageUrl: '', scriptSource: 'src' }]));
    const list = await getPrivateIndicators({ session: 's', signature: 'g' }, { fetch });
    expect(calls[0].url.searchParams.get('filter')).toBe('saved');
    expect((calls[0].init.headers as any).cookie).toBe('sessionid=s;sessionid_sign=g');
    expect(list).toEqual([{
      id: 'USER;1', version: '4', name: 'Mine', author: { id: -1, username: '@ME@' }, image: '', source: 'src', type: 'study', access: 'private',
    }]);
    await expect(getPrivateIndicators({ session: 'bad' }, { fetch: mockFetch(() => json({ detail: 'no' })).fetch }))
      .rejects.toMatchObject({ code: 'AUTH_ERROR' });
  });
});

describe('accounts', () => {
  const page = '<script>window.user = {"id":42,"username":"alice","first_name":"Alice","last_name":"L","reputation":1.5,"following":3,"followers":4,'
    + '"notification_count":{"following":5,"user":6},"session_hash":"h","private_channel":"pc","auth_token":"tok","date_joined":"2020-01-02T03:04:05Z"}</script>';

  it('getUser parses the account page and follows redirects', async () => {
    const { fetch, calls } = mockFetch((url) => (url.hostname === 'www.tradingview.com'
      ? new Response('', { status: 302, headers: { location: 'https://fr.tradingview.com/' } })
      : new Response(page)));
    const user = await getUser({ session: 's', signature: 'g' }, { fetch });
    expect(calls.map((c) => c.url.hostname)).toEqual(['www.tradingview.com', 'fr.tradingview.com']);
    expect(calls[0].init.redirect).toBe('manual');
    expect(user).toEqual({
      id: 42,
      username: 'alice',
      firstName: 'Alice',
      lastName: 'L',
      reputation: 1.5,
      following: 3,
      followers: 4,
      notifications: { following: 5, user: 6 },
      session: 's',
      signature: 'g',
      sessionHash: 'h',
      privateChannel: 'pc',
      authToken: 'tok',
      joinDate: new Date('2020-01-02T03:04:05Z'),
    });
  });

  it('getUser tolerates an empty notification count object', async () => {
    const { fetch } = mockFetch(() => new Response(page.replace(
      '"notification_count":{"following":5,"user":6}', '"notification_count":{}',
    )));
    const user = await getUser({ session: 's' }, { fetch });
    expect(user.notifications).toEqual({ following: 0, user: 0 });
    expect(user.authToken).toBe('tok');
  });

  it('getUser uses the chart page and ignores a Location header on HTTP 200', async () => {
    const noToken = mockFetch(() => new Response('no token', {
      status: 200, headers: { location: 'https://fr.tradingview.com/chart/' },
    }));
    await expect(getUser({ session: 's' }, { fetch: noToken.fetch }))
      .rejects.toMatchObject({ code: 'AUTH_ERROR', message: 'Wrong or expired sessionid/signature' });
    expect(noToken.calls.map((call) => call.url.pathname)).toEqual(['/chart/']);
  });

  it('getUser stops redirect loops and rejects wrong sessions', async () => {
    const loop = mockFetch((url) => new Response('', {
      status: 302,
      headers: { location: url.pathname === '/' ? 'https://www.tradingview.com/accounts/signin/' : 'https://www.tradingview.com/' },
    }));
    await expect(getUser({ session: 's' }, { fetch: loop.fetch })).rejects.toThrow('Too many redirects');
    expect(loop.calls.length).toBe(6);
    await expect(getUser({ session: 's' }, { fetch: mockFetch(() => new Response('no')).fetch }))
      .rejects.toThrow('Wrong or expired sessionid/signature');
    await expect(getUser({ session: '' })).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
  });

  it('never forwards account cookies to a non-TradingView redirect or initial URL', async () => {
    const redirected = mockFetch(() => new Response('', {
      status: 302,
      headers: { location: 'https://tradingview.com.evil.example/collect' },
    }));
    await expect(getUser({ session: 'secret' }, { fetch: redirected.fetch }))
      .rejects.toMatchObject({ code: 'AUTH_ERROR' });
    expect(redirected.calls).toHaveLength(1);

    const initial = mockFetch(() => new Response(page));
    await expect(getUser({ session: 'secret' }, {
      location: 'http://www.tradingview.com/', fetch: initial.fetch,
    })).rejects.toMatchObject({ code: 'AUTH_ERROR' });
    expect(initial.calls).toHaveLength(0);
  });

  it('loginUser posts an encoded form and reads cookies', async () => {
    const { fetch, calls } = mockFetch(() => json({
      user: {
        id: 1, username: 'bob', first_name: 'B', last_name: '', reputation: 0, following: 0, followers: 0, notification_count: { user: 1, following: 2 }, session_hash: 'h', private_channel: 'p', auth_token: 't', date_joined: '2021-01-01',
      },
    }, {
      headers: [
        ['set-cookie', 'sessionid=abc; Path=/; HttpOnly'],
        ['set-cookie', 'sessionid_sign=def; Path=/'],
      ] as any,
    }));
    const user = await loginUser({ username: 'bob@x.com', password: 'p&ss=1', fetch });
    expect(calls[0].init.body).toBe('username=bob%40x.com&password=p%26ss%3D1&remember=on');
    expect((calls[0].init.headers as any)['content-type']).toBe('application/x-www-form-urlencoded');
    expect(user).toMatchObject({
      id: 1, session: 'abc', signature: 'def', authToken: 't', notifications: { user: 1, following: 2 },
    });
    const noRemember = mockFetch(() => json({ error: 'Invalid username or password' }));
    await expect(loginUser({ username: 'a', password: 'b', remember: false, fetch: noRemember.fetch }))
      .rejects.toMatchObject({ code: 'AUTH_ERROR', message: 'Invalid username or password' });
    expect(noRemember.calls[0].init.body).toBe('username=a&password=b');
  });
});

describe('layouts', () => {
  it('gets a chart token anonymously or with credentials', async () => {
    const { fetch, calls } = mockFetch(() => json({ token: 'jwt' }));
    expect(await getChartToken('AbCd', { fetch })).toBe('jwt');
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({ image_url: 'AbCd', user_id: '-1' });
    expect((calls[0].init.headers as any).cookie).toBeUndefined();
    await getChartToken('AbCd', { fetch, userId: 9, credentials: { session: 's', signature: 'g' } });
    expect(calls[1].url.searchParams.get('user_id')).toBe('9');
    expect((calls[1].init.headers as any).cookie).toBe('sessionid=s;sessionid_sign=g');
    await expect(getChartToken('bad', { fetch: mockFetch(() => json({})).fetch })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('lists drawings with merged state', async () => {
    const { fetch, calls } = mockFetch((url) => (url.pathname === '/chart-token'
      ? json({ token: 'jwt' })
      : json({ payload: { sources: { a: { id: 'a', symbol: 'BINANCE:BTCEUR', type: 'LineToolTrendLine', state: { text: 'hi', color: 'red' } } } } })));
    const drawings = await getDrawings('AbCd', { symbol: 'BINANCE:BTCEUR', chartId: '1', fetch });
    expect(calls[1].url.toString()).toBe(
      'https://charts-storage.tradingview.com/charts-storage/get/layout/AbCd/sources?chart_id=1&jwt=jwt&symbol=BINANCE%3ABTCEUR',
    );
    expect(drawings).toEqual([{
      id: 'a', symbol: 'BINANCE:BTCEUR', type: 'LineToolTrendLine', state: { text: 'hi', color: 'red' }, text: 'hi', color: 'red',
    }]);
    const noPayload = mockFetch((url) => (url.pathname === '/chart-token' ? json({ token: 'jwt' }) : json({})));
    await expect(getDrawings('AbCd', { fetch: noPayload.fetch })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('PinePermissionManager', () => {
  it('requires a Pine ID and full credentials', () => {
    expect(() => new PinePermissionManager('', { credentials: { session: 's', signature: 'g' } })).toThrow(/Pine ID/);
    expect(() => new PinePermissionManager('PUB;1', { credentials: { session: 's' } })).toThrow(/signature/);
  });

  it('lists, adds, modifies and removes authorized users', async () => {
    const { fetch, calls } = mockFetch((url) => {
      if (url.pathname.endsWith('list_users/')) return json({ results: [{ id: 1, username: 'bob' }] });
      return json({ status: url.pathname.includes('add') ? 'exists' : 'ok' });
    });
    const manager = new PinePermissionManager('PUB;abc', { credentials: { session: 's', signature: 'g' }, fetch });
    const expiration = new Date('2030-01-01T00:00:00Z');
    expect(await manager.getUsers(5, 'user__username')).toEqual([{ id: 1, username: 'bob' }]);
    expect(await manager.addUser('bob', expiration)).toBe('exists');
    expect(await manager.modifyExpiration('bob')).toBe('ok');
    expect(await manager.removeUser('bob')).toBe('ok');

    expect(calls.map((c) => c.url.pathname + c.url.search)).toEqual([
      '/pine_perm/list_users/?limit=5&order_by=user__username',
      '/pine_perm/add/',
      '/pine_perm/modify_user_expiration/',
      '/pine_perm/remove/',
    ]);
    expect(calls[1].init.body).toBe('pine_id=PUB%3Babc&username_recip=bob&expiration=2030-01-01T00%3A00%3A00.000Z');
    expect(calls[2].init.body).toBe('pine_id=PUB%3Babc&username_recip=bob');
    expect(calls[0].init.headers).toMatchObject({ cookie: 'sessionid=s;sessionid_sign=g', origin: 'https://www.tradingview.com' });
  });

  it('surfaces API error details', async () => {
    const { fetch } = mockFetch(() => json({ detail: 'You are not the owner' }, { status: 403 }));
    const manager = new PinePermissionManager('PUB;abc', { credentials: { session: 's', signature: 'g' }, fetch });
    await expect(manager.getUsers()).rejects.toMatchObject({ code: 'HTTP_ERROR', message: 'You are not the owner' });
  });
});


describe('HTTP response body failures', () => {
  it('normalizes stream failures after headers have arrived', async () => {
    const failure = new Error('response stream reset');
    const fetch = (async () => ({ text: async () => { throw failure; } })) as unknown as typeof globalThis.fetch;
    await expect(searchMarkets('BTC', { fetch })).rejects.toMatchObject({ code: 'HTTP_ERROR', cause: failure });
  });

  it('preserves abort classification during response body consumption', async () => {
    const failure = new DOMException('body cancelled', 'AbortError');
    const fetch = (async () => ({ text: async () => { throw failure; } })) as unknown as typeof globalThis.fetch;
    await expect(searchMarkets('BTC', { fetch })).rejects.toMatchObject({ code: 'ABORTED', cause: failure });
  });
});


describe('account token validation', () => {
  it('does not authenticate a marker, empty token or rejected HTTP response', async () => {
    for (const [page, status] of [
      ['auth_token is unavailable', 200],
      ['{"auth_token":""}', 200],
      ['{"auth_token":"unexpected"}', 403],
    ] as const) {
      await expect(getUser({ session: 'fixture' }, {
        fetch: mockFetch(() => new Response(page, { status })).fetch,
      })).rejects.toMatchObject({ code: 'AUTH_ERROR' });
    }
  });
});
