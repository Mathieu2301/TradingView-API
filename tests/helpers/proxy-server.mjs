// Node loopback fixture: an HTTP CONNECT proxy plus the servers it tunnels to.
// The proxy maps every requested host to 127.0.0.1, so names such as
// `api.tradingview.test` or `data.tradingview.com` only work through it.
// Port 443 reaches the TLS server (when a certificate is given), any other
// port reaches the plain server. Each proxied request is logged as a JSON line.
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { createServer as createSecureServer } from 'node:https';
import { connect } from 'node:net';
import { gzipSync } from 'node:zlib';
import { WebSocketServer } from 'ws';

const expectedAuth = process.env.PROXY_AUTH
  ? `Basic ${Buffer.from(process.env.PROXY_AUTH).toString('base64')}` : undefined;
const certDir = process.argv[2];

function frame(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  return `~m~${text.length}~m~${text}`;
}

function handle(request, response) {
  const chunks = [];
  request.on('data', (chunk) => chunks.push(chunk));
  request.on('end', () => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === '/redirect') {
      response.writeHead(302, { location: '/echo?redirected=1', 'set-cookie': ['a=1; Path=/', 'b=2; Path=/'] });
      response.end();
      return;
    }
    if (url.pathname === '/chart/') {
      if (!/sessionid=proxy-session/.test(request.headers.cookie ?? '')) {
        response.writeHead(302, { location: '/accounts/signin/' });
        response.end();
        return;
      }
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end('<script>window.user = {"id":42,"username":"proxied","auth_token":"proxy-token"};</script>');
      return;
    }
    const body = JSON.stringify({
      method: request.method,
      host: request.headers.host,
      path: url.pathname + url.search,
      cookie: request.headers.cookie,
      contentType: request.headers['content-type'],
      body: Buffer.concat(chunks).toString(),
    });
    if (url.pathname === '/gzip') {
      response.writeHead(200, { 'content-type': 'application/json', 'content-encoding': 'gzip' });
      response.end(gzipSync(body));
      return;
    }
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(body);
  });
}

function attachWebSocket(server) {
  new WebSocketServer({ server }).on('connection', (socket, request) => {
    if (request.url?.startsWith('/socket.io/websocket')) {
      // Minimal TradingView greeting; acknowledges the auth token as a packet.
      socket.send(frame({ session_id: 'proxy-hello', timestamp: 1 }));
      socket.on('message', (data) => {
        const token = /"set_auth_token","p":\["([^"]*)"\]/.exec(data.toString())?.[1];
        if (token) socket.send(frame({ m: 'proxy_ack', p: [token, request.headers.origin] }));
      });
      return;
    }
    socket.on('message', (data) => {
      socket.send(JSON.stringify({ host: request.headers.host, origin: request.headers.origin, echo: data.toString() }));
      socket.close(1000, 'finished');
    });
  });
}

function listen(server) {
  return new Promise((resolve) => { server.listen(0, '127.0.0.1', () => resolve(server.address().port)); });
}

const plain = createServer(handle);
attachWebSocket(plain);
const plainPort = await listen(plain);

let securePort;
const tlsOptions = certDir && { key: readFileSync(`${certDir}/key.pem`), cert: readFileSync(`${certDir}/cert.pem`) };
if (tlsOptions) {
  const secure = createSecureServer(tlsOptions, handle);
  attachWebSocket(secure);
  securePort = await listen(secure);
}

// Absolute-form forwarding for plain-HTTP targets (Bun's fetch proxies them this way).
function forward(request, response) {
  const target = URL.canParse(request.url) ? new URL(request.url) : undefined;
  const authorized = !expectedAuth || request.headers['proxy-authorization'] === expectedAuth;
  if (!target) {
    response.writeHead(405);
    response.end();
    return;
  }
  console.log(JSON.stringify({ target: target.host, authorized }));
  if (!authorized) {
    response.writeHead(407, { 'proxy-authenticate': 'Basic' });
    response.end();
    return;
  }
  const headers = { ...request.headers };
  delete headers['proxy-authorization'];
  delete headers['proxy-connection'];
  const upstream = httpRequest({
    host: '127.0.0.1', port: plainPort, method: request.method, path: target.pathname + target.search, headers,
  }, (answer) => {
    response.writeHead(answer.statusCode, answer.rawHeaders);
    answer.pipe(response);
  });
  upstream.on('error', () => response.destroy());
  request.pipe(upstream);
}

function tunnel(request, client, head) {
  const authorized = !expectedAuth || request.headers['proxy-authorization'] === expectedAuth;
  console.log(JSON.stringify({ target: request.url, authorized }));
  if (!authorized) {
    client.end('HTTP/1.1 407 Proxy Authentication Required\r\nProxy-Authenticate: Basic\r\n\r\n');
    return;
  }
  const port = Number(request.url.split(':').pop()) === 443 ? securePort : plainPort;
  if (!port) {
    client.end('HTTP/1.1 502 Bad Gateway\r\n\r\n');
    return;
  }
  const upstream = connect(port, '127.0.0.1', () => {
    client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    if (head.length) upstream.write(head);
    upstream.pipe(client);
    client.pipe(upstream);
  });
  upstream.on('error', () => client.destroy());
  client.on('error', () => upstream.destroy());
}

const proxy = createServer(forward).on('connect', tunnel);
// With a certificate, the same proxy is also offered over TLS (`https:` proxy URL).
const secureProxy = tlsOptions && createSecureServer(tlsOptions, forward).on('connect', tunnel);
console.log(JSON.stringify({
  proxy: await listen(proxy), secureProxy: secureProxy && await listen(secureProxy), plain: plainPort,
}));
