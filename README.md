# TradingView-API

**Build with market data, from your first chart to a running watcher.** Fetch candles and quotes, run indicators and strategies, and turn ideas into working tools. An independent community project, not an official TradingView API.

[Get started](#get-started) · [Explore examples](examples) · [Read the data API guide](docs/data-api.md)

**Language:** English · [Français](docs/README.fr.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md)

[![Tests](https://github.com/Mathieu2301/TradingView-API/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/Mathieu2301/TradingView-API/actions/workflows/tests.yml) [![npm](https://badgen.net/npm/v/@mathieuc/tradingview)](https://www.npmjs.com/package/@mathieuc/tradingview) [![Stars](https://img.shields.io/github/stars/Mathieu2301/TradingView-API?style=social)](https://github.com/Mathieu2301/TradingView-API)

<a href="https://trendshift.io/repositories/26416?utm_source=repository-badge&amp;utm_medium=badge&amp;utm_campaign=badge-repository-26416" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/26416" alt="Mathieu2301/TradingView-API | #1 Repo Of The Day on Trendshift" width="250" height="55"/></a>

![Recorded demonstration: a candle request returns 40 daily BTC/USDT candles, visualized as a line chart](assets/readme-demo.gif)

*An actual candle request, recorded on 2 October 2026 with the development preview (`fetchCandles`, called `getCandles` in version 4) and visualized for this demo. Prices are not live.*

### One request, real data

> **V4 release candidate is available on npm under `next`.** Install with `npm install @mathieuc/tradingview@next`. The default `latest` tag is still v3 and does not export `getCandles`.

```js
import { getCandles } from '@mathieuc/tradingview/data';

const candles = await getCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: 'D', count: 40 });
console.log(candles.at(-1)); // { time, open, high, low, close, volume }
```

Prefer to start without code? The setup paths below work too.

> **Version 4 is a breaking rewrite** in TypeScript, with a new API and no compatibility layer. Coming from v3? Read the [migration guide](docs/migration-v4.md). Every v3 feature is still available: see the [coverage matrix](docs/v4-coverage.md) and [reliability evidence](docs/v4-reliability.md). The [RC preparation report](docs/v4-stabilization.md) tracks current checks and remaining release gates. npm versions 3.x keep the previous `Client` API; check the [npm page](https://www.npmjs.com/package/@mathieuc/tradingview) for the version you install.

## Get started

### Interactive quick-start

<!-- The launcher is introduced after 4.0.0-rc.0; keep this explicit until published. -->
The next package release adds this interactive launcher (not included in RC.0):

```bash
npx @mathieuc/tradingview@next
```

Run it from your project directory with Node.js 20+. Choose a path:

1. **Autonomous agent (recommended)** — opens the [TradingView-API market watcher on Molted Studio](https://molted.studio/dreams/market-watch-alerts). No local project setup.
2. **Claude Code CLI** — starts your installed `claude` CLI here with a ready-to-use project prompt.
3. **Codex CLI** — starts your installed `codex` CLI here with the same prompt.
4. **Another local coding agent** — prints the prompt to paste into your agent.
5. **Install the library only** — runs `npm install @mathieuc/tradingview@next` here, without generating files or starting an agent.

Claude Code and Codex must already be installed and authenticated. Their normal permission prompts remain enabled. If launch fails, the prompt is printed for manual use. If no browser is available, the hosted link remains visible.

Use `--choice 4` to print the prompt directly, or `--help` for usage. Non-interactive callers must pass `--choice`. To try the launcher from this checkout before publication:

```bash
npm ci && npm run build
node bin/tradingview.mjs
```

### Install manually

```bash
npm install @mathieuc/tradingview@next
# Or: bun add @mathieuc/tradingview@next
```

`next` installs the V4 release candidate; the default `latest` tag still installs V3. Do not mix the V4 imports with a V3 installation.

The V4 package is ESM with TypeScript declarations. CommonJS projects can `require()` it on Node 20.19+ or 22.12+, or use `await import()`.

### Want to contribute?

[Open an issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose) to discuss a feature or report a bug, or send a pull request. Questions and early ideas are welcome; you do not need a perfect reproduction to start a conversation. `npm run check` runs the type check, lint, tests, build and package smoke test.

## Data API

The data API handles connections, sessions, timeouts and cleanup for you. It suits any application: scripts, servers, dashboards, bots or agents.

```ts
import {
  getCandles, watchCandles, getQuote, getIndicatorData, searchMarkets,
} from '@mathieuc/tradingview/data';

// One-shot: resolves with complete data, then releases everything.
const hourly = await getCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: '60', count: 500 });
const lastWeek = await getCandles({ symbol: 'NASDAQ:AAPL', timeframe: '15', from: new Date(Date.now() - 7 * 86_400_000) });
const quote = await getQuote('BINANCE:BTCUSDT');
const [market] = await searchMarkets('ethereum', { type: 'crypto' });

// Watcher: keeps streaming until stopped.
const watcher = await watchCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: '1' }, {
  onData: (candles) => console.log(candles.at(-1)?.close),
  onError: (error) => console.error(error.code, error.message),
});
await watcher.stop();

// Indicators and strategies (Pine scripts need an account).
const { values } = await getIndicatorData({
  symbol: 'BINANCE:BTCUSDT', indicator: 'STD;RSI', credentials: { session, signature },
});
```

| Need | Function |
| --- | --- |
| Candles: latest bars, deep history, date ranges, Heikin Ashi/Renko/... | `getCandles`, `watchCandles` |
| Quotes: last price, change, bid/ask, volume... | `getQuote`, `getQuotes`, `watchQuotes` |
| Indicator values, drawings and strategy reports | `getIndicatorData`, `watchIndicator` |
| Symbol metadata | `getSymbolInfo` |
| Stock/crypto screening and ranked lists | `getScreener`, `getHotlist` |
| Account watchlists (read-only) | `getWatchlists` |
| Search and ratings | `searchMarkets`, `searchIndicators`, `getTechnicalAnalysis` |

Websocket data functions accept `timeoutMs`, an `AbortSignal`, account `credentials`, and an optional shared `client`. HTTP lookups accept an `AbortSignal` through their options. Errors are `TradingViewError`s with a `code` such as `SYMBOL_ERROR`, `TIMEOUT` or `STUDY_ERROR`. Read the [data API guide](docs/data-api.md) for every option.

## Low-level API

For full control (several charts and studies on one connection, replay mode, raw packets), use the client and sessions directly:

```ts
import { TradingViewClient, getIndicator } from '@mathieuc/tradingview';

const client = new TradingViewClient({ credentials: { session, signature } }); // Credentials are optional
const chart = client.createChart();

chart.on('update', () => console.log(chart.lastCandle?.close));
chart.on('error', (error) => console.error(error.message));
chart.setMarket('BINANCE:BTCUSDT', { timeframe: '60', count: 300 });

const supertrend = chart.createStudy(await getIndicator('STD;Supertrend'));
supertrend.on('update', () => console.log(supertrend.values.at(-1)));

// When your application is finished:
await client.close();
```

The [low-level API reference](docs/low-level-api.md) covers charts, replay, studies, quotes, account and layout functions, Pine permissions, custom transports and protocol helpers. The [examples](examples) show each feature.

## Accounts and limits

Without an account, TradingView serves limited data: shorter intraday history, no Pine studies, and possibly delayed or substitute feeds. With your `sessionid` and `sessionid_sign` cookies (`credentials`), you get what your account can access. Keep them in environment variables or a secret store; never put them in source files, issues or prompts.

## Project links

- [GitHub repository](https://github.com/Mathieu2301/TradingView-API)
- [Trendshift community highlight](https://trendshift.io/repositories/26416)
- [npm package](https://www.npmjs.com/package/@mathieuc/tradingview)
- [Examples](examples)
- [Report a bug or ask for a feature](https://github.com/Mathieu2301/TradingView-API/issues/new/choose)

TradingView is a trademark of its respective owner. This project is not affiliated with or endorsed by TradingView. Check your data provider's terms and applicable market-data permissions for your use case.
