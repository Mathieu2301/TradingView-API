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
