# 4.1.0

Release channel: `latest`. Minor release: one new entry point, no breaking change for 4.0.x users.

## Backtest API

New entry point `@mathieuc/tradingview/backtest`, built from the [honest-backtest](../examples/honest-backtest) example (#351, #352). You write the entry rule, `(candles) => [{ bar, direction }]`; the module applies the protocol and returns a JSON report. See the [backtest guide](backtest.md).

- `backtest()` downloads candles once with `getCandles` and freezes them; `runBacktest()` runs synchronously on candles or a saved snapshot; `backtestMany()` runs several markets, with exits per market if needed.
- Look-ahead check: the signal is rerun on truncated history, and the run stops with the new `TradingViewError` code `LOOK_AHEAD` when a signal depends on later bars or repaints.
- Protocol: entry at the next bar's open, fee and adverse slippage on both sides (random baseline included), stop and target in the same candle counted as a loss, gaps filled at the open, warm-up never traded, chronological 70/30 in-sample/out-of-sample split with no position across it, four interchangeable exits, 1 000 seeded random-entry runs per exit and split.
- The report holds identifiers and numbers only (exit ids, exit reasons, `IS`/`OOS`, warning codes), with metrics per segment, buy and hold, trades with bar indices and times. `chartData()` prepares a price chart, and `formatReport()` and `tradesToCsv()` render the report as text and CSV.
- `examples/honest-backtest` uses the module; `examples/backtest-custom-signal.js` shows a custom rule.

The module makes no claim of profitability: a negative or inconclusive result is a valid outcome.

Pre-releases 4.1.0-beta.1 and 4.1.0-beta.2 were published under the `beta` tag. 4.1.0 has the same code as 4.1.0-beta.2; only the version, these notes and the `llms.txt` line about the beta tag change.
