# v4 coverage matrix

[Migration guide](migration-v4.md) · [Data API](data-api.md) · [Low-level API](low-level-api.md) · [Reliability evidence](v4-reliability.md)

This matrix lists every capability of v3 (`main.js`, `src/`, examples, tests) and of the `agent.ts` preview, with its v4 replacement and the evidence that it works.

**Evidence columns**

- **Unit**: deterministic test in `tests/unit/` (`npm test` with Vitest on Node, `npm run test:bun` with Bun's runner; 109 tests, both green). Websocket tests use a scripted fake server (`tests/helpers/fake-server.ts`) or packets captured from TradingView (`tests/fixtures/live-session.json`); HTTP tests use a mocked `fetch`.
- **Live**: result of `npm run test:live` (`tests/live/`) and examples against TradingView on **2 October 2026**: 17 anonymous tests locally (including connection recovery) and 21 tests (including five authenticated) in the [manual GitHub Actions run](https://github.com/Mathieu2301/TradingView-API/actions/runs/37075296707):
  - ✅ verified live anonymously;
  - 🔒 path or variant not exercised live (often requires a specific account asset); deterministic tests only;
  - ➖ not applicable (no network involved).

Test names are abbreviated as `file › test`.

## Package and tooling

| v3 capability | v4 | Unit evidence | Live |
| --- | --- | --- | --- |
| CommonJS entry `require('@mathieuc/tradingview')` (`main.js`) | ESM entry `@mathieuc/tradingview` with `.d.ts`; `require()` works on Node ≥ 20.19/22.12 (require(esm)) | `exports › root entry...`; `scripts/smoke.mjs` (packs the tarball, imports under Node and Bun, `require()` check, strict TS consumer without `@types/node`) | ➖ |
| `agent.js` / `agent.d.ts` preview entry | `@mathieuc/tradingview/data` subpath | `exports › data entry only exposes...`; smoke test | ➖ |
| JSDoc types (`src/types.js`: `Timezone`, `TimeFrame`, `MarketSymbol`) | TypeScript types `Timezone`, `Timeframe`, `MarketSymbol` (`src/chart/types.ts`) | `npm run typecheck`; smoke consumer | ➖ |
| `build:agent`, `lint:agent`, `prepack` scripts | `build`, `typecheck`, `lint`, `test`, `test:bun`, `test:live`, `smoke`, `check`, `prepack` | CI workflow | ➖ |
| CI: Node 14/18/19 live tests on every push + nightly; agent job | CI: typecheck, lint, unit tests (Vitest), build and smoke on Node 20/22/24; unit tests with Bun's test runner and smoke on Bun; live tests only nightly/manual, non-blocking | `.github/workflows/tests.yml` | ➖ |
| `docs/DOCS.md` (pointer to JSDoc) | `docs/data-api.md`, `docs/low-level-api.md`, `docs/migration-v4.md`, this matrix | n/a | ➖ |

## Protocol and transport

| v3 capability | v4 | Unit evidence | Live |
| --- | --- | --- | --- |
| `protocol.parseWSPacket` (frame split, heartbeat as number, invalid JSON warning) | `protocol.decodeFrames` (length-based, UTF-16 lengths, typed frames, lenient fallback, invalid frames reported) | `protocol › decodes several frames...`, `keeps payloads containing frame markers intact`, `reports invalid JSON...`, `falls back to splitting malformed input`, `decodes every message of a captured live session` | ✅ (fixture captured live; UTF-16 lengths checked on Japanese/Korean descriptions) |
| `protocol.formatWSPacket` | `protocol.encodeFrame`, `encodePacket`, `encodeHeartbeat` | `protocol › encodes packets with UTF-16 lengths` | ✅ |
| `protocol.parseCompressed` (ZIP via jszip, base64 normalisation, zlib/raw/gzip fallbacks) | `protocol.decodeCompressed` (built-in ZIP reader: stored, deflated, data descriptors, empty entry names; zlib, raw deflate, gzip, plain JSON) and `normaliseBase64`, `readFirstZipEntry` | `protocol › compressed payloads › *` (ZIP fixtures generated independently with Python `zipfile`) | 🔒 live compressed strategy payload not captured; plain report verified |
| `utils.genSessionID` | `protocol.createSessionId` (crypto-random) | `protocol › ids` | ➖ |
| `utils.genAuthCookies` | Internal cookie builder used by every HTTP call | `http › * with credentials` (cookie headers asserted) | ➖ |
| Websocket URL `wss://<server>.tradingview.com/socket.io/websocket?from=chart&type=chart`, Origin and browser headers | Same, in `TradingViewClient`; transport is pluggable (`transport` option, default `ws`) | `client › connects with browser-like headers...` | ✅ Node and Bun (Bun needed the Origin header fix) |
| Heartbeat (`~h~`) echo, `onPing` | Automatic echo, `heartbeat` event | `client › answers heartbeats...` | ✅ |
| `protocol_error` → error + close | `PROTOCOL_ERROR` error + close | `client › turns protocol_error into an error event and closes` | ✅ (observed during probes) |
| Send queue until open and authenticated; `sendQueue()` | Automatic queue and flush | `client › connects ... then flushes queued packets` | ✅ |
| Packet routing to sessions by ID | Same (`registerSession`) | `client › routes packets to registered sessions`, `routes a captured live session...` | ✅ |
| `global.TW_DEBUG` / `DEBUG` option | Per-client `debug: true | (...args) => void` | `client › logs traffic through a debug function` | ✅ |

## Client, authentication and events

| v3 capability | v4 | Unit evidence | Live |
| --- | --- | --- | --- |
| `new Client()` anonymous (`unauthorized_user_token`) | `new TradingViewClient()` | `client › connects with ... an anonymous token` | ✅ |
| `token` + `signature` options → `getUser` → `set_auth_token` | `credentials: { session, signature }` (and new `authToken`) | `client › loads the auth token from credentials...`, `uses an explicit auth token` | ✅ (`authenticated › gets the account`, `opens an authenticated connection`) |
| `location` option | `location` | `client › loads the auth token...` (asserts the regional URL) | 🔒 |
| `server` option (`data`, `prodata`, `widgetdata`) | `server` | `client › connects with browser-like headers...` (`prodata` URL) | ✅ `data`; 🔒 `prodata` |
| `headers` option | `headers` | `client › connects with browser-like headers...` | ✅ |
| Credentials error reported through `onError` | `AUTH_ERROR` (rejects `ready`, `error` event, connection closed, cause passed to sessions) | `client › fails, emits AUTH_ERROR...`, `rejects ready without logging...` | ✅ (fake cookie rejected live in `examples/errors.js`) |
| `onConnected`, `onDisconnected`, `onLogged`, `onPing`, `onData`, `onError`, `onEvent` | `open`, `close`, `ready`/`hello`, `heartbeat`, `packet`, `error` events and `onAny` | `client › answers heartbeats and emits hello, heartbeat and unrouted packets`, `events › *` | ✅ |
| `isLogged`, `isOpen` | `isAuthenticated`, `isOpen`, `isClosed`, `serverInfo` | `client › connects ...` | ✅ |
| `client.send(t, p)` raw packets | `client.send(method, params)` | `client › accepts a raw frame string through send()` | ✅ |
| `client.end()` | `client.close()` (resolves when closed, idempotent, sessions released silently) | `client › close() is idempotent...`, `chart › intentional close` | ✅ |
| Disconnection handling | `DISCONNECTED` to charts, studies, quote subscriptions and pending calls | `client › notifies sessions...`, `chart › reports DISCONNECTED...`, `quote › reports DISCONNECTED...`, `data › rejects with DISCONNECTED...` | ➖ (simulated) |
| (new) Connection timeout | `connectTimeoutMs`, `TIMEOUT` | `client › times out if the connection never opens` | ➖ |

## Charts

| v3 capability | v4 | Unit evidence | Live |
| --- | --- | --- | --- |
| `new client.Session.Chart()` / `chart_create_session` | `client.createChart()` | `chart › creates a session, resolves the symbol...` | ✅ |
| `setMarket(symbol, { timeframe, range })` | `setMarket(symbol, { timeframe, count })` | `chart › creates a session...`; `data › getCandles › *` | ✅ |
| Candles `chart.periods` (newest first, `max`/`min`) | `chart.candles` (oldest first, `high`/`low`), `lastCandle` | `chart › creates a session...`, `parses a captured live chart session` | ✅ |
| `to` reference (`['bar_count', to, range]`) | `to` option; `getCandles({ to })` | `chart › encodes market options...`, `data › loads a from/to range...` | ✅ recent past reference with account (`authenticated › uses an account timeframe...`); older history remains server-limited |
| Negative `range` (bars after `to`), "fake replay" | Negative `count` + `fetchMore(-n)` | `chart › encodes market options...` | ✅ (`sessions › loads bars after a past reference...`, `examples/fake-replay.js`) |
| `fetchMore(n)` / deep history | `chart.fetchMore(n)`; automatic batching in `getCandles` (`count` or `from`), stops on `data_completed` | `chart › fetches more history...`, `data › loads deep history in batches...`, `stops when the server has no more history` | ✅ (3 000 hourly and 6 600 hourly bars; anonymous cap observed as `data_completed: "limit"`) |
| (new) From/to date ranges | `getCandles({ from, to, maxCount })` | `data › loads a from/to range...` | ✅ (`from` anonymously, recent past `to` with account) |
| `adjustment` (`splits`/`dividends`) | `adjustment` | `chart › encodes market options...` | ✅ default; ➖ dividends |
| `backadjustment` | `backAdjustment` | `chart › encodes market options...`, `data › passes chart options...` | ➖ (encoding only) |
| `session` (`regular`/`extended`) | `session` | same | ➖ (encoding only) |
| `currency` (`currency-id`) | `currency` | same | ➖ (encoding only) |
| Custom chart types: HeikinAshi, Renko, LineBreak, Kagi, PointAndFigure, Range + `inputs` | `type` + `inputs`; `getCandles({ chartType, chartInputs })` | `chart › encodes market options...`, `modifies the series...` | ✅ all six (`data › gets custom chart types`, `examples/custom-chart-types.js`) |
| `setSeries(timeframe)` | `setTimeframe(timeframe)` | `chart › modifies the series on later setMarket/setTimeframe calls...` | ✅ (D → 15) |
| `setSeries` before market → error | `INVALID_STATE` thrown | `chart › modifies the series...` | ✅ (`examples/errors.js`) |
| `setTimezone(tz)` | `setTimezone(tz)`; `getCandles({ timezone })` | `chart › fetches more history and switches timezone` | ✅ |
| Custom timeframes (`1S`, `20`...) | Any `Timeframe` string | `data › passes chart options...` | ✅ account timeframe `240`; 🔒 `1S`/`20` not exercised |
| `onSymbolLoaded`, `chart.infos` | `symbolLoaded` event, `symbolInfo`; `getSymbolInfo()` | `chart › creates a session...`, `data › getSymbolInfo` | ✅ |
| `onUpdate(changes)` | `update` event | `chart › creates a session...` | ✅ |
| (new) `series_loading` / `series_completed` | `seriesLoading`, `seriesCompleted` (`dataCompleted: end|limit`) | `chart › fetches more history...` | ✅ |
| `symbol_error`, `series_error`, `critical_error` → `onError` | `SYMBOL_ERROR`, `SERIES_ERROR`, `CRITICAL_ERROR` | `chart › emits typed errors...` | ✅ (`sessions › reports server errors as typed errors`) |
| `delete()` | `delete()` (idempotent; also deletes the replay session) | `chart › rejects pending replay requests when deleted...` | ✅ |

## Replay

| v3 capability | v4 | Unit evidence | Live |
| --- | --- | --- | --- |
| `setMarket(symbol, { replay })` (replay session, add series, reset) | Same option | `chart › runs replay mode...` | ✅ |
| `replayStep(n)`, `replayStart(interval)`, `replayStop()` resolved by `replay_ok` | Same; reject with `INVALID_STATE` outside replay and on delete | `chart › runs replay mode...`, `rejects pending replay requests...` | ✅ step (`sessions › replays history step by step`); ➖ start/stop live |
| `onReplayLoaded`, `onReplayPoint`, `onReplayResolution`, `onReplayEnd` | `replayLoaded`, `replayPoint`, `replayResolution`, `replayEnd` events | `chart › runs replay mode...` | ✅ |
| Replay `critical_error` | `CRITICAL_ERROR` on the chart; pending replay requests rejected | (code path shared with chart errors) | ➖ |

## Studies, indicators and strategies

| v3 capability | v4 | Unit evidence | Live |
| --- | --- | --- | --- |
| `new chart.Study(indicator)` with instance check | `chart.createStudy(indicator)` (`INVALID_ARGUMENT` otherwise) | `study › creates a Pine study...`, `modifies and removes a study` | ✅ built-in and public Pine RSI with account |
| Pine inputs serialisation (`text`, `pineId`, `pineVersion`, `{ v, f, t }`, colours by index) | `PineIndicator.toStudyInputs()` | `indicators › serialises inputs for create_study...` | ✅ public Pine RSI inputs; colour variant unit-tested |
| `study.periods` with plot names, `plot_N` fallback for unnamed/duplicate plots | `study.values` (oldest first) | `study › creates a Pine study, names plots...`, `chart › parses a captured live chart session` | ✅ (built-in volume rows) |
| `study.graphic` (labels, lines, boxes, tables + cells, polygons, horizLines, horizHists, raw) and `graphicsCmds` erase/create | `study.graphics` (`cells` array, `raw` object) | `study › reads graphics commands...`, `applies erase commands` | ✅ horizontal histograms (volume profile); 🔒 Pine drawings |
| Bars-back translation of graphic X indexes | Same | `study › reads graphics commands...` | ✅ |
| `study.strategyReport` (plain `data.report` and compressed `dataCompressed`; trades, performance, history, currency, settings) | Same | `study › decodes plain and compressed strategy reports`, `reports undecodable strategy reports as PARSE_ERROR` | ✅ Supertrend strategy report with account; compressed variant unit-tested |
| `study.setIndicator()` (`modify_study`) | Same | `study › modifies and removes a study` | 🔒 |
| `study.remove()` | Same (idempotent) | same | ✅ |
| `onReady`, `onUpdate`, `onError`, `study_error` | `ready`, `loading`, `update`, `error` (`STUDY_ERROR`, message formatted with server context) | `study › formats study errors with their context` | ✅ (anonymous Pine refusal reported as `STUDY_ERROR`) |
| `PineIndicator` getters (`pineId`, `pineVersion`, description, inputs, plots, script, type) and `setType` | `id`, `version`, same others; `setType`, `clone` | `indicators › clones independently...` | ✅ (`sessions › loads Pine indicator definitions`) |
| `PineIndicator.setOption` (by `in_N`, number, inline name, internal ID; type and option checks) | `setInput`, `setInputs`, `findInput` | `indicators › finds inputs by ID...` | ✅ (definition-level) |
| `BuiltInIndicator(type)`, defaults for Volume and volume profiles, `setOption(key, value, FORCE)` | Same (+ initial options; time defaults computed per instance instead of at import) | `indicators › BuiltInIndicator › *` | ✅ (`Volume`, `VbPFixed@tv-basicstudies-241!`) |
| `getIndicator(id, version, session, signature)` (pine-facade translate, input/plot naming) | `getIndicator(id, { version, credentials })`, `parseIndicatorDefinition` | `indicators › parseIndicatorDefinition...`, `http › loads an indicator definition...`, `throws NOT_FOUND...` | ✅ public scripts; 🔒 private/invite-only |
| (new) One-shot / streaming indicator values | `getIndicatorData`, `watchIndicator` | `data › indicator data › *` | ✅ built-in and one-shot Pine RSI with account; Pine stream unit-tested |

## Quotes

| v3 capability | v4 | Unit evidence | Live |
| --- | --- | --- | --- |
| `new client.Session.Quote({ fields: 'all' | 'price', customFields })` | `client.createQuoteSession({ fields: 'all' | 'price' | [...] })`; `setFields()` | `quote › quote fields`, `creates a session with fields...` | ✅ |
| `new quoteSession.Market(symbol, session)` | `quoteSession.subscribe(symbol, { session })` | `quote › creates a session...` | ✅ |
| Merged quote data, `onData`, `onLoaded`, `onEvent` | `data` (quote, changes), `loaded`, `onAny`; `subscription.data` | `quote › creates a session...` | ✅ (`sessions › streams quotes through a quote session`) |
| Quote symbol errors → `onError` | `QUOTE_ERROR` | `quote › reports symbol errors...` | ✅ |
| Removal of symbols nobody listens to | Same | `quote › reports symbol errors and removes symbols nobody listens to` | ➖ |
| `market.close()` (shared per symbol) | `subscription.close()` with correct reference counting (v3 never decreased its count) | `quote › shares one server subscription...` | ➖ |
| `quoteSession.delete()` | Same (idempotent) | same | ✅ |
| (new) One-shot and streaming quotes | `getQuote`, `getQuotes`, `watchQuotes` | `data › quotes › *` | ✅ |

## HTTP: search, technical analysis, accounts, layouts, permissions

| v3 capability | v4 | Unit evidence | Live |
| --- | --- | --- | --- |
| `searchMarketV3(text, filter, offset)` (exchange prefix split) | `searchMarkets(text, { type, offset, exchange })` | `http › queries symbol search v3...` | ✅ (`BINANCE:`, `nasdaq apple` → `NASDAQ:AAPL`) |
| `searchMarket(text, filter)` (deprecated v1 endpoint) | Replaced by `searchMarkets` (same results, maintained endpoint) | same | ✅ |
| `result.getTA()` | `getTechnicalAnalysis(result.id)` | `http › requests every period and scales ratings` | ✅ |
| `getTA(symbol)` (8 periods × All/MA/Other, scaled) | `getTechnicalAnalysis(symbol)` (`null` instead of `false` without data) | `http › getTechnicalAnalysis › *` | ✅ |
| `searchIndicator(text)` (built-in lists cached + community suggestions, access mapping) | `searchIndicators(text)`, `clearIndicatorCache()` | `http › searches built-in and community indicators` | ✅ |
| `result.get()` on indicator results | `getIndicator(result.id, { version: result.version })` | `http › loads an indicator definition...` | ✅ |
| `getPrivateIndicators(session, signature)` | `getPrivateIndicators(credentials)` | `http › lists private indicators with credentials` | ✅ authenticated listing endpoint; actual private item not available |
| `loginUser(username, password, remember, UA)` | `loginUser({ username, password, remember, userAgent })` (form now URL-encoded) | `http › loginUser posts an encoded form and reads cookies` | 🔒 |
| `getUser(session, signature, location)` with redirect-loop protection | `getUser(credentials, { location, maxRedirects })` (relative redirects resolved) | `http › getUser parses the account page...`, `getUser stops redirect loops...` | ✅ authenticated success and wrong-cookie rejection |
| `getChartToken(layout, credentials)` | `getChartToken(layoutId, { userId, credentials })` | `http › gets a chart token...` | 🔒 (needs a layout ID) |
| `getDrawings(layout, symbol, credentials, chartID)` | `getDrawings(layoutId, { symbol, chartId, userId, credentials })` | `http › lists drawings with merged state` | 🔒 |
| `PinePermManager(session, signature, pineId)`: `getUsers`, `addUser`, `modifyExpiration`, `removeUser` | `PinePermissionManager(pineId, { credentials })`, same methods | `http › PinePermissionManager › *` | 🔒 (needs an owned invite-only script) |
| 5xx responses throw; HTTP errors | `HTTP_ERROR` (also wraps network failures) | `http › throws HTTP_ERROR...`, `wraps network failures` | ➖ |

## High-level data API (agent preview)

| Preview capability | v4 | Unit evidence | Live |
| --- | --- | --- | --- |
| `fetchCandles({ symbol, timeframe, limit })`, oldest first, `high`/`low` | `getCandles({ symbol, timeframe, count })` (+ deep history, ranges, chart options) | `data › getCandles › *` | ✅ |
| `watchCandles(query, { onData, onError })`, `worker.latest`, idempotent `stop()` | Same names + `closed`, `isActive`, `symbolInfo` | `data › watchCandles › *` | ✅ |
| `timeoutMs` (15 s default), `AbortSignal` | Same, for every data function | `data › times out...`, `aborts in flight and before starting`, `stops on abort after start-up` | ✅ |
| Cleanup of chart and connection on success, failure, timeout, abort and disconnect | Same, plus shared `client` support | `data › returns ... and closes everything`, `shares a client without closing it`, `rejects when a provided client is already closed` | ✅ |
| Validation before connecting | Same (`INVALID_ARGUMENT`) | `data › rejects invalid queries before connecting` | ➖ |
| `MarketDataProvider` / `TradingViewProvider` injection | Same provider-neutral candle contract; `getCandles(query, provider)` and `watchCandles(query, handlers, provider)`, plus shared `client` and custom `clientOptions.transport` for TradingView | `data › accepts an alternate candle provider...`; other data tests use an injected transport | ➖ |

## Examples

| v3 example | v4 example |
| --- | --- |
| `SimpleChart.js` | `simple-chart.js` (✅ live) |
| `CustomChartType.js` | `custom-chart-types.js` (✅ live) |
| `CustomTimeframe.js` | `custom-timeframe.js` (🔒) |
| `Errors.js` | `errors.js` (✅ live for anonymous cases) |
| `FakeReplayMode.js` | `fake-replay.js` (✅ live) |
| `FromToData.js` | `from-to.js` (🔒) |
| `GetDrawings.js` | `drawings.js` (🔒) |
| `GraphicIndicator.js` | `graphic-indicator.js` (🔒) |
| `MultipleSyncFetch.js` | `multiple-indicators.js` (🔒) |
| `PinePermManage.js` | `pine-permissions.js` (🔒) |
| `ReplayMode.js` | `replay.js` (✅ live without Pine studies) |
| `Search.js` | `search.js` (✅ live) |
| `UserLogin.js` | `user-login.js` (🔒) |
| `AllPrivateIndicators.js` | `private-indicators.js` (🔒) |
| `BuiltInIndicator.js` | `builtin-indicator.js` (✅ live) |
| (new) | `candles.js` (✅), `watch-candles.js`, `quotes.js`, `indicator-data.js`, `quote-session.js` |

## Intentional changes

These v3 behaviours were changed on purpose; none removes a capability.

- Bars and study rows are oldest first; candles use `high`/`low`; volume is no longer rounded to two decimals.
- `setMarket('')` throws instead of silently loading `BTCEUR`; the default timeframe is `D` instead of `240`.
- `setTimezone` no longer clears loaded bars (the server does not resend them).
- Replay methods reject instead of never resolving outside replay mode.
- Errors are `TradingViewError` objects instead of string lists; unhandled `error` events are still printed, except connection failures that already reject `client.ready`.
- `searchMarket` (deprecated v1 endpoint) is folded into `searchMarkets`.
- `result.getTA()` / `result.get()` methods on search results became plain data plus `getTechnicalAnalysis()` / `getIndicator()`.

## Not verified live for this release

The 21-test manual live workflow verified authenticated connection, account lookup, a public Pine RSI, a Supertrend strategy report, the private-indicators listing endpoint, and recent historical `to` with an account. It did **not** verify password login, actual private/invite-only scripts, compressed strategy reports against a live response, older history beyond server limits, second-based/custom timeframes, the `prodata` server, owned layouts/drawings, or Pine permission changes. Those paths have deterministic tests but need the corresponding account assets to verify live. Run `SESSION=... SIGNATURE=... npm run test:live` to repeat the authenticated subset.
