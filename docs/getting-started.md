# Getting started

## Install

```bash
npm install @mathieuc/tradingview
# Or: bun add @mathieuc/tradingview
```

Version 4 is installed by default: TypeScript, ESM, Node.js 20+ or Bun. CommonJS projects can `require()` it on Node 20.19+ or 22.12+, or use `await import()`. Version 3 remains available with `@mathieuc/tradingview@3`.

> **Version 4 is a breaking rewrite**, with a new API and no compatibility layer. Coming from v3? Read the [migration guide](migration-v4.md). Every v3 feature is still available: see the [coverage matrix](v4-coverage.md) and the [reliability evidence](v4-reliability.md).

```js
import { getCandles } from '@mathieuc/tradingview/data';

const candles = await getCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: 'D', count: 40 });
console.log(candles.at(-1)); // { time, open, high, low, close, volume }
```

Then read the [data API guide](data-api.md), the [backtest guide](backtest.md), the [low-level API reference](low-level-api.md) or the [examples](../examples).

## Interactive quick-start

```bash
npx @mathieuc/tradingview
```

Run it from your project directory with Node.js 20+. Choose a path:

1. **Autonomous agent (recommended)** — opens the [TradingView-API page on molted.studio](https://molted.studio/dreams/ai-agent-for-tradingview-data?utm_source=github&utm_medium=docs&utm_campaign=tradingview-api). No local project setup.
2. **Claude Code CLI** — starts your installed `claude` CLI here with a ready-to-use project prompt.
3. **Codex CLI** — starts your installed `codex` CLI here with the same prompt.
4. **Another local coding agent** — prints the prompt to paste into your agent.
5. **Install the library only** — runs `npm install @mathieuc/tradingview` here, without generating files or starting an agent.

Claude Code and Codex must already be installed and authenticated. Their normal permission prompts remain enabled. If launch fails, the prompt is printed for manual use. If no browser is available, the hosted link remains visible.

Use `--choice 4` to print the prompt directly, or `--help` for usage. Non-interactive callers must pass `--choice`. To try the launcher from a checkout:

```bash
npm ci && npm run build
node bin/tradingview.mjs
```

## Accounts and limits

Without an account, TradingView serves limited data: shorter intraday history, no Pine studies, and possibly delayed or substitute feeds. With your `sessionid` and `sessionid_sign` cookies (`credentials`), you get what your account can access. Keep them in environment variables or a secret store; never put them in source files, issues or prompts.

## Contributing

[Open an issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose) to discuss a feature or report a bug, or send a pull request. Questions and early ideas are welcome; you do not need a perfect reproduction to start a conversation. `npm run check` runs the type check, lint, tests, build and package smoke test.
