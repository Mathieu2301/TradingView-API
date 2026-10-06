import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { Agent, type ClientRequestArgs } from 'node:http';
import {
  connect, createServer, type AddressInfo, type Socket,
} from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createProxy } from '../../src/client/proxy.js';
import { TradingViewClient } from '../../src/client/client.js';
import type { TransportFactory } from '../../src/client/transport.js';
import { TradingViewError } from '../../src/errors.js';
import { request } from '../../src/http/request.js';

interface Fixture {
  proxyUrl: (auth?: string, protocol?: 'http' | 'https') => string;
  plainPort: number;
  connects: Array<{ target: string; authorized: boolean }>;
  stop(): Promise<void>;
}

// Node uses the built-in tunnel agents, Bun 1.3.6+ its native `proxy` option.
const bun = (globalThis as { Bun?: { version: string } }).Bun?.version;
const bunTooOld = bun !== undefined && !/^(1\.3\.([6-9]|\d{2,})|1\.([4-9]|\d{2,})\.|[2-9]\.)/.test(bun);

// Random per run, passed to the fixture through the environment and never logged.
const AUTH = `user:${randomBytes(12).toString('hex')}`;

async function startFixture(certDir?: string): Promise<Fixture> {
  const script = fileURLToPath(new URL('../helpers/proxy-server.mjs', import.meta.url));
  const child = spawn('node', certDir ? [script, certDir] : [script], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PROXY_AUTH: AUTH },
  });
  const exit = once(child, 'exit');
  const connects: Fixture['connects'] = [];
  const lines = createInterface({ input: child.stdout });
  const ports = await Promise.race([
    new Promise<{ proxy: number; secureProxy?: number; plain: number }>((resolve) => {
      lines.on('line', (line) => {
        const message = JSON.parse(line);
        if (message.proxy) resolve(message);
        else connects.push(message);
      });
    }),
    exit.then(() => { throw new Error('Proxy fixture exited before listening'); }),
  ]);
  return {
    proxyUrl: (auth = AUTH, protocol = 'http') => `${protocol}://${auth.split(':').map(encodeURIComponent).join(':')}`
      + `@127.0.0.1:${protocol === 'https' ? ports.secureProxy : ports.proxy}`,
    plainPort: ports.plain,
    connects,
    async stop() { child.kill(); await exit; },
  };
}

function openTransport(factory: TransportFactory, url: string) {
  let opened!: () => void;
  let failed!: (error: Error) => void;
  const open = new Promise<void>((resolve, reject) => { opened = resolve; failed = reject; });
  const messages: string[] = [];
  let received!: () => void;
  const message = new Promise<void>((resolve) => { received = resolve; });
  const transport = factory({ url, origin: 'https://www.tradingview.com', headers: {} }, {
    onOpen: opened,
    onMessage: (data) => { messages.push(data); received(); },
    onClose: () => failed(new Error('closed')),
    onError: failed,
  });
  return { transport, open, message, messages };
}

