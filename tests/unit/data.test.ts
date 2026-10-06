import { describe, expect, it, vi } from 'vitest';
import { TradingViewClient } from '../../src/client/client.js';
import {
  getCandles, getIndicatorData, getQuote, getQuotes, getSymbolInfo, TradingViewProvider,
  watchCandles, watchIndicator, watchQuotes, type MarketDataProvider,
} from '../../src/data/index.js';
import { BuiltInIndicator } from '../../src/indicators/builtin-indicator.js';
import { FakeServer, flush, until } from '../helpers/fake-server.js';
import { makePine } from '../helpers/indicators.js';

function fake(options: ConstructorParameters<typeof FakeServer>[0] = {}) {
  const server = new FakeServer(options);
  return { server, clientOptions: { transport: server.transport } };
}

describe('getCandles', () => {
  it('returns the most recent candles oldest first and closes everything', async () => {
    const { server, clientOptions } = fake({ history: 500 });
    const candles = await getCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: '60', count: 3, clientOptions });
    expect(candles.map((c) => c.close)).toEqual([597, 598, 599]);
    expect(candles[0]).toEqual({
      time: server.barTime(497), open: 596, high: 599, low: 594, close: 597, volume: 507,
    });
    const connection = server.last;
    expect(connection.packets('create_series')[0].p.slice(4)).toEqual(['60', 3]);
    expect(connection.packets('chart_delete_session')).toHaveLength(1);
    expect(connection.closed).toBe(true);
  });

  it('accepts a symbol string with defaults (daily, 100 bars)', async () => {
    const { server, clientOptions } = fake();
    // String shorthand cannot carry clientOptions: inject through a shared client instead.
    const client = new TradingViewClient(clientOptions);
    const candles = await getCandles({ symbol: 'BINANCE:BTCUSDT', client });
    expect(candles).toHaveLength(100);
    expect(server.last.packets('create_series')[0].p.slice(4)).toEqual(['D', 100]);
    expect(client.isClosed).toBe(false);
    expect(server.last.packets('chart_delete_session')).toHaveLength(1);
    await client.close();
  });

  it('accepts an alternate candle provider and stops its one-shot worker', async () => {
    const snapshot = [{ time: 1, open: 2, high: 3, low: 1, close: 2.5, volume: 4 }];
    const stop = vi.fn(async () => {});
    const provider: MarketDataProvider = {
      watchCandles: vi.fn(async (_query, handlers) => {
        handlers.onData(snapshot);
        return { latest: snapshot, stop };
      }),
    };
    expect(await getCandles({ symbol: 'CUSTOM:ASSET' }, provider)).toEqual(snapshot);
    expect(stop).toHaveBeenCalledTimes(1);
    const seen: number[] = [];
    const worker = await watchCandles({ symbol: 'CUSTOM:ASSET' }, {
      onData: (candles) => seen.push(candles[0].close),
    }, provider);
    expect(worker.latest).toEqual(snapshot);
    expect(seen).toEqual([2.5]);
    await worker.stop();
    expect(stop).toHaveBeenCalledTimes(2);

    const { server, clientOptions } = fake();
    const tradingView = new TradingViewProvider({ clientOptions });
    const candles = await getCandles({ symbol: 'BINANCE:BTCUSDT', count: 2 }, tradingView);
    expect(candles).toHaveLength(2);
    expect(server.last.closed).toBe(true);
  });

  it('loads deep history in batches until count is reached', async () => {
    const { server, clientOptions } = fake({ history: 12_000, batchLimit: 5_000 });
    const candles = await getCandles({ symbol: 'BINANCE:BTCUSDT', count: 11_000, clientOptions });
    expect(candles).toHaveLength(11_000);
    expect(candles[0].time).toBe(server.barTime(1_000));
    expect(server.last.packets('create_series')[0].p[5]).toBe(5_000);
    expect(server.last.packets('request_more_data').map((p) => p.p[2])).toEqual([5_000, 1_000]);
  });

  it('stops when the server has no more history', async () => {
    const { server, clientOptions } = fake({ history: 120, batchLimit: 50, endReason: 'limit' });
    const candles = await getCandles({ symbol: 'BINANCE:BTCUSDT', count: 1_000, clientOptions });
    expect(candles).toHaveLength(120);
    expect(server.last.packets('request_more_data')).toHaveLength(2);
  });

  it('loads a from/to range, accepting Dates and Unix seconds', async () => {
    const { server, clientOptions } = fake({ history: 1_000, batchLimit: 100, step: 3_600 });
    const from = new Date(server.barTime(700) * 1000);
    const to = server.barTime(750);
    const candles = await getCandles({
      symbol: 'BINANCE:BTCUSDT', timeframe: '60', from, to, clientOptions,
    });
    expect(candles[0].time).toBe(server.barTime(700));
    expect(candles.at(-1)?.time).toBe(to);
    expect(candles).toHaveLength(51);
    // Initial request sized from the range, then deep history until `from` is reached.
    const [create] = server.last.packets('create_series');
    expect(create.p[5][0]).toBe('bar_count');
    expect(create.p[5][1]).toBe(to);
    expect(server.last.packets('request_more_data').length).toBeGreaterThan(0);
  });

  it('passes chart options (type, currency, session, adjustment, timezone)', async () => {
    const { server, clientOptions } = fake();
    await getCandles({
      symbol: 'NASDAQ:AAPL',
      chartType: 'HeikinAshi',
      chartInputs: { foo: 1 },
      currency: 'EUR',
      session: 'extended',
      adjustment: 'dividends',
      backAdjustment: true,
      timezone: 'Europe/Paris',
      count: 2,
      clientOptions,
    });
    const connection = server.last;
    expect(connection.packets('switch_timezone')[0].p[1]).toBe('Europe/Paris');
    expect(JSON.parse(connection.packets('resolve_symbol')[0].p[2].slice(1))).toEqual({
      symbol: {
        symbol: 'NASDAQ:AAPL', adjustment: 'dividends', backadjustment: 'default', session: 'extended', 'currency-id': 'EUR',
      },
      type: 'BarSetHeikenAshi@tv-basicstudies-60!',
      inputs: { foo: 1 },
    });
  });

  it('rejects invalid queries before connecting', async () => {
    const { server, clientOptions } = fake();
    await expect(getCandles({ symbol: '', clientOptions })).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
    await expect(getCandles({ symbol: 'A', count: 0, clientOptions })).rejects.toThrow('count');
    await expect(getCandles({ symbol: 'A', from: 10, to: 5, clientOptions })).rejects.toThrow('from');
    await expect(getCandles({ symbol: 'A', timeoutMs: -1, clientOptions })).rejects.toThrow('timeoutMs');
    expect(server.connections).toHaveLength(0);
  });

  it('rejects symbol errors and empty results with clear codes', async () => {
    const { clientOptions } = fake();
    await expect(getCandles({ symbol: 'XXXXX', clientOptions })).rejects.toMatchObject({ code: 'SYMBOL_ERROR' });
    const empty = fake({ history: 0, endReason: 'limit' });
    await expect(getCandles({ symbol: 'A', clientOptions: empty.clientOptions }))
      .rejects.toMatchObject({ code: 'NO_DATA', message: expect.stringContaining('access limit') });
  });

  it('times out and releases the connection', async () => {
    const { server, clientOptions } = fake();
    server.respond = false;
    await expect(getCandles({ symbol: 'A', timeoutMs: 20, clientOptions })).rejects.toMatchObject({ code: 'TIMEOUT' });
    expect(server.last.closed).toBe(true);
  });

  it('aborts in flight and before starting', async () => {
    const { server, clientOptions } = fake();
    server.respond = false;
    const controller = new AbortController();
    const pending = getCandles({ symbol: 'A', signal: controller.signal, clientOptions });
    controller.abort(new Error('user cancelled'));
    await expect(pending).rejects.toMatchObject({ code: 'ABORTED', message: 'user cancelled' });
    expect(server.last.closed).toBe(true);
    await expect(getCandles({ symbol: 'A', signal: controller.signal, clientOptions })).rejects.toMatchObject({ code: 'ABORTED' });
    expect(server.connections).toHaveLength(1);
  });

  it('rejects with DISCONNECTED when the connection drops', async () => {
    const { server, clientOptions } = fake();
    server.respond = false;
    const pending = getCandles({ symbol: 'A', clientOptions });
    await until(() => server.connections[0]?.isOpen);
    server.last.drop();
    await expect(pending).rejects.toMatchObject({ code: 'DISCONNECTED' });
  });

  it('rejects when a provided client is already closed', async () => {
    const { clientOptions } = fake();
    const client = new TradingViewClient(clientOptions);
    await client.close();
    await expect(getCandles({ symbol: 'A', client })).rejects.toMatchObject({ code: 'INVALID_STATE' });
  });
});

