# 4.1.0-beta.2

Release channel: npm dist-tag **beta**. `latest` stays on 4.0.1. Freezes the report format of the backtest API for pages and charts.

## Backtest API

- The report holds identifiers and numbers only. Warnings are now codes with their numbers (`short_history`, `no_signals`, `few_trades`, `baseline_unmatched`, `causality_disabled`, `data_gaps`), turned into English by `formatWarning`. Rows no longer carry `exitLabel`. `settings.signal` is `{ id, params, label }` and each exit in `settings.exits` is `{ id, kind, params, label }`; the `label` fields are English descriptions for `formatReport` only.
- New fields: `createdAt`, `library` (`{ name, version }`), `snapshot.fetchedAt`, `buyHold` per segment (same fee and slippage), `refBars` (bar indices of `refs`) on signals and trades.
- `chartData(report, snapshot, signal)`: candles, indicator series (`rsi`, `ema` for `rsiDivergence`, or a custom `signal.indicators`), warm-up and split times, signals and trades grouped by exit.
- `backtestMany({ markets, exits, signal })`: the same signal on several markets, with exits per market if needed; trades carry `series`, and `tradesToCsv` then adds a `series` column.
- `rsiDivergence` gets `id`, `params`, `indicators` and the `trendFilter` option (false to count raw divergences).

Breaking for 4.1.0-beta.1 users: `report.warnings` (strings → objects), `settings.signal` (string → object), `rows[].exitLabel` removed. Results are unchanged: same rows and trades as beta.1 on the same snapshot.

## Validation

- Same rows and 63 trades as the #351 engine on the BINANCE:BTCUSDT 4H snapshot.
- 33 backtest tests (207 in total under Node, 206 under Bun); the 10 deliberate mutations still each fail a test.
- `npm run check` including the packed-package smoke under Node and Bun.
