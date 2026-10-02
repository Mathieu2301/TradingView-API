import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TradingViewClient } from '../../src/client/client.js';
import { BuiltInIndicator } from '../../src/indicators/builtin-indicator.js';
import { decodeFrames } from '../../src/protocol/framing.js';
import { FakeServer, flush, until } from '../helpers/fake-server.js';

const live = JSON.parse(readFileSync(new URL('../fixtures/live-session.json', import.meta.url), 'utf8'));

async function setup(options: ConstructorParameters<typeof FakeServer>[0] = {}) {
  const server = new FakeServer(options);
  const client = new TradingViewClient({ transport: server.transport });
  await client.ready;
  return { server, client, connection: server.last };
}

describe('ChartSession', () => {
  it('creates a session, resolves the symbol and loads candles oldest first', async () => {
    const { server, client, connection } = await setup({ history: 50 });
    const chart = client.createChart();
    const events: string[] = [];
    chart.onAny((event) => { events.push(event); });
    chart.setMarket('BINANCE:BTCEUR', { timeframe: '240', count: 3 });
    await until(() => events.includes('seriesCompleted'));

    expect(connection.packets('chart_create_session')[0].p).toEqual([chart.id]);
    expect(connection.packets('resolve_symbol')[0].p).toEqual([
      chart.id, 'ser_1', '={"symbol":"BINANCE:BTCEUR","adjustment":"splits"}',
    ]);
    expect(connection.packets('create_series')[0].p).toEqual([chart.id, '$prices', 's1', 'ser_1', '240', 3]);
    expect(chart.symbolInfo).toMatchObject({ series_id: 'ser_1', full_name: 'BINANCE:BTCEUR' });
    expect(chart.candles.map((c) => c.time)).toEqual([server.barTime(47), server.barTime(48), server.barTime(49)]);
    expect(chart.lastCandle).toEqual({
      time: server.barTime(49), open: 148, high: 151, low: 146, close: 149, volume: 59,
    });
    expect(events).toEqual(['symbolLoaded', 'seriesLoading', 'update', 'seriesCompleted']);
    expect(chart.seriesId).toBe('ser_1');
    expect(chart.timeframe).toBe('240');
    await client.close();
  });

  it('encodes market options, custom chart types and bar_count ranges', async () => {
    const { client, connection } = await setup();
    const chart = client.createChart();
    chart.setMarket('CME:ES1!', {
      timeframe: 'D',
      count: 10,
      to: 1_700_000_000,
      adjustment: 'dividends',
      backAdjustment: true,
      session: 'extended',
      currency: 'EUR',
      type: 'Renko',
      inputs: { boxSize: 3, style: 'ATR' },
    });
    const [init] = connection.packets('resolve_symbol');
    expect(JSON.parse(init.p[2].slice(1))).toEqual({
      symbol: {
        symbol: 'CME:ES1!', adjustment: 'dividends', backadjustment: 'default', session: 'extended', 'currency-id': 'EUR',
      },
      type: 'BarSetRenko@tv-prostudies-40!',
      inputs: { boxSize: 3, style: 'ATR' },
    });
    expect(connection.packets('create_series')[0].p[5]).toEqual(['bar_count', 1_700_000_000, 10]);
    expect(() => chart.setMarket('X', { type: 'Nope' as any })).toThrow(/Unknown chart type/);
    await client.close();
  });

  it('modifies the series on later setMarket/setTimeframe calls and keeps the bar count', async () => {
    const { client, connection } = await setup();
    const chart = client.createChart();
    expect(() => chart.setTimeframe('15')).toThrow(expect.objectContaining({ code: 'INVALID_STATE' }));
    chart.setMarket('BINANCE:BTCEUR');
    chart.setMarket('BINANCE:ETHEUR', { timeframe: '60', type: 'HeikinAshi' });
    chart.setTimeframe('15');
    expect(connection.packets('modify_series').map((p) => p.p)).toEqual([
      [chart.id, '$prices', 's2', 'ser_2', '60', ''],
      [chart.id, '$prices', 's3', 'ser_2', '15', ''],
    ]);
    expect(JSON.parse(connection.packets('resolve_symbol')[1].p[2].slice(1))).toEqual({
      symbol: { symbol: 'BINANCE:ETHEUR', adjustment: 'splits' }, type: 'BarSetHeikenAshi@tv-basicstudies-60!', inputs: {},
    });
    await client.close();
  });

  it('fetches more history and switches timezone', async () => {
    const { client, connection } = await setup({ history: 20 });
    const chart = client.createChart();
    const completions: Array<string | undefined> = [];
    chart.on('seriesCompleted', (info) => completions.push(info.dataCompleted));
    chart.setTimezone('Europe/Paris');
    chart.setMarket('BINANCE:BTCEUR', { count: 5 });
    await until(() => completions.length === 1);
    chart.fetchMore(30);
    await until(() => completions.length === 2);
    expect(connection.packets('switch_timezone')[0].p).toEqual([chart.id, 'Europe/Paris']);
    expect(connection.packets('request_more_data')[0].p).toEqual([chart.id, '$prices', 30]);
    expect(chart.candles).toHaveLength(20);
    expect(completions).toEqual([undefined, 'end']);
    await client.close();
  });

  it('emits typed errors for symbol, series and critical errors', async () => {
    const { client, connection } = await setup();
    const chart = client.createChart();
    const errors: string[] = [];
    chart.on('error', (error) => errors.push(`${error.code}: ${error.message}`));
    chart.setMarket('XXXXX');
    await until(() => errors.length === 1);
    connection.push(
      { m: 'series_error', p: [chart.id, '$prices', 's1', 'custom_resolution'] },
      { m: 'critical_error', p: [chart.id, 'invalid timezone', 'method: switch_timezone'] },
    );
    expect(errors).toEqual([
      'SYMBOL_ERROR: (ser_1) Symbol error: invalid symbol',
      'SERIES_ERROR: Series error: custom_resolution',
      'CRITICAL_ERROR: Critical error: invalid timezone',
    ]);
    await client.close();
  });

  it('runs replay mode with step/start/stop and replay events', async () => {
    const { client, connection } = await setup({ replaySteps: 2 });
    const chart = client.createChart();
    await expect(chart.replayStep()).rejects.toMatchObject({ code: 'INVALID_STATE' });
    const events: unknown[][] = [];
    chart.onAny((event, ...args) => { if (event.startsWith('replay')) events.push([event, ...args]); });
    chart.setMarket('BINANCE:BTCEUR', { timeframe: 'D', replay: 1_700_000_000, count: 1 });
    expect(chart.isReplay).toBe(true);

    expect(connection.packets('replay_create_session')[0].p).toEqual([chart.replayId]);
    expect(connection.packets('replay_add_series')[0].p).toEqual([
      chart.replayId, 'req_replay_addseries', '={"symbol":"BINANCE:BTCEUR","adjustment":"splits"}', 'D',
    ]);
    expect(connection.packets('replay_reset')[0].p).toEqual([chart.replayId, 'req_replay_reset', 1_700_000_000]);
    expect(JSON.parse(connection.packets('resolve_symbol')[0].p[2].slice(1))).toEqual({
      symbol: { symbol: 'BINANCE:BTCEUR', adjustment: 'splits' }, replay: chart.replayId,
    });

    await chart.replayStep(1);
    await chart.replayStart(200);
    await chart.replayStop();
    await chart.replayStep(1);
    await flush();
    expect(events.map(([event]) => event)).toEqual([
      'replayLoaded', 'replayPoint', 'replayResolution', 'replayPoint', 'replayPoint', 'replayEnd',
    ]);
    expect(events[2]).toEqual(['replayResolution', '1D', '1S']);
    expect(connection.packets('replay_start')[0].p[2]).toBe(200);

    chart.setMarket('BINANCE:BTCEUR');
    expect(chart.isReplay).toBe(false);
    expect(connection.packets('replay_delete_session')).toHaveLength(1);
    await client.close();
  });

  it('rejects pending replay requests when deleted, and delete() is idempotent', async () => {
    const { server, client, connection } = await setup();
    server.on('replay_step', () => true); // Never answer.
    const chart = client.createChart();
    chart.setMarket('BINANCE:BTCEUR', { replay: 1_700_000_000 });
    const step = chart.replayStep();
    chart.delete();
    chart.delete();
    await expect(step).rejects.toMatchObject({ code: 'INVALID_STATE' });
    expect(connection.packets('chart_delete_session')).toHaveLength(1);
    expect(connection.packets('replay_delete_session')).toHaveLength(1);
    expect(chart.isDeleted).toBe(true);
    expect(() => chart.setMarket('X')).toThrow(/deleted/);
    await client.close();
  });

  it('reports DISCONNECTED to charts and studies when the connection drops', async () => {
    const { client, connection } = await setup();
    const chart = client.createChart();
    chart.setMarket('BINANCE:BTCEUR');
    const study = chart.createStudy(new BuiltInIndicator('Volume@tv-basicstudies-241'));
    const errors: string[] = [];
    chart.on('error', (e) => errors.push(`chart:${e.code}`));
    study.on('error', (e) => errors.push(`study:${e.code}`));
    connection.drop();
    expect(errors.sort()).toEqual(['chart:DISCONNECTED', 'study:DISCONNECTED']);
    expect(chart.isDeleted).toBe(true);
    expect(study.isRemoved).toBe(true);
  });

  it('parses a captured live chart session', async () => {
    const { client, connection } = await setup();
    const chart = client.createChart();
    const study = chart.createStudy(new BuiltInIndicator('Volume@tv-basicstudies-241'));
    const errors: string[] = [];
    chart.on('error', (error) => errors.push(error.message));
    let ready = false;
    study.on('ready', () => { ready = true; });

    // Replay the capture with this chart's and study's random IDs.
    for (const message of live.messages) {
      for (const frame of decodeFrames(message)) {
        if (frame.type !== 'packet') continue;
        const json = JSON.stringify(frame.packet)
          .replaceAll('cs_fixture', chart.id).replaceAll('st_fixture', study.id);
        connection.push(JSON.parse(json));
      }
    }

    expect(chart.symbolInfo).toMatchObject({ full_name: 'BINANCE:BTCEUR', currency_code: 'EUR', series_id: 'ser_1' });
    expect(chart.candles).toHaveLength(3);
    for (const candle of chart.candles) {
      expect(candle.high).toBeGreaterThanOrEqual(Math.max(candle.open, candle.close));
      expect(candle.low).toBeLessThanOrEqual(Math.min(candle.open, candle.close));
    }
    expect(study.values.length).toBeGreaterThan(3);
    expect(Object.keys(study.values[0])).toEqual(['$time', 'plot_0', 'plot_1', 'plot_2']);
    expect(ready).toBe(true);
    expect(errors).toEqual(['(ser_2) Symbol error: invalid symbol']);
    await client.close();
  });
});

describe('intentional close', () => {
  it('does not report errors for sessions when client.close() is called', async () => {
    const { client } = await setup();
    const chart = client.createChart();
    chart.setMarket('BINANCE:BTCEUR');
    const study = chart.createStudy(new BuiltInIndicator('Volume@tv-basicstudies-241'));
    const quotes = client.createQuoteSession();
    const sub = quotes.subscribe('BINANCE:BTCEUR');
    const errors: unknown[] = [];
    for (const emitter of [chart, study, quotes, sub]) emitter.on('error', (e: unknown) => errors.push(e));
    await client.close();
    expect(errors).toEqual([]);
    expect(chart.isDeleted && study.isRemoved && quotes.isDeleted && sub.isClosed).toBe(true);
  });
});
