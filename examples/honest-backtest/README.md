# Honest backtest (reference protocol)

A self-contained example that backtests a simple strategy **and checks whether it does better than chance**, using only `getCandles` from the v4 data API. Copy it as a starting point for your own strategy, by hand or with a coding agent.

**This is not trading advice and makes no claim of profitability.** A negative or inconclusive result is a valid outcome of this protocol, and the most common one. The point is to find out honestly, not to produce a nice equity curve.

```bash
npm ci && npm run build
node examples/honest-backtest/index.js                       # BINANCE:BTCUSDT, 4H, about 2 years
node examples/honest-backtest/index.js --symbol BINANCE:ETHUSDT --timeframe D
node examples/honest-backtest/index.js --snapshot honest-backtest-output/snapshot.json   # Offline replay
node examples/honest-backtest/index.js --help               # Every parameter
```

No account is needed. The run writes `snapshot.json` and `trades.csv` to `honest-backtest-output/` (change it with `--out`).

## Files

| File | Role |
| --- | --- |
| [engine.js](engine.js) | Pure functions: snapshot, indicators, signals, split, exits, simulation, metrics, random baseline. No network, no I/O. |
| [index.js](index.js) | Downloads candles once with `getCandles`, runs the protocol, prints the report, writes the CSV. |
| [engine.d.ts](engine.d.ts) | Types for the engine. |
| [tests/unit/honest-backtest.test.ts](../../tests/unit/honest-backtest.test.ts) | Deterministic tests on synthetic candles for every rule below. |

## Strategy

- **Long**: regular bullish RSI(14) divergence (a lower price pivot low with a higher RSI value than the previous pivot low, 5 to 60 bars apart) while the close is **above** the EMA(200).
- **Short**: regular bearish divergence (higher price pivot high, lower RSI) while the close is **below** the EMA(200).

Every parameter is a command-line option. Replace `findSignals` in `engine.js` to test your own entries; the rest of the protocol stays the same.

## Protocol

1. **Frozen snapshot.** Candles are downloaded once, validated (ordered, consistent OHLC), and frozen. The bar still forming is dropped. The report prints the symbol, timeframe, first and last bar time, bar count, gaps and a SHA-256 of the data. By default it requests enough bars for 2 years of tradable history after warm-up and warns when the server returns less. A live rerun gets new bars; replay `snapshot.json` to reproduce a result exactly.
2. **Chronological split.** The first bars only warm the indicators up and are never traded. The remaining bars are split 70% in-sample (IS) / 30% out-of-sample (OOS), with exact dates printed. A signal and its entry must be in the same segment, and a position still open on the last bar of a segment is closed at that bar's close (`segment_end`), so no position crosses the split.
3. **No look-ahead.** A pivot with lookback N (default 5) needs N later bars, so it is only confirmed N bars after it formed. The signal fires at the close of the confirmation bar and the entry is the **next bar's open**. Nothing is backdated. Indicators at bar i only use bars up to i.
4. **Costs.** A fee (default 0.1%) and an adverse slippage (default 0.05%) on every entry and every exit, in the strategy and in the random baseline.
5. **Pessimistic fills.** When the stop and the target are both inside the same candle, the trade is a loss. A bar that opens beyond the stop fills at its open (worse than the stop).
6. **Interchangeable exits.** Entries never depend on the exit. Four exits run on the same entries:
   - `fixed_1.5R` and `fixed_2R`: stop 2% from the entry bar open (`--stopPct`), target 1.5x or 2x that distance;
   - `atr1.5_2R`: stop 1.5x ATR(14) of the signal bar, target 2R;
   - `trail_atr3`: initial stop 3x ATR(14), then trailed at close minus 3x ATR on every **closed** bar (`--trailAtrMult`); the new stop applies from the next bar.
7. **Random-entry baseline.** For each exit and each split, 1,000 seeded runs (`--runs`, `--seed`) enter at random bars of the same segment, with the same exit, costs, sizing (100% of equity, no leverage, compounded) and one-position-at-a-time rule, the strategy's number of trades and its long/short mix. Entries skipped because a position was open are redrawn among the free bars; the report says when a run could not reach the strategy's trade count. **Percentile** = 100 x share of random runs with a strictly lower net return. p5, p50 and p95 of the random returns are printed (linear interpolation).
8. **Metrics** per exit and split: net return (compounded), win rate (trades with a positive net return), profit factor (gross profit / gross loss, `N/A` without a losing trade), max drawdown (largest peak-to-trough fall of equity, marked to market at every bar close while in a position) and the number of closed trades.
9. **Trades CSV** with, per trade: exit variant, split, direction, previous pivot, pivot, confirmation and entry bar times, entry open and fill, initial stop, target, exit time, level and fill, exit reason and net return. Times are bar open times in UTC.

## Reading the result

- Look at the **out-of-sample** rows first. In-sample results were seen while choosing the parameters.
- A percentile around 50 means "no better than random entries with the same exits". Above 95 on OOS is weak evidence, not proof: with four exits and two splits, one of them will look good by chance from time to time.
- With a few dozen trades or fewer, returns and percentiles are mostly noise. The run prints a warning.
- Changing parameters until the OOS rows look good turns OOS into in-sample. Decide the parameters first, or keep a final untouched period.
- Not modelled: funding rates, spreads wider than the slippage, partial fills, latency, exchange outages, taxes.
