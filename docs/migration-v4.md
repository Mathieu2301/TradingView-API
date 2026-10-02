# Migrating from v3 to v4

[README](../README.md) · [Data API](data-api.md) · [Low-level API](low-level-api.md) · [Coverage matrix](v4-coverage.md)

Version 4 is a complete TypeScript rewrite with **no compatibility layer**. Every v3 capability is still available (see the [coverage matrix](v4-coverage.md)), under a more consistent API. This page shows how to translate v3 code.

## Package

| v3 | v4 |
| --- | --- |
| CommonJS: `const TradingView = require('@mathieuc/tradingview')` | ESM: `import { ... } from '@mathieuc/tradingview'`. On Node ≥ 20.19 or ≥ 22.12, `require()` of the ESM package also works. |
| `agent.js` preview (`fetchCandles`, `watchCandles`) | `@mathieuc/tradingview/data` (`getCandles`, `watchCandles`, quotes, indicators...) |
| Preview `MarketDataProvider` / `TradingViewProvider` | Provider-neutral candle injection remains: `getCandles(query, provider)`, `watchCandles(query, handlers, provider)` |
| Node ≥ 14, untyped JSDoc | Node ≥ 20 or Bun, bundled TypeScript declarations |
| `axios`, `jszip`, `ws` dependencies | `ws` only (HTTP uses the built-in `fetch`) |

## Simplest path: the data API

```js
// v3
const client = new TradingView.Client();
const chart = new client.Session.Chart();
chart.setMarket('BINANCE:BTCEUR', { timeframe: 'D', range: 100 });
chart.onUpdate(() => { console.log(chart.periods); client.end(); });

// v4
import { getCandles } from '@mathieuc/tradingview/data';
const candles = await getCandles({ symbol: 'BINANCE:BTCEUR', timeframe: 'D', count: 100 });
```

## Client

| v3 | v4 |
| --- | --- |
| `new Client({ token, signature })` | `new TradingViewClient({ credentials: { session, signature } })` |
| `server`, `location`, `headers` options | Same names |
| `DEBUG: true` (sets a global flag) | `debug: true` or `debug: (...args) => {}` (per client) |
| (not available) | `authToken`, `transport`, `fetch`, `connectTimeoutMs`, `client.ready` |
| `client.onConnected(cb)` | `client.on('open', cb)` |
| `client.onDisconnected(cb)` | `client.on('close', cb)` |
| `client.onLogged(cb)` | `client.on('ready', cb)`; the server greeting is `client.on('hello', cb)` / `client.serverInfo` |
| `client.onPing(cb)` | `client.on('heartbeat', cb)` |
| `client.onData(cb)` | `client.on('packet', cb)` |
| `client.onError(cb)` (`(...messages)`) | `client.on('error', (error) => ...)` (`TradingViewError`) |
| `client.onEvent(cb)` | `client.onAny((event, ...args) => ...)` |
| `client.isLogged`, `client.isOpen` | `client.isAuthenticated`, `client.isOpen` (and `client.isClosed`) |
| `client.send(t, p)` / `client.sendQueue()` | `client.send(method, params)`; the queue is flushed automatically |
| `client.end()` | `await client.close()` (now resolves once actually closed) |
| `new client.Session.Chart()` | `client.createChart()` |
| `new client.Session.Quote(options)` | `client.createQuoteSession(options)` |

## Charts

| v3 | v4 |
| --- | --- |
| `chart.setMarket(symbol, { range, to, backadjustment, ... })` | `chart.setMarket(symbol, { count, to, backAdjustment, ... })` (`timeframe`, `adjustment`, `session`, `currency`, `type`, `inputs`, `replay` unchanged). The default timeframe is now `D` (v3: `240`). An empty symbol throws instead of loading `BTCEUR`. |
| `chart.setSeries(timeframe)` | `chart.setTimeframe(timeframe)` (throws `INVALID_STATE` before `setMarket` instead of emitting an error) |
| `chart.periods` (newest first; `max`/`min`; volume rounded to 2 decimals) | `chart.candles` (**oldest first**; `high`/`low`; raw volume) and `chart.lastCandle` |
| `chart.infos` | `chart.symbolInfo` |
| `chart.setTimezone(tz)` | Same (no longer clears loaded bars) |
| `chart.fetchMore(n)` | Same |
| `chart.replayStep/Start/Stop()` | Same; they now reject with `INVALID_STATE` outside replay mode instead of never resolving |
| `chart.onSymbolLoaded(cb)` | `chart.on('symbolLoaded', (info) => ...)` |
| `chart.onUpdate(cb)` | `chart.on('update', (changes) => ...)` |
| `chart.onReplayLoaded/Point/Resolution/End(cb)` | `chart.on('replayLoaded' / 'replayPoint' / 'replayResolution' / 'replayEnd', cb)` |
| `chart.onError(cb)` | `chart.on('error', (error) => ...)` |
| (not available) | `chart.on('seriesCompleted', ...)`, `chart.on('seriesLoading', ...)` |
| `new chart.Study(indicator)` | `chart.createStudy(indicator)` |
| `chart.delete()` | Same (idempotent) |