describe.skipIf(bunTooOld)('createProxy over a loopback proxy', () => {
  let fixture: Fixture;
  beforeAll(async () => { fixture = await startFixture(); });
  afterAll(async () => { await fixture?.stop(); });

  it('tunnels library HTTP requests with proxy basic auth', async () => {
    const proxy = createProxy(fixture.proxyUrl());
    const response = await request('http://api.tradingview.test:8080/echo', {
      form: { symbol: 'BINANCE:BTCUSDT' }, credentials: { session: 'abc', signature: 'def' },
    }, { fetch: proxy.fetch });

    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      method: 'POST',
      host: 'api.tradingview.test:8080',
      path: '/echo',
      cookie: 'sessionid=abc;sessionid_sign=def',
      contentType: 'application/x-www-form-urlencoded',
      body: 'symbol=BINANCE%3ABTCUSDT',
    });
    expect(fixture.connects).toContainEqual({ target: 'api.tradingview.test:8080', authorized: true });
  });

  it('follows or exposes redirects, keeps every set-cookie and decodes gzip', async () => {
    const proxy = createProxy(fixture.proxyUrl());
    const manual = await proxy.fetch('http://api.tradingview.test:8080/redirect', { redirect: 'manual' });
    expect(manual.status).toBe(302);
    expect(manual.headers.get('location')).toBe('/echo?redirected=1');
    expect(manual.headers.getSetCookie()).toEqual(['a=1; Path=/', 'b=2; Path=/']);

    const followed = await proxy.fetch('http://api.tradingview.test:8080/redirect', { method: 'POST', body: 'x' });
    expect(followed.redirected).toBe(true);
    expect(followed.url).toBe('http://api.tradingview.test:8080/echo?redirected=1');
    expect(await followed.json()).toMatchObject({ method: 'GET', path: '/echo?redirected=1', body: '' });

    const gzip = await proxy.fetch('http://api.tradingview.test:8080/gzip');
    expect(await gzip.json()).toMatchObject({ path: '/gzip' });
  });

  it('tunnels the websocket transport with its Origin header', async () => {
    const proxy = createProxy(new URL(fixture.proxyUrl()));
    const { transport, open, message, messages } = openTransport(proxy.transport, 'ws://data.tradingview.test:8080/');
    try {
      await open;
      transport.send('through the proxy');
      await message;
      expect(JSON.parse(messages[0])).toEqual({
        host: 'data.tradingview.test:8080', origin: 'https://www.tradingview.com', echo: 'through the proxy',
      });
      expect(fixture.connects).toContainEqual({ target: 'data.tradingview.test:8080', authorized: true });
    } finally {
      transport.close();
    }
  });

  it('reports a refused tunnel on both paths without leaking proxy credentials', async () => {
    const wrong = 'user:wrong-secret-value';
    const proxy = createProxy(fixture.proxyUrl(wrong));

    const httpError = await request('http://api.tradingview.test:8080/echo', {}, { fetch: proxy.fetch })
      .catch((error: unknown) => error);
    expect(httpError).toBeInstanceOf(TradingViewError);
    expect((httpError as TradingViewError).message).toContain('HTTP 407');
    expect((httpError as TradingViewError).message).not.toContain('wrong-secret-value');

    const client = new TradingViewClient({
      authToken: 'token',
      transport: (req, handlers) => proxy.transport({ ...req, url: 'ws://data.tradingview.test:8080/' }, handlers),
    });
    const wsError = await client.ready.catch((error: unknown) => error);
    expect(wsError).toMatchObject({ code: 'CONNECTION_ERROR' });
    // Bun's native WebSocket only reports "Proxy connection failed".
    expect((wsError as Error).message).toMatch(/HTTP 407|Proxy connection failed/);
    expect((wsError as Error).message).not.toContain('wrong-secret-value');
    await client.close();
    expect(fixture.connects).toContainEqual({ target: 'data.tradingview.test:8080', authorized: false });
  });

  it('honours an abort signal', async () => {
    const proxy = createProxy(fixture.proxyUrl());
    const controller = new AbortController();
    controller.abort();
    await expect(proxy.fetch('http://api.tradingview.test:8080/echo', { signal: controller.signal }))
      .rejects.toMatchObject({ name: 'AbortError' });
  });

  it.skipIf(bun)('uses a caller-supplied Agent (e.g. a SOCKS agent) for both paths', async () => {
    const hosts: string[] = [];
    // Stand-in for a third-party proxy agent: resolves every host to the fixture.
    class RoutingAgent extends Agent {
      override createConnection(options: ClientRequestArgs) {
        hosts.push(`${options.host}:${options.port}`);
        return connect(fixture.plainPort, '127.0.0.1');
      }
    }
    const proxy = createProxy(new RoutingAgent());
    const response = await proxy.fetch('http://api.tradingview.test:8080/echo');
    expect(await response.json()).toMatchObject({ host: 'api.tradingview.test:8080' });

    const { transport, open } = openTransport(proxy.transport, 'ws://data.tradingview.test:8080/');
    await open;
    transport.close();
    expect(hosts).toEqual(['api.tradingview.test:8080', 'data.tradingview.test:8080']);
  });

  it.skipIf(bun)('reports an unreachable or stalled proxy', async () => {
    const closed = createServer();
    await new Promise<void>((resolve) => { closed.listen(0, '127.0.0.1', resolve); });
    const closedPort = (closed.address() as AddressInfo).port;
    await new Promise((resolve) => { closed.close(resolve); });
    await expect(createProxy(`http://u:hidden@127.0.0.1:${closedPort}`).fetch('http://api.tradingview.test/'))
      .rejects.toThrow(/is unreachable/);

    const sockets: Socket[] = [];
    const stalled = createServer((socket) => { sockets.push(socket); });
    await new Promise<void>((resolve) => { stalled.listen(0, '127.0.0.1', resolve); });
    try {
      const proxy = createProxy(`http://127.0.0.1:${(stalled.address() as AddressInfo).port}`, { connectTimeoutMs: 50 });
      await expect(proxy.fetch('http://api.tradingview.test/')).rejects.toMatchObject({ code: 'TIMEOUT' });
    } finally {
      for (const socket of sockets) socket.destroy();
      await new Promise((resolve) => { stalled.close(resolve); });
    }
  });

  it.skipIf(!bun)('rejects Node agents on Bun', () => {
    expect(() => createProxy(new Agent())).toThrow(/Bun ignores Node agents/);
  });

  it('rejects unsupported proxy URLs', () => {
    expect(() => createProxy('socks5://127.0.0.1:1080')).toThrow(/pass an Agent/);
    expect(() => createProxy('not a url')).toThrow(/Invalid proxy URL/);
  });
});

