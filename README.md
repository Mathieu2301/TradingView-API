# TradingView-API

**Try it with a hosted agent:** [Build a market watcher on Molted Studio](https://molted.studio/dreams/market-watch-alerts) — no local setup.

<a href="https://trendshift.io/repositories/26416?utm_source=repository-badge&amp;utm_medium=badge&amp;utm_campaign=badge-repository-26416" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/26416" alt="Mathieu2301/TradingView-API | #1 Repo Of The Day on Trendshift" width="250" height="55"/></a>

**Language:** English · [Français](docs/README.fr.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md)

[![Tests](https://github.com/Mathieu2301/TradingView-API/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/Mathieu2301/TradingView-API/actions/workflows/tests.yml) [![npm](https://badgen.net/npm/v/@mathieuc/tradingview)](https://www.npmjs.com/package/@mathieuc/tradingview) [![Stars](https://img.shields.io/github/stars/Mathieu2301/TradingView-API?style=social)](https://github.com/Mathieu2301/TradingView-API)

**Market data and indicators for builders.** Start with one chart, then grow into real-time workers, research tools, and agent-assisted workflows. This is an independent community project, not an official TradingView API.

> **Need help, found a bug, or want a feature? [Open an issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose).** Questions and early ideas are welcome. You do not need a perfect reproduction before asking.

## Choose your path

| If you want to… | Start here |
| --- | --- |
| Use the stable npm library today | [Install](#stable-library) and browse [examples](examples) |
| Let an AI agent build with you | [Agent guide](docs/agent-api.md) — works with Claude Code, Codex, OpenClaw and similar tools |
| Avoid local setup | [Molted](https://molted.cloud/) hosts an agent workspace; ask it to work from this repository |
| Contribute or request something | [Open an issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose) |

Molted is optional. The library remains open source and usable locally. The new agent API below is **a development preview**, not yet included in the current npm release.

## Stable library

```bash
npm install @mathieuc/tradingview
```

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

## Agent-friendly API — development preview

The first TypeScript slice adds two simple patterns on top of the existing transport:

```ts
import { fetchCandles, watchCandles } from '@mathieuc/tradingview/agent';

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

**Preview setup from source** (Node 18+ or Bun):

```bash
git clone https://github.com/Mathieu2301/TradingView-API.git
cd TradingView-API
npm ci
npm run build:agent
```

From that checkout, import `./agent.js` . The stable npm package does **not** have this subpath yet; it will be released after review and validation. See the [full agent API guide](docs/agent-api.md) for error handling, lifecycle and provider adapters.

## What is next?

This repository is being modernized incrementally in TypeScript/Bun while keeping current users working. The first slice is data access; strategy research, backtesting, CLI/MCP and hosted workflows are **planned, not shipped**. Tell us which workflow would save you time in an [issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose).

## Project links

- [GitHub repository](https://github.com/Mathieu2301/TradingView-API)
- [npm package](https://www.npmjs.com/package/@mathieuc/tradingview)
- [Examples](examples)
- [Report a bug or ask for a feature](https://github.com/Mathieu2301/TradingView-API/issues/new/choose)

TradingView is a trademark of its respective owner. This project is not affiliated with or endorsed by TradingView. Check your data provider's terms and applicable market-data permissions for your use case.