## Studies

| v3 | v4 |
| --- | --- |
| `study.periods` (newest first) | `study.values` (**oldest first**, still keyed by `$time` and plot names) |
| `study.graphic` | `study.graphics`; `tables[i].cells()` is now the `tables[i].cells` array; `raw()` is now the `raw` object |
| `study.strategyReport` | Same |
| `study.instance` | `study.indicator` |
| `study.setIndicator(indicator)`, `study.remove()` | Same |
| `study.onReady/onUpdate/onError(cb)` | `study.on('ready' / 'update' / 'error', cb)` (also `loading`) |

## Quotes

| v3 | v4 |
| --- | --- |
| `new client.Session.Quote({ fields: 'all' })` | `client.createQuoteSession({ fields: 'all' })` |
| `{ customFields: ['lp'] }` | `{ fields: ['lp'] }` |
| `new quoteSession.Market(symbol, session)` | `quoteSession.subscribe(symbol, { session })` |
| `market.onLoaded/onData/onError/onEvent(cb)` | `subscription.on('loaded' / 'data' / 'error', cb)` / `onAny(cb)`; `data` also receives the changed fields |
| `market.close()`, `quoteSession.delete()` | `subscription.close()`, `quoteSession.delete()` |

## Indicators

| v3 | v4 |
| --- | --- |
| `TradingView.getIndicator(id, version, session, signature)` | `getIndicator(id, { version, credentials })` |
| `indicator.pineId`, `indicator.pineVersion` | `indicator.id`, `indicator.version` |
| `indicator.setOption(key, value)` | `indicator.setInput(key, value)` (chainable; also `setInputs({...})`, `clone()`) |
| `indicator.setType(type)` | Same |
| `new BuiltInIndicator(type)` + `setOption(key, value, FORCE)` | Same, plus initial options: `new BuiltInIndicator(type, { first_bar_time })` |

## HTTP functions

| v3 | v4 |
| --- | --- |
| `searchMarketV3(text, filter, offset)` | `searchMarkets(text, { type, offset, exchange })` |
| `searchMarket(text, filter)` (deprecated v1 endpoint) | `searchMarkets(text, { type })` |
| `result.getTA()` | `getTechnicalAnalysis(result.id)` |
| `getTA(symbol)` (returned `false` without data) | `getTechnicalAnalysis(symbol)` (returns `null`) |
| `searchIndicator(text)` + `result.get()` | `searchIndicators(text)` + `getIndicator(result.id, { version: result.version })` |
| `getPrivateIndicators(session, signature)` + `result.get()` | `getPrivateIndicators({ session, signature })` + `getIndicator(result.id, { version, credentials })` |
| `loginUser(username, password, remember, UA)` | `loginUser({ username, password, remember, userAgent })` |
| `getUser(session, signature, location)` | `getUser({ session, signature }, { location })` (`id` is now a number) |
| `getChartToken(layout, { id, session, signature })` | `getChartToken(layout, { userId, credentials: { session, signature } })` |
| `getDrawings(layout, symbol, { id, session, signature }, chartID)` | `getDrawings(layout, { symbol, chartId, userId, credentials })` |
| `new PinePermManager(session, signature, pineId)` | `new PinePermissionManager(pineId, { credentials: { session, signature } })` (same methods) |

## Errors

v3 passed lists of strings to `onError` callbacks, or printed them. v4 uses `TradingViewError` everywhere, with a `code` (`SYMBOL_ERROR`, `SERIES_ERROR`, `CRITICAL_ERROR`, `STUDY_ERROR`, `AUTH_ERROR`, `TIMEOUT`...), a readable `message` and the raw server payload in `details`. Study errors are formatted with their context, e.g. `Study error: Invalid value of the 'factor' argument (-1)...`.

## High-level data preview (formerly agent-api)

| Preview (`agent.js`) | v4 |
| --- | --- |
| `fetchCandles({ symbol, timeframe, limit, timeoutMs, signal })` | `getCandles({ symbol, timeframe, count, timeoutMs, signal })` |
| `watchCandles(query, { onData, onError })` → `{ latest, stop() }` | `watchCandles(query, { onData, onError })` → `{ latest, stop(), closed, isActive, symbolInfo }` |
| `TradingViewProvider` / `MarketDataProvider` injection | Provider injection remains: `getCandles(query, provider)` or `watchCandles(query, handlers, provider)`; `client` and `clientOptions.transport` also work for TradingView |
