# Low-level API

[README](../README.md) · [Data API](data-api.md) · [Migrating from v3](migration-v4.md) · [Examples](../examples)

Use the low-level API when you need full control: several charts and studies on one connection, replay mode, raw protocol access, or long-lived sessions you manage yourself. The [data API](data-api.md) is built on it.

```ts
import { TradingViewClient, BuiltInIndicator, getIndicator } from '@mathieuc/tradingview';
```

## Events

Clients, charts, studies, quote sessions and quote subscriptions share one typed event API:

```ts
const off = emitter.on('update', (changes) => {}); // Returns an unsubscribe function
emitter.once('symbolLoaded', (info) => {});
emitter.off('update', listener);
emitter.onAny((event, ...args) => {}); // Every event
```

An `error` event without any listener is written to `console.error`. A throwing listener never breaks the protocol state: its exception is re-thrown asynchronously.

## Client

```ts
const client = new TradingViewClient({
  credentials: { session: process.env.SESSION, signature: process.env.SIGNATURE }, // Optional
});
await client.ready; // Optional: packets are queued until the connection is ready
// ...
await client.close();
```

| Option | Description |
| --- | --- |
| `credentials` | `sessionid` / `sessionid_sign` cookies. The client loads the account (`getUser`) to get the websocket auth token. Without credentials, the session is anonymous. |
| `authToken` | Websocket auth token (`User.authToken`), to skip the account lookup. |
| `location` | Page used for the account lookup, e.g. `https://fr.tradingview.com/`. |
| `server` | `data` (default), `prodata` (paid accounts) or `widgetdata`. |
| `headers` | Extra websocket headers. |
| `debug` | `true` logs traffic with `console.log`; a function receives log arguments. |
| `transport` | Custom websocket transport (proxy, other library, tests). See [Transport](#transport). |
| `fetch` | Custom `fetch` for the account lookup. |
| `connectTimeoutMs` | Time allowed to open and authenticate. Default 20 000. |

| Member | Description |
| --- | --- |
| `ready` | Promise resolved once the auth token is sent; rejects on credential, connection or timeout failure. |
| `isOpen`, `isAuthenticated`, `isClosed` | State. |
| `serverInfo` | Server greeting (`session_id`, `release`, `protocol`...). |
| `createChart()` | New `ChartSession`. |
| `createQuoteSession(options)` | New `QuoteSession`. |
| `send(method, params)` | Sends a raw packet (escape hatch for commands this library does not wrap). |
| `close()` | Closes the connection; resolves once closed. Sessions are released without errors. |

Events: `open`, `hello` (server greeting), `ready`, `heartbeat` (answered automatically), `packet` (packets addressed to no session), `close` (code, reason), `error`.

If the connection drops unexpectedly, every chart, study and quote subscription emits a `DISCONNECTED` error. The client does not reconnect automatically: create a new client.

## Charts

```ts
const chart = client.createChart();
chart.on('symbolLoaded', (info) => console.log(info.description));
chart.on('update', (changes) => console.log(chart.lastCandle));
chart.on('error', (error) => console.error(error.code, error.message));

chart.setMarket('BINANCE:BTCEUR', { timeframe: '60', count: 300 });
```

`setMarket(symbol, options)`:

| Option | Description |
| --- | --- |
| `timeframe` | Default `D`. |
| `count` | Bars to load when the series is created (default 100). **Negative** values load bars *after* `to` instead of before it. |
| `to` | Reference time (Unix seconds) of the last bar. Sent as `['bar_count', to, count]`. |
| `adjustment`, `backAdjustment`, `session`, `currency` | As in the data API. |
| `type`, `inputs` | Custom chart type (`HeikinAshi`, `Renko`, `LineBreak`, `Kagi`, `PointAndFigure`, `Range`) and its inputs. |
| `replay` | Start replay mode at this Unix time. See [Replay](#replay). |

The first `setMarket` creates the series. Later calls (another symbol, type or replay) modify it and keep its bar count and studies: TradingView only accepts an empty range when modifying a series. Use `fetchMore` or a new chart to load a different amount.

| Member | Description |
| --- | --- |
| `candles` | Loaded bars, oldest first: `{ time, open, high, low, close, volume }`. |
| `lastCandle` | Most recent bar. |
| `symbolInfo` | Symbol metadata from `symbol_resolved` (with `series_id`). |
| `timeframe`, `seriesId`, `isReplay`, `isDeleted`, `studies` | State. |
| `setTimeframe(timeframe)` | Changes the timeframe (keeps studies). Throws `INVALID_STATE` before `setMarket`. |
| `setTimezone(timezone)` | Changes the chart timezone. |
| `fetchMore(count)` | Loads older bars (negative: newer bars after a past `to`). |
| `createStudy(indicator)` | Adds a study. |
| `delete()` | Deletes the chart and its replay session. Idempotent. |

Events: `symbolLoaded` (info), `update` (list of changed keys: `$prices` and/or study IDs), `seriesLoading`, `seriesCompleted` (`{ status, dataCompleted, turnaround }`: `dataCompleted` is `end` or `limit` when no more history can be loaded), `error`, and the replay events.

### Replay

```ts
chart.setMarket('BINANCE:BTCEUR', { timeframe: 'D', replay: Math.round(Date.now() / 1000) - 86_400 * 7, count: 1 });
chart.on('replayEnd', () => console.log('Reached the present'));

await chart.replayStep(1);     // One bar forward; resolves when the server confirms
await chart.replayStart(1000); // Play automatically, one bar per second
await chart.replayStop();
```

Replay events: `replayLoaded` (instance ID), `replayPoint` (cursor time), `replayResolution` (resolutions reported by the server), `replayEnd`. Replay methods reject with `INVALID_STATE` outside replay mode, and pending requests reject when the chart is deleted or the market changes.

## Studies

```ts
const rsi = await getIndicator('STD;RSI', { credentials });
rsi.setInput('Length', 21);
const study = chart.createStudy(rsi);

study.on('ready', () => console.log(study.values.at(-1)));
study.on('update', (changes) => {}); // 'plots', 'graphic', 'report.perf', 'report.trades'...
study.on('error', (error) => console.error(error.message));
```

| Member | Description |
| --- | --- |
| `values` | Rows `{ $time, <plot>: number }`, oldest first. |
| `graphics` | Parsed drawings (labels, lines, boxes, tables, polygons, horizontal lines and histograms, `raw`). |
| `strategyReport` | Strategy `performance`, `trades`, `history`, `currency`, `settings` (decoded from plain or compressed payloads). |
| `indicator`, `isReady`, `isRemoved` | State. |
| `setIndicator(indicator)` | Replaces the indicator, e.g. after changing inputs. |
| `remove()` | Removes the study. Idempotent. |

Events: `loading`, `ready` (`study_completed`), `update`, `error`.

### Indicator definitions

- `getIndicator(id, { version, credentials })` returns a `PineIndicator` from `STD;...`, `PUB;...` or `USER;...` IDs.
- `PineIndicator`: `id`, `version`, `description`, `shortDescription`, `inputs`, `plots`, `script`, `type`; `setInput(key, value)`, `setInputs(values)`, `findInput(key)`, `setType('StrategyScript@tv-scripting-101!')`, `clone()`.
- `new BuiltInIndicator(type, options?)`: built-in studies such as `Volume@tv-basicstudies-241` and the volume profiles (`VbPFixed@...`, `VbPSessions@...`, `VbPVisible@...`). `setOption(key, value, force?)` validates names and types for known types unless `force` is true.
- `parseIndicatorDefinition(result, id, version)` builds a `PineIndicator` from a cached `pine-facade` response.

## Quotes

```ts
const quotes = client.createQuoteSession({ fields: ['lp', 'bid', 'ask'] }); // or 'all' / 'price'
const btc = quotes.subscribe('BINANCE:BTCEUR', { session: 'regular' });
btc.on('data', (quote, changes) => console.log(quote.lp, changes));
btc.on('loaded', () => {});
btc.on('error', (error) => {});

btc.close();       // Stops this subscription
quotes.setFields('all');
quotes.delete();   // Deletes the session and its subscriptions
```

Subscriptions to the same symbol and session share one server subscription; the symbol is removed from the server when the last one closes. `btc.data` holds the merged latest values.

## HTTP functions

All accept `{ fetch?, signal?, headers? }`; functions that can use an account also accept `credentials`.

| Function | Description |
| --- | --- |
| `searchMarkets(text, { type, exchange, offset })` | Symbol search (v3 endpoint). |
| `getTechnicalAnalysis(symbol)` | Technical ratings for 1m to 1M periods, or `null`. |
| `searchIndicators(text)` | Built-in (cached in memory; `clearIndicatorCache()`) and community indicators. |
| `getIndicator(id, { version, credentials })` | Pine indicator definition. |
| `getPrivateIndicators(credentials)` | Your saved scripts. |
| `loginUser({ username, password, remember, userAgent })` | Signs in and returns the account with its cookies. Accounts with 2FA or captcha challenges are not supported. |
| `getUser(credentials, { location, maxRedirects })` | Account behind session cookies (follows regional redirects, stops loops). |
| `getChartToken(layoutId, { credentials, userId })` | Chart-storage token for a layout. |
| `getDrawings(layoutId, { symbol, chartId, credentials, userId })` | Drawings saved in a layout. |
| `new PinePermissionManager(pineId, { credentials })` | `getUsers(limit, order)`, `addUser(username, expiration?)`, `modifyExpiration(username, expiration?)`, `removeUser(username)` for invite-only scripts you own. |

## Transport

The default transport uses the [`ws`](https://github.com/websockets/ws) package, which works in Node and Bun. To use a proxy or another websocket implementation, pass `transport`:

```ts
import type { TransportFactory } from '@mathieuc/tradingview';

const transport: TransportFactory = ({ url, origin, headers }, handlers) => {
  const socket = createMySocket(url, { origin, headers });
  socket.onopen = () => handlers.onOpen();
  socket.onmessage = (event) => handlers.onMessage(String(event.data));
  socket.onclose = (event) => handlers.onClose(event.code, event.reason);
  socket.onerror = (event) => handlers.onError(new Error(String(event)));
  return {
    get isOpen() { return socket.readyState === 1; },
    send: (data) => socket.send(data),
    close: () => socket.close(),
  };
};

const client = new TradingViewClient({ transport });
```

The same mechanism lets tests run without network access (see `tests/helpers/fake-server.ts`).

## Protocol helpers

`protocol` exposes the wire format for debugging and custom tooling:

```ts
import { protocol } from '@mathieuc/tradingview';

protocol.encodePacket('set_auth_token', ['token']); // '~m~36~m~{"m":"set_auth_token","p":["token"]}'
protocol.decodeFrames(rawMessage);  // [{ type: 'packet' | 'heartbeat' | 'data' | 'invalid', ... }]
protocol.decodeCompressed(base64);  // Strategy report payloads (ZIP, zlib, raw deflate, gzip, JSON)
protocol.createSessionId('cs');     // 'cs_Ab12Cd34Ef56'
```

Frames are `~m~<length>~m~<payload>`, where the length counts UTF-16 code units; heartbeats are `~h~<id>` and must be echoed (the client does it).
