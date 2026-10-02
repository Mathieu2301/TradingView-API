# TradingView-API

**Build with market data, from your first chart to a running watcher.** Fetch candles, explore indicators, and turn ideas into working tools. An independent community project, not an official TradingView API.

[Get started](#get-started) · [Explore examples](examples) · [Read the API guide](docs/agent-api.md)

**Language:** English · [Français](docs/README.fr.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md)

[![Tests](https://github.com/Mathieu2301/TradingView-API/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/Mathieu2301/TradingView-API/actions/workflows/tests.yml) [![npm](https://badgen.net/npm/v/@mathieuc/tradingview)](https://www.npmjs.com/package/@mathieuc/tradingview) [![Stars](https://img.shields.io/github/stars/Mathieu2301/TradingView-API?style=social)](https://github.com/Mathieu2301/TradingView-API)

![Recorded demonstration: fetchCandles returns 40 daily BTC/USDT candles, visualized as a line chart](assets/readme-demo.gif)

*An actual `fetchCandles()` result, recorded on 2 October 2026 and visualized for this demo. Prices are not live. The high-level API shown here is a [development preview](docs/agent-api.md), available from source; the [stable npm package](https://www.npmjs.com/package/@mathieuc/tradingview) still uses the `Client` API.*

### One request, real data

After [building the preview from source](#3-install-manually), try the same request:

```js
const { fetchCandles } = require('./agent.js');

fetchCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: 'D', limit: 40 })
  .then((candles) => console.log(candles.at(-1))) // time, open, high, low, close, volume
  .catch(console.error);
```

Prefer to start without code? The setup paths below work for both the stable library and the preview.

## Get started

Choose the setup that works for you. The current npm release provides the stable `Client` API; the simpler [high-level API](docs/agent-api.md) is a **development preview available from source**, not yet in the npm package.

### 1. Molted.cloud — recommended, no local setup

[Create an agent on Molted.cloud](https://molted.cloud/) and share this repository with it. Describe what you want to build; the agent can read the docs, set up a workspace, and help you get from an idea to a working project. For example, ask it to build a market-data watcher using the API that is currently available. [See an example on Molted Studio](https://molted.studio/dreams/market-watch-alerts).

### 2. Claude Code, Codex, or another coding assistant

Open your project in your preferred coding assistant and give it the [repository link](https://github.com/Mathieu2301/TradingView-API). You can start with:

> Read the TradingView-API README and the high-level API guide. Install the stable npm package for my project, or use the development preview from source if the high-level API is needed. Build a small example and show me how to run it.

The assistant can handle the setup, but you keep the project in your own environment.

### 3. Install manually

For the **stable release**, add the package to your project:

```bash
bun add @mathieuc/tradingview
# Or: npm install @mathieuc/tradingview
```

For the **high-level API preview**, clone the repository and build it from source (Bun or Node 18+):

```bash
git clone https://github.com/Mathieu2301/TradingView-API.git
cd TradingView-API
bun install
bun run build:agent
# With npm instead: npm ci && npm run build:agent
```

Import `./agent.js` from that checkout; the stable npm package does not include this subpath yet. Continue with the [stable library example](#stable-library) or the [high-level API guide](docs/agent-api.md).

### Want to contribute?

[Open an issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose) to discuss a feature or report a bug, or send a pull request. Questions and early ideas are welcome; you do not need a perfect reproduction to start a conversation.

## Stable library

```js
const TradingView = require('@mathieuc/tradingview');
const client = new TradingView.Client();
const chart = new client.Session.Chart();

chart.onError((...error) => console.error('Chart error:', ...error));
chart.onUpdate(() => {
  const latest = chart.periods[0];
  if (latest) console.log(latest.close);
});
chart.setMarket('BINANCE:BTCUSDT', { timeframe: 'D' });

// When your application is finished:
// chart.delete();
// await client.end();
```

The existing `Client`, chart and quote sessions, Pine indicators, replay features and [examples](examples) remain available during the migration.

## High-level API — development preview

This first TypeScript slice offers simple data access without managing chart sessions, widgets or deep-history internals. It is useful in any application, whether you write it yourself or with an agent:

```ts
import { fetchCandles, watchCandles } from './agent.js';

// One-shot: data arrives through a single await; the connection closes automatically.
const candles = await fetchCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: 'D', limit: 100 });
console.log(candles.at(-1)?.close);

// Worker: keeps receiving fresh snapshots until stopped.
const worker = await watchCandles(
  { symbol: 'BINANCE:BTCUSDT', timeframe: '1' },
  { onData: (snapshot) => console.log(snapshot[snapshot.length - 1]?.close),
    onError: console.error },
);
// ...later:
await worker.stop();
```

Snapshots are oldest-first, with conventional `high`/`low` fields. The first usable snapshot has a timeout (15 seconds by default), and `AbortSignal` is supported. Keep credentials in your own environment; do not put them in prompts or issues.

For installation from source, follow [manual setup](#3-install-manually). See the [high-level API guide](docs/agent-api.md) for error handling, lifecycle and provider adapters.

## What is next?

This repository is being modernized incrementally in TypeScript/Bun while keeping current users working. The first slice is data access; strategy research, backtesting, CLI/MCP and hosted workflows are **planned, not shipped**. Tell us which workflow would save you time in an [issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose).

## Project links

- [GitHub repository](https://github.com/Mathieu2301/TradingView-API)
- [Trendshift community highlight](https://trendshift.io/repositories/26416)
- [npm package](https://www.npmjs.com/package/@mathieuc/tradingview)
- [Examples](examples)
- [Report a bug or ask for a feature](https://github.com/Mathieu2301/TradingView-API/issues/new/choose)

TradingView is a trademark of its respective owner. This project is not affiliated with or endorsed by TradingView. Check your data provider's terms and applicable market-data permissions for your use case.