function hasOpenssl(): boolean {
  try {
    execFileSync('openssl', ['version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Full client flow with the real TradingView URLs: account lookup over HTTPS and
// the wss handshake both resolve only through the proxy, to local TLS servers.
describe.skipIf(bunTooOld || !hasOpenssl())('createProxy end to end over TLS', () => {
  let fixture: Fixture;
  let certDir: string;
  beforeAll(async () => {
    certDir = mkdtempSync(join(tmpdir(), 'tv-proxy-'));
    execFileSync('openssl', [
      'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=tradingview.com',
      '-addext', 'subjectAltName=DNS:tradingview.com,DNS:*.tradingview.com,IP:127.0.0.1',
      '-keyout', join(certDir, 'key.pem'), '-out', join(certDir, 'cert.pem'),
    ], { stdio: 'ignore' });
    fixture = await startFixture(certDir);
  });
  afterAll(async () => {
    await fixture?.stop();
    if (certDir) rmSync(certDir, { recursive: true, force: true });
  });

  it('authenticates a TradingViewClient through the proxy on both HTTPS and WSS', async () => {
    const proxy = createProxy(fixture.proxyUrl(), { tls: { ca: readFileSync(join(certDir, 'cert.pem')) } });
    const client = new TradingViewClient({ credentials: { session: 'proxy-session', signature: 'sig' }, ...proxy });
    const ack = new Promise<unknown[]>((resolve) => {
      client.on('packet', (packet) => { if (packet.m === 'proxy_ack') resolve(packet.p); });
    });
    try {
      await client.ready;
      expect(await ack).toEqual(['proxy-token', 'https://www.tradingview.com']);
      expect(client.serverInfo?.session_id).toBe('proxy-hello');
      expect([...fixture.connects].sort((a, b) => a.target.localeCompare(b.target))).toEqual([
        { target: 'data.tradingview.com:443', authorized: true },
        { target: 'www.tradingview.com:443', authorized: true },
      ]);
    } finally {
      await client.close();
    }
  });

  it('reaches TradingView through an https: proxy on both paths', async () => {
    const ca = readFileSync(join(certDir, 'cert.pem'));
    const proxy = createProxy(fixture.proxyUrl(AUTH, 'https'), { tls: { ca } });
    const response = await request('https://www.tradingview.com/echo', {}, { fetch: proxy.fetch });
    expect(response.data).toMatchObject({ host: 'www.tradingview.com', path: '/echo' });

    const { transport, open, message, messages } = openTransport(proxy.transport, 'wss://data.tradingview.com/');
    try {
      await open;
      transport.send('tls in tls');
      await message;
      expect(JSON.parse(messages[0])).toMatchObject({ host: 'data.tradingview.com', echo: 'tls in tls' });
    } finally {
      transport.close();
    }
  });

  it('rejects an untrusted certificate behind the tunnel', async () => {
    const proxy = createProxy(fixture.proxyUrl());
    await expect(request('https://www.tradingview.com/chart/', {}, { fetch: proxy.fetch }))
      .rejects.toMatchObject({ code: 'HTTP_ERROR' });
  });
});

describe.skipIf(!bunTooOld)('createProxy on Bun before 1.3.6', () => {
  it('refuses to create a proxy whose websocket would silently connect directly', () => {
    expect(() => createProxy('http://127.0.0.1:3128')).toThrow(/Bun 1\.3\.6 or later is required/);
  });
});
