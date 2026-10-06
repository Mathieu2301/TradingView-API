import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { wsTransport } from '../../src/client/transport.js';
import { TradingViewClient } from '../../src/client/client.js';

async function localServer(mode: string) {
  const child = spawn('node', [fileURLToPath(new URL('../helpers/native-server.mjs', import.meta.url)), mode], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const exit = once(child, 'exit');
  const port = await Promise.race([
    once(child.stdout, 'data').then(([data]) => Number(String(data).trim())),
    exit.then(() => { throw new Error('Loopback fixture exited before listening'); }),
  ]);
  return {
    url: `ws://127.0.0.1:${port}`,
    async stop() { child.kill(); await exit; },
  };
}

// Real ws clients on Node/Bun against an independent Node loopback fixture.
describe('native websocket transport', () => {
  it('sends headers and text, decodes binary messages and reports a remote close', async () => {
    const server = await localServer('echo');
    let opened!: () => void;
    const open = new Promise<void>((resolve) => { opened = resolve; });
    let received!: (value: string) => void;
    const message = new Promise<string>((resolve) => { received = resolve; });
    let closed!: (value: unknown) => void;
    const close = new Promise((resolve) => { closed = resolve; });
    const errors: Error[] = [];
    const transport = wsTransport({ url: server.url, origin: 'https://www.tradingview.com', headers: { 'X-Test': 'native' } }, {
      onOpen: opened, onMessage: received, onError: (error) => errors.push(error),
      onClose: (code, reason) => closed({ code, reason }),
    });
    try {
      await open;
      expect(transport.isOpen).toBe(true);
      transport.send('Unicode: 日本語');
      expect(JSON.parse(await message)).toEqual({
        origin: 'https://www.tradingview.com', header: 'native', echo: 'Unicode: 日本語',
      });
      expect(await close).toEqual({ code: 1000, reason: 'finished' });
      expect(transport.isOpen).toBe(false);
      transport.close();
      expect(errors).toEqual([]);
    } finally {
      transport.close();
      await server.stop();
    }
  });

  it('propagates a failed native handshake to client readiness and sessions', async () => {
    const server = await localServer('reject');
    const client = new TradingViewClient({
      transport: (request, handlers) => wsTransport({ ...request, url: server.url }, handlers),
    });
    const errors: string[] = [];
    client.on('error', (error) => errors.push(error.code));
    const close = new Promise<void>((resolve) => { client.on('close', () => resolve()); });
    let cause: unknown;
    client.registerSession('test', { onPacket() {}, onClose: (error) => { cause = error.cause; } });
    try {
      await expect(client.ready).rejects.toMatchObject({ code: 'CONNECTION_ERROR' });
      await close;
      expect(client.isClosed).toBe(true);
      expect(errors).toEqual(['CONNECTION_ERROR']);
      expect(cause).toMatchObject({ code: 'CONNECTION_ERROR' });
    } finally {
      await client.close();
      await server.stop();
    }
  });
});

describe('native websocket loss', () => {
  function connect(url: string, options: ConstructorParameters<typeof TradingViewClient>[0] = {}) {
    const socketCloses: Array<number | undefined> = [];
    const client = new TradingViewClient({
      ...options,
      transport: (request, handlers) => wsTransport({ ...request, url }, {
        ...handlers,
        onClose: (code, reason) => { socketCloses.push(code); handlers.onClose(code, reason); },
      }),
    });
    const errors: string[] = [];
    client.on('error', (error) => errors.push(error.code));
    const sessions: Array<[string, boolean]> = [];
    client.registerSession('cs_native', { onPacket() {}, onClose: (error, expected) => sessions.push([error.code, expected]) });
    const closed = new Promise<number | undefined>((resolve) => { client.on('close', (code) => resolve(code)); });
    return { client, errors, sessions, closed, socketCloses };
  }

  it('reports an abrupt socket loss to sessions as an unexpected disconnection', async () => {
    const server = await localServer('drop');
    const { client, errors, sessions, closed } = connect(server.url);
    try {
      await client.ready;
      client.send('ping_server');
      expect(await closed).toBe(1006);
      expect(client.isClosed).toBe(true);
      expect(sessions).toEqual([['DISCONNECTED', false]]);
      expect(errors).toEqual([]);
      expect(() => client.send('late')).toThrow(/closed/);
    } finally {
      await client.close();
      await server.stop();
    }
  });

  it('detects a silent peer and releases the socket at once', async () => {
    const server = await localServer('silent');
    const { client, errors, sessions, closed, socketCloses } = connect(server.url, { inactivityTimeoutMs: 100 });
    try {
      await client.ready;
      const start = Date.now();
      expect(await closed).toBe(1006);
      expect(Date.now() - start).toBeLessThan(1_000);
      expect(errors).toEqual(['CONNECTION_ERROR']);
      expect(sessions).toEqual([['DISCONNECTED', false]]);
      expect(socketCloses).toEqual([1006]);
    } finally {
      await client.close();
      await server.stop();
    }
  });

  it('close() releases the socket of a peer that never answers the close', async () => {
    const server = await localServer('silent');
    const { client, sessions, socketCloses } = connect(server.url, { inactivityTimeoutMs: 0 });
    try {
      await client.ready;
      await client.close();
      expect(client.isClosed).toBe(true);
      expect(sessions).toEqual([['DISCONNECTED', true]]);
      // Without terminate(), Node's ws keeps the socket for its own 30 s close timeout.
      const start = Date.now();
      while (socketCloses.length === 0 && Date.now() - start < 1_000) {
        await new Promise((resolve) => { setTimeout(resolve, 10); });
      }
      expect(socketCloses).toHaveLength(1);
    } finally {
      await server.stop();
    }
  }, 10_000);
});
