import { describe, expect, it } from 'vitest';
import { TradingViewClient } from '../../src/client/client.js';
import { ALL_QUOTE_FIELDS, resolveQuoteFields } from '../../src/quote/fields.js';
import { quoteSymbolKey } from '../../src/quote/quote-session.js';
import { FakeServer, flush, until } from '../helpers/fake-server.js';

async function setup() {
  const server = new FakeServer();
  const client = new TradingViewClient({ transport: server.transport });
  await client.ready;
  return { server, client, connection: server.last };
}

describe('quote fields', () => {
  it('resolves presets and explicit lists', () => {
    expect(resolveQuoteFields('price')).toEqual(['lp']);
    expect(resolveQuoteFields()).toEqual(ALL_QUOTE_FIELDS);
    expect(resolveQuoteFields([])).toEqual(ALL_QUOTE_FIELDS);
    expect(resolveQuoteFields(['lp', 'bid'])).toEqual(['lp', 'bid']);
  });
});

describe('QuoteSession', () => {
  it('creates a session with fields and streams merged data', async () => {
    const { client, connection } = await setup();
    const session = client.createQuoteSession({ fields: ['lp', 'ch'] });
    const sub = session.subscribe('BINANCE:BTCEUR');
    const events: unknown[][] = [];
    sub.onAny((event, ...args) => { events.push([event, ...args]); });
    await until(() => sub.isLoaded);

    expect(connection.packets('quote_create_session')[0].p).toEqual([session.id]);
    expect(connection.packets('quote_set_fields')[0].p).toEqual([session.id, 'lp', 'ch']);
    expect(connection.packets('quote_add_symbols')[0].p).toEqual([session.id, quoteSymbolKey('BINANCE:BTCEUR')]);

    connection.push({ m: 'qsd', p: [session.id, { n: sub.key, s: 'ok', v: { lp: 101 } }] });
    expect(sub.data).toMatchObject({ lp: 101, ch: 1, description: 'Fake BINANCE:BTCEUR' });
    expect(events.map(([event]) => event)).toEqual(['data', 'loaded', 'data']);
    expect(events[2][2]).toEqual({ lp: 101 });

    session.setFields('price');
    expect(connection.packets('quote_set_fields')[1].p).toEqual([session.id, 'lp']);
    await client.close();
  });

  it('shares one server subscription per symbol and session, with reference counting', async () => {
    const { client, connection } = await setup();
    const session = client.createQuoteSession();
    const a = session.subscribe('BINANCE:BTCEUR');
    await until(() => a.isLoaded);
    const b = session.subscribe('BINANCE:BTCEUR');
    const extended = session.subscribe('BINANCE:BTCEUR', { session: 'extended' });
    await until(() => b.isLoaded && extended.isLoaded);
    expect(b.data.lp).toBe(100);
    expect(connection.packets('quote_add_symbols')).toHaveLength(2);

    a.close();
    expect(connection.packets('quote_remove_symbols')).toHaveLength(0);
    b.close();
    b.close();
    expect(connection.packets('quote_remove_symbols').map((p) => p.p)).toEqual([[session.id, quoteSymbolKey('BINANCE:BTCEUR')]]);
    session.delete();
    session.delete();
    expect(connection.packets('quote_delete_session')).toHaveLength(1);
    expect(extended.isClosed).toBe(true);
    expect(() => session.subscribe('X')).toThrow(/deleted/);
    await client.close();
  });

  it('reports symbol errors and removes symbols nobody listens to', async () => {
    const { client, connection } = await setup();
    const session = client.createQuoteSession();
    const bad = session.subscribe('XXXXX');
    const error = await new Promise<any>((resolve) => { bad.on('error', resolve); });
    expect(error).toMatchObject({ code: 'QUOTE_ERROR', message: 'Quote error (XXXXX): no_such_symbol' });

    connection.push({ m: 'qsd', p: [session.id, { n: 'orphan', s: 'ok', v: {} }] });
    await flush();
    expect(connection.packets('quote_remove_symbols').at(-1)?.p).toEqual([session.id, 'orphan']);
    await client.close();
  });

  it('reports DISCONNECTED to subscriptions on unexpected disconnection', async () => {
    const { client, connection } = await setup();
    const session = client.createQuoteSession();
    const sub = session.subscribe('BINANCE:BTCEUR');
    const errors: string[] = [];
    sub.on('error', (e) => errors.push(e.code));
    session.on('error', (e) => errors.push(`session:${e.code}`));
    connection.drop();
    expect(errors).toEqual(['session:DISCONNECTED', 'DISCONNECTED']);
    expect(client.isClosed).toBe(true);
  });
});