describe('watchCandles', () => {
  it('starts after the history, streams updates and stops idempotently', async () => {
    const { server, clientOptions } = fake({ history: 10 });
    const snapshots: number[][] = [];
    const watcher = await watchCandles({ symbol: 'BINANCE:BTCUSDT', count: 3, clientOptions }, {
      onData: (candles) => snapshots.push(candles.map((c) => c.close)),
    });
    expect(watcher.isActive).toBe(true);
    expect(watcher.latest.map((c) => c.close)).toEqual([107, 108, 109]);
    expect(Object.isFrozen(watcher.latest) && Object.isFrozen(watcher.latest[0])).toBe(true);
    expect(watcher.symbolInfo?.full_name).toBe('BINANCE:BTCUSDT');

    const chartId = server.last.packets('chart_create_session')[0].p[0];
    server.last.push({ m: 'du', p: [chartId, { $prices: { s: [{ i: 10, v: [server.barTime(9) + 86_400, 1, 2, 0, 1.5, 1] }] } }] });
    expect(snapshots).toEqual([[107, 108, 109], [108, 109, 1.5]]);

    await Promise.all([watcher.stop(), watcher.stop()]);
    await watcher.closed;
    expect(watcher.isActive).toBe(false);
    server.last.push({ m: 'du', p: [chartId, { $prices: { s: [] } }] });
    expect(snapshots).toHaveLength(2);
    expect(server.last.closed).toBe(true);
  });

  it('reports fatal errors after start-up to onError and stops', async () => {
    const { server, clientOptions } = fake();
    const errors: string[] = [];
    const watcher = await watchCandles({ symbol: 'A', clientOptions }, { onData: () => {}, onError: (e) => errors.push(e.code) });
    server.last.drop();
    await watcher.closed;
    expect(errors).toEqual(['DISCONNECTED']);
    expect(watcher.isActive).toBe(false);
  });

  it('reports user callback failures without stopping the stream', async () => {
    const { server, clientOptions } = fake();
    const errors: string[] = [];
    const watcher = await watchCandles({ symbol: 'A', clientOptions }, {
      onData: () => { throw new Error('consumer bug'); },
      onError: (error) => errors.push(error.code),
    });
    expect(errors).toEqual(['CALLBACK_ERROR']);
    expect(watcher.isActive).toBe(true);
    await watcher.stop();
    expect(server.last.closed).toBe(true);
  });

  it('stops on abort after start-up', async () => {
    const { server, clientOptions } = fake();
    const controller = new AbortController();
    const errors: string[] = [];
    const watcher = await watchCandles({ symbol: 'A', signal: controller.signal, clientOptions }, {
      onData: () => {}, onError: (e) => errors.push(e.code),
    });
    controller.abort();
    await watcher.closed;
    expect(errors).toEqual(['ABORTED']);
    expect(server.last.closed).toBe(true);
  });

  it('rejects start-up failures and validates handlers', async () => {
    const { server, clientOptions } = fake();
    await expect(watchCandles({ symbol: 'XXXXX', clientOptions }, { onData: () => {} })).rejects.toMatchObject({ code: 'SYMBOL_ERROR' });
    expect(server.last.closed).toBe(true);
    await expect(watchCandles({ symbol: 'A', clientOptions }, {} as any)).rejects.toThrow('onData');
    server.respond = false;
    await expect(watchCandles({ symbol: 'A', timeoutMs: 10, clientOptions }, { onData: () => {} })).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('shares a client without closing it', async () => {
    const { server, clientOptions } = fake();
    const client = new TradingViewClient(clientOptions);
    const a = await watchCandles({ symbol: 'A', client }, { onData: () => {} });
    const b = await watchCandles({ symbol: 'B', client }, { onData: () => {} });
    await a.stop();
    await b.stop();
    expect(server.connections).toHaveLength(1);
    expect(server.last.packets('chart_delete_session')).toHaveLength(2);
    expect(client.isClosed).toBe(false);
    await client.close();
  });
});

describe('quotes', () => {
  it('getQuote and getQuotes return merged data', async () => {
    const { server, clientOptions } = fake();
    expect(await getQuote({ symbol: 'BINANCE:BTCUSDT', fields: 'price', clientOptions })).toMatchObject({ lp: 100 });
    expect(server.last.packets('quote_set_fields')[0].p.slice(1)).toEqual(['lp']);
    expect(server.last.closed).toBe(true);
    const quotes = await getQuotes({ symbols: ['A', 'B', 'A'], clientOptions });
    expect(Object.keys(quotes)).toEqual(['A', 'B']);
    expect(server.last.packets('quote_delete_session')).toHaveLength(1);
  });

  it('rejects quote errors', async () => {
    const { clientOptions } = fake();
    await expect(getQuote({ symbol: 'XXXXX', clientOptions })).rejects.toMatchObject({ code: 'QUOTE_ERROR' });
    await expect(getQuotes({ symbols: [], clientOptions })).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
  });

  it('watchQuotes streams symbols and reports per-symbol failures', async () => {
    const { server, clientOptions } = fake();
    const seen: string[] = [];
    const errors: string[] = [];
    const watcher = await watchQuotes({ symbols: ['A', 'XXXXX'], clientOptions }, {
      onData: (symbol, quote) => seen.push(`${symbol}:${quote.lp}`),
      onError: (e) => errors.push(e.code),
    });
    expect(seen).toEqual(['A:100']);
    expect(errors).toEqual(['QUOTE_ERROR']);
    expect(Object.keys(watcher.latest)).toEqual(['A']);
    const sessionId = server.last.packets('quote_create_session')[0].p[0];
    const key = server.last.packets('quote_add_symbols')[0].p[1];
    server.last.push({ m: 'qsd', p: [sessionId, { n: key, s: 'ok', v: { lp: 101 } }] });
    expect(seen).toEqual(['A:100', 'A:101']);
    await watcher.stop();
    expect(server.last.closed).toBe(true);
  });

  it('watchQuotes rejects when every symbol fails', async () => {
    const { clientOptions } = fake();
    await expect(watchQuotes({ symbols: ['XXXXX'], clientOptions }, { onData: () => {} })).rejects.toMatchObject({ code: 'QUOTE_ERROR' });
  });
});

describe('getSymbolInfo', () => {
  it('resolves symbol metadata', async () => {
    const { server, clientOptions } = fake();
    const info = await getSymbolInfo({ symbol: 'NASDAQ:AAPL', clientOptions });
    expect(info).toMatchObject({ full_name: 'NASDAQ:AAPL', currency_code: 'EUR', series_id: 'ser_1' });
    expect(server.last.closed).toBe(true);
    await expect(getSymbolInfo({ symbol: 'XXXXX', clientOptions })).rejects.toMatchObject({ code: 'SYMBOL_ERROR' });
  });
});

describe('indicator data', () => {
  it('runs a built-in study from its type string', async () => {
    const { server, clientOptions } = fake({ history: 20, studyPlots: 2 });
    const data = await getIndicatorData({
      symbol: 'A', indicator: 'Volume@tv-basicstudies-241', inputs: { length: 5 }, count: 4, clientOptions,
    });
    expect(server.last.packets('create_study')[0].p[4]).toBe('Volume@tv-basicstudies-241');
    expect(server.last.packets('create_study')[0].p[5]).toEqual({ length: 5, col_prev_close: false });
    expect(data.candles).toHaveLength(4);
    expect(data.values.at(-1)).toEqual({ $time: server.barTime(19), plot_0: 19, plot_1: 19.1 });
    expect(data.indicator).toBeInstanceOf(BuiltInIndicator);
    expect(server.last.closed).toBe(true);
  });

  it('loads a Pine indicator by ID with credentials, applies inputs and returns reports', async () => {
    const { server, clientOptions } = fake({
      history: 10,
      studyNs: () => ({ data: { report: { performance: { all: { totalTrades: 3 } } } } }),
    });
    const pine = makePine();
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      success: true,
      result: {
        ilTemplate: pine.script,
        metaInfo: {
          scriptIdPart: 'PUB;test',
          description: 'Test',
          shortDescription: 'T',
          pine: { version: '3.0' },
          inputs: [{ id: 'in_0', name: 'Length', defval: 14, type: 'integer' }],
          styles: { plot_0: { title: 'Value' } },
          plots: [],
        },
      },
    })));
    const data = await getIndicatorData({
      symbol: 'A',
      indicator: 'PUB;test',
      inputs: { Length: 30 },
      credentials: { session: 's' },
      clientOptions: { ...clientOptions, authToken: 'tok', fetch: fetch as any },
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://pine-facade.tradingview.com/pine-facade/translate/PUB;test/last',
      expect.objectContaining({ headers: expect.objectContaining({ cookie: 'sessionid=s' }) }),
    );
    expect(server.last.packets('create_study')[0].p[5].in_0).toEqual({ v: 30, f: false, t: 'integer' });
    expect(data.values.at(-1)).toMatchObject({ Value: 9 });
    expect(data.strategyReport.performance.all?.totalTrades).toBe(3);
  });

  it('does not mutate a provided indicator instance and loads more bars for the study', async () => {
    const { server, clientOptions } = fake({ history: 300, batchLimit: 100 });
    const pine = makePine();
    const data = await getIndicatorData({
      symbol: 'A', indicator: pine, inputs: { length: 50 }, count: 250, clientOptions,
    });
    expect(pine.inputs.in_0.value).toBe(14);
    expect(data.candles).toHaveLength(250);
    expect(data.values).toHaveLength(250);
    expect(server.last.packets('request_more_data').length).toBe(2);
  });

  it('rejects study errors and unknown indicators', async () => {
    const { clientOptions } = fake({ studyError: 'study not auth' });
    await expect(getIndicatorData({ symbol: 'A', indicator: makePine(), clientOptions }))
      .rejects.toMatchObject({ code: 'STUDY_ERROR', message: 'Study error: study not auth' });
    await expect(getIndicatorData({ symbol: 'A', indicator: '', clientOptions })).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
    const fetch = vi.fn(async () => new Response(JSON.stringify({ success: false, reason: 'nope' })));
    await expect(getIndicatorData({ symbol: 'A', indicator: 'STD;Nope', clientOptions: { ...clientOptions, fetch: fetch as any } }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('watchIndicator streams study updates', async () => {
    const { server, clientOptions } = fake({ history: 10 });
    const values: number[] = [];
    const watcher = await watchIndicator({ symbol: 'A', indicator: makePine(), count: 5, clientOptions }, {
      onData: (data) => values.push(data.values.at(-1)?.Value as number),
    });
    const chartId = server.last.packets('chart_create_session')[0].p[0];
    const studyId = server.last.packets('create_study')[0].p[1];
    server.last.push({ m: 'du', p: [chartId, { [studyId]: { st: [{ i: 9, v: [server.barTime(9), 42] }], ns: { d: '' } } }] });
    await flush();
    expect(values).toEqual([9, 42]);
    expect(watcher.latest?.values.at(-1)?.Value).toBe(42);
    await watcher.stop();
    expect(server.last.closed).toBe(true);
  });
});

describe('watchers after an unexpected connection loss', () => {
  it('stops every watcher on a shared client once, then works on a new connection', async () => {
    const server = new FakeServer();
    const client = new TradingViewClient({ transport: server.transport });
    const errors: string[] = [];
    const onError = (error: { code: string }) => errors.push(error.code);
    const candles = await watchCandles({ symbol: 'A', timeframe: '1', count: 5, client }, { onData: () => {}, onError });
    const quotes = await watchQuotes({ symbols: ['A'], fields: 'price', client }, { onData: () => {}, onError });
    expect(candles.latest).toHaveLength(5);

    server.last.drop(1006, '');
    await Promise.all([candles.closed, quotes.closed]);
    expect(errors).toEqual(['DISCONNECTED', 'DISCONNECTED']);
    expect([candles.isActive, quotes.isActive, client.isClosed]).toEqual([false, false, true]);
    // Late packets on the dead socket and repeated stops are harmless.
    server.last.handlers.onMessage('~m~20~m~{"m":"du","p":["x"]}');
    await Promise.all([candles.stop(), quotes.stop(), client.close()]);
    expect(errors).toHaveLength(2);
    await expect(watchCandles({ symbol: 'A', client }, { onData: () => {} })).rejects.toMatchObject({ code: 'INVALID_STATE' });

    const replacement = new TradingViewClient({ transport: server.transport });
    expect(await getCandles({ symbol: 'A', timeframe: '1', count: 5, client: replacement })).toHaveLength(5);
    expect(replacement.isClosed).toBe(false);
    await replacement.close();
  });

  it('stops an owned watcher with CONNECTION_ERROR when the server goes silent', async () => {
    const { server, clientOptions } = fake();
    const errors: string[] = [];
    const watcher = await watchCandles({ symbol: 'A', clientOptions: { ...clientOptions, inactivityTimeoutMs: 50 } }, {
      onData: () => {}, onError: (error) => errors.push(error.code),
    });
    await watcher.closed;
    expect(errors).toEqual(['CONNECTION_ERROR']);
    expect(server.last.terminated).toBe(true);
  });
});
