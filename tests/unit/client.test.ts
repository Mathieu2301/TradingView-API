import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { TradingViewClient } from '../../src/client/client.js';
import { encodeFrame, encodePacket } from '../../src/protocol/framing.js';
import { FakeServer, flush, until } from '../helpers/fake-server.js';

const live = JSON.parse(readFileSync(new URL('../fixtures/live-session.json', import.meta.url), 'utf8'));

function setup(options: ConstructorParameters<typeof TradingViewClient>[0] = {}) {
  const server = new FakeServer();
  const client = new TradingViewClient({ transport: server.transport, ...options });
  return { server, client };
}

describe('TradingViewClient', () => {
  it('connects with browser-like headers and an anonymous token, then flushes queued packets', async () => {
    const { server, client } = setup({ server: 'prodata', headers: { 'X-Test': '1' } });
    client.send('custom_method', ['a']);
    expect(server.last.raw).toEqual([]);
    await client.ready;
    expect(server.last.request.url).toBe('wss://prodata.tradingview.com/socket.io/websocket?from=chart&type=chart');
    expect(server.last.request.origin).toBe('https://www.tradingview.com');
    expect(server.last.request.headers).toMatchObject({ 'X-Test': '1', 'User-Agent': expect.stringContaining('Mozilla') });
    expect(server.last.raw).toEqual([
      encodePacket('set_auth_token', ['unauthorized_user_token']),
      encodePacket('custom_method', ['a']),
    ]);
    expect(client.isOpen).toBe(true);
    expect(client.isAuthenticated).toBe(true);
    await client.close();
  });

  it('uses an explicit auth token', async () => {
    const { server, client } = setup({ authToken: 'secret-token' });
    await client.ready;
    expect(server.last.sent[0]).toEqual({ m: 'set_auth_token', p: ['secret-token'] });
    await client.close();
  });

  it('loads the auth token from credentials with the account lookup', async () => {
    const fetch = vi.fn(async () => new Response('<script>{"id":1,"username":"me","auth_token":"from-account"}</script>'));
    const { server, client } = setup({ credentials: { session: 's', signature: 'sig' }, fetch: fetch as any, location: 'https://fr.tradingview.com/' });
    await client.ready;
    expect(fetch).toHaveBeenCalledWith('https://fr.tradingview.com/', expect.objectContaining({
      headers: expect.objectContaining({ cookie: 'sessionid=s;sessionid_sign=sig' }),
      redirect: 'manual',
    }));
    expect(server.last.sent[0]).toEqual({ m: 'set_auth_token', p: ['from-account'] });
    await client.close();
  });

  it('fails, emits AUTH_ERROR and closes when credentials are rejected', async () => {
    const fetch = vi.fn(async () => new Response('no token here', { status: 200 }));
    const { server, client } = setup({ credentials: { session: 'bad' }, fetch: fetch as any });
    const errors: string[] = [];
    client.on('error', (error) => errors.push(error.code));
    await expect(client.ready).rejects.toMatchObject({ code: 'AUTH_ERROR' });
    await until(() => client.isClosed);
    expect(errors).toEqual(['AUTH_ERROR']);
    expect(server.last.closed).toBe(true);
  });

  it('rejects ready without logging when nobody listens, and passes the cause to sessions', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetch = vi.fn(async () => new Response('no token'));
    const { client } = setup({ credentials: { session: 'bad' }, fetch: fetch as any });
    const onClose = vi.fn();
    client.registerSession('cs_z', { onPacket: () => {}, onClose });
    await expect(client.ready).rejects.toMatchObject({ code: 'AUTH_ERROR' });
    await until(() => client.isClosed);
    expect(spy).not.toHaveBeenCalled();
    expect(onClose.mock.calls[0][0]).toMatchObject({
      code: 'DISCONNECTED', message: expect.stringContaining('Credentials error'), cause: expect.objectContaining({ code: 'AUTH_ERROR' }),
    });
    spy.mockRestore();
  });

  it('answers heartbeats and emits hello, heartbeat and unrouted packets', async () => {
    const { server, client } = setup();
    const events: string[] = [];
    client.onAny((event) => { events.push(event); });
    await client.ready;
    server.last.push({ session_id: 'srv', protocol: 'json' }, '~h~12', { m: 'unknown_packet', p: ['nobody'] });
    expect(server.last.heartbeats).toEqual([12]);
    expect(client.serverInfo?.session_id).toBe('srv');
    expect(events).toEqual(['open', 'ready', 'hello', 'heartbeat', 'packet']);
    await client.close();
  });

  it('routes packets to registered sessions', async () => {
    const { server, client } = setup();
    const received: unknown[] = [];
    client.registerSession('cs_x', { onPacket: (packet) => received.push(packet) });
    await client.ready;
    server.last.push({ m: 'series_loading', p: ['cs_x', '$prices', 's1'] });
    expect(received).toEqual([{ m: 'series_loading', p: ['cs_x', '$prices', 's1'] }]);
    await client.close();
  });

  it('turns protocol_error into an error event and closes', async () => {
    const { server, client } = setup();
    await client.ready;
    const error = new Promise((resolve) => { client.on('error', resolve); });
    server.last.push({ m: 'protocol_error', p: ['wrong data'] });
    await expect(error).resolves.toMatchObject({ code: 'PROTOCOL_ERROR', message: 'Protocol error: wrong data' });
    await until(() => client.isClosed);
  });

  it('notifies sessions and rejects readiness when the connection drops', async () => {
    const server = new FakeServer();
    server.autoOpen = false;
    const client = new TradingViewClient({ transport: server.transport });
    const onClose = vi.fn();
    client.registerSession('cs_y', { onPacket: () => {}, onClose });
    const closed = new Promise((resolve) => { client.on('close', (code) => resolve(code)); });
    server.last.drop(1006, 'gone');
    await expect(client.ready).rejects.toMatchObject({ code: 'DISCONNECTED' });
    await expect(closed).resolves.toBe(1006);
    expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ code: 'DISCONNECTED' }), false);
    expect(() => client.send('late')).toThrow(/closed/);
  });

  it('times out if the connection never opens', async () => {
    const server = new FakeServer();
    server.autoOpen = false;
    const client = new TradingViewClient({ transport: server.transport, connectTimeoutMs: 10 });
    client.on('error', () => {});
    await expect(client.ready).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('close() is idempotent and waits for the socket to close', async () => {
    const { client } = setup();
    await client.ready;
    await Promise.all([client.close(), client.close()]);
    expect(client.isClosed).toBe(true);
    await client.close();
  });

  it('logs traffic through a debug function', async () => {
    const lines: unknown[][] = [];
    const { client } = setup({ debug: (...args) => lines.push(args) });
    await client.ready;
    client.send('ping_me');
    await flush();
    expect(lines.some(([kind]) => kind === 'send')).toBe(true);
    await client.close();
  });

  it('routes a captured live session to chart and quote sessions', async () => {
    const { server, client } = setup();
    const chartPackets: string[] = [];
    const quotePackets: string[] = [];
    client.registerSession('cs_fixture', { onPacket: (p) => chartPackets.push(p.m) });
    client.registerSession('qs_fixture', { onPacket: (p) => quotePackets.push(p.m) });
    await client.ready;
    for (const message of live.messages) server.last.handlers.onMessage(message);
    expect(chartPackets).toEqual(expect.arrayContaining(['symbol_resolved', 'timescale_update', 'series_completed', 'du', 'symbol_error']));
    expect(quotePackets).toEqual(expect.arrayContaining(['qsd', 'quote_completed']));
    expect(client.serverInfo?.protocol).toBe('json');
    await client.close();
  });

  it('accepts a raw frame string through send()', async () => {
    const { server, client } = setup();
    await client.ready;
    client.send('quote_fast_symbols', ['qs_1', 'A']);
    expect(server.last.raw.at(-1)).toBe(encodeFrame({ m: 'quote_fast_symbols', p: ['qs_1', 'A'] }));
    await client.close();
  });
});
