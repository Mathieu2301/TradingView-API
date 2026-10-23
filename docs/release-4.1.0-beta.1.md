# 4.1.0-beta.1

Release channel: npm dist-tag **beta**. `latest` stays on 4.0.1. Minor release: one new entry point, no breaking change.

## Backtest API

New entry point `@mathieuc/tradingview/backtest`, built from the [honest-backtest](../examples/honest-backtest) example (#351). You write the entry rule; the module applies the protocol and returns a JSON report. See the [backtest guide](backtest.md).

- `backtest({ symbol, timeframe, years, signal, ... })` downloads candles once with `getCandles`, freezes them and runs; `runBacktest(candles | snapshot, options)` does the same synchronously, without network.
- A signal is `(candles) => [{ bar, direction, refs? }]`, decided at the close of `bar`. The entry is always the next bar's open.
- New look-ahead check: the engine reruns the signal on history truncated at each signal and at 8 evenly spaced bars, and throws a `TradingViewError` with the new code `LOOK_AHEAD` if a signal depends on later bars or repaints.
- Same rules as the example: fees and adverse slippage on both sides (in the baseline too), stop and target in the same candle = loss, gap through the stop = open, warm-up never traded, 70/30 chronological split with no position across it, four interchangeable exits, 1 000 seeded random-entry runs per exit and split with percentile and p5/p50/p95, metrics per segment (net return, win rate, profit factor or `null`, max drawdown, trades).
- Building blocks are exported too: `rsiDivergence`, `defaultExits`, `fixedExit`, `atrExit`, `atrTrailingExit`, `sma`, `ema`, `rsi`, `atr`, `findPivots`, `freezeSnapshot`, `loadSnapshot`, `checkCausality`, `simulate`, `randomBaseline`, `computeMetrics`, `formatReport`, `tradesToCsv`...
- `examples/honest-backtest` now uses the module (same options and output; its `engine.js` is removed, and snapshots saved by the previous version still replay). New `examples/backtest-custom-signal.js`.

The module makes no claim of profitability: a negative or inconclusive result is a valid outcome.

## Validation

- Same report as the #351 engine on the same BINANCE:BTCUSDT 4H snapshot (4 583 bars): identical rows and 63 identical trades, under Node and Bun.
- 26 deterministic tests on synthetic candles. Each of these deliberate mutations makes at least one fail: backdated signal, entry at the signal close, entry on the signal bar, trailing stop look-ahead, missing exit fee, same-candle stop and target counted as a win, gap filled at the stop, position across the split, look-ahead check bypassed, baseline without costs.
- `npm run check` (typecheck, lint, tests, build, packed-package smoke under Node and Bun, including `require()` and TypeScript consumers of the new entry point) and `npm run test:bun`.
