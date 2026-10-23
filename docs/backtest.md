# Backtest guide

`@mathieuc/tradingview/backtest` tests an entry rule on candles and checks whether it does better than random entries. You write the signal. The module downloads the candles once, freezes them, rejects look-ahead and applies the rest of the protocol: costs, pessimistic fills, an in-sample/out-of-sample split, four exits and a seeded random baseline. It returns a JSON report.

**It makes no claim of profitability and places no orders.** A negative or inconclusive result is a valid outcome of this protocol, and the most common one.

```ts
import { backtest, formatReport, tradesToCsv } from '@mathieuc/tradingview/backtest';

const { report, snapshot } = await backtest({
  symbol: 'BINANCE:BTCUSDT',
  timeframe: '240',
  years: 2,
  // Decided at the close of bar i, with bars 0..i only. Entry: open of bar i + 1.
  signal: (candles) => candles.flatMap((c, i) => (
    i > 0 && c.close > candles[i - 1].high ? [{ bar: i, direction: 'long' }] : []
  )),
});

console.log(formatReport(report));            // Data, split, signals, results table, warnings
writeFileSync('trades.csv', tradesToCsv(report.trades));
writeFileSync('snapshot.json', JSON.stringify(snapshot)); // Replay later, exactly
```

No account is needed for public symbols. With `credentials`, history goes as far as the account allows (see [Accounts and limits](../README.md#accounts-and-limits)). After the download, the reference strategy on about 4 500 4H bars (4 exits × 2 splits × 1 000 random runs) runs in about 0.2 s; a rule with a thousand signals takes about 10 s, mostly in the random baseline (lower `runs` while iterating).

## Writing the signal

A signal function receives the frozen candles (oldest first, `time` in Unix seconds) and returns every signal:

```ts
type Signal = { bar: number; direction: 'long' | 'short'; refs?: Record<string, number> };
```

- `bar` is the index of the bar **at whose close** the decision is taken. The engine always enters at the **next bar's open**; there is no way to fill on the signal bar.
- `refs` is optional: bars worth showing next to the trade (a pivot, a crossover...). They are exported with their times in the report and the CSV, and never change the fills.
- Optional properties on the function: `warmupBars` (bars needed before the first valid signal, default 200) and `label` (shown in the report).

Indicators that only use past bars are exported: `sma`, `ema`, `rsi` (Wilder), `atr` (Wilder) and `findPivots`.

```ts
import { ema, type Bar, type SignalFunction } from '@mathieuc/tradingview/backtest';

const emaCross: SignalFunction = Object.assign((candles: readonly Bar[]) => {
  const closes = candles.map((c) => c.close);
  const fast = ema(closes, 20);
  const slow = ema(closes, 50);
  const signals = [];
  for (let i = 50; i < candles.length; i++) {
    if (fast[i - 1] <= slow[i - 1] && fast[i] > slow[i]) signals.push({ bar: i, direction: 'long' as const });
    if (fast[i - 1] >= slow[i - 1] && fast[i] < slow[i]) signals.push({ bar: i, direction: 'short' as const });
  }
  return signals;
}, { warmupBars: 49, label: 'EMA(20) / EMA(50) cross' });
```

The reference strategy is built in: `rsiDivergence({ rsiLength, emaLength, pivotLookback, minPivotDistance, maxPivotDistance })` (regular RSI divergence with an EMA trend filter; defaults 14, 200, 5, 5, 60). A pivot with lookback N is confirmed N bars later, so the signal is on the confirmation bar and `refs` holds both pivots. [examples/honest-backtest](../examples/honest-backtest) runs it with every parameter as a CLI option.

### The look-ahead check

Before simulating anything, the engine reruns your signal function on truncated history: once ending at the bar of each signal (up to `causalityChecks`, default 100, drawn with the seed when there are more) and at 8 evenly spaced bars. Signals up to each cut must be identical with and without the later bars.

- A signal that exists only when later bars are present uses the future (`look_ahead`): a pivot dated at the pivot bar instead of its confirmation, `candles[i + 1]`, a centred moving average, a `max` over the whole series...
- A signal that exists on shorter history but disappears later repaints (`repaint`).

Either way the run stops with a `TradingViewError` whose `code` is `LOOK_AHEAD`; `error.details` lists each violation (`cut`, `bar`, `direction`, `kind`). Fix the rule rather than disabling the check. `causalityChecks: 0` disables it, and the report then says so.

The check covers the signal function. A custom exit (below) is not rerun; keep its `levels` to bars up to `signalBar` and its `trail` to the closed bar it receives.

## Options

`backtest(query)` downloads (or replays) and runs. `runBacktest(candlesOrSnapshot, options)` does the same synchronously on candles you already have, without network.

| Option | Default | Meaning |
| --- | --- | --- |
| `symbol`, `timeframe` | `'240'` | Market to download (time-based timeframes only). |
| `years` | `2` | Tradable years wanted after the warm-up; the request size follows. A warning is added when the server returns less. |
| `count` or `from`/`to` | | Explicit range instead of `years`. |
| `snapshot` | | Replay a saved snapshot (`loadSnapshot`) instead of downloading. |
| `credentials`, `client`, `clientOptions`, `abortSignal`, `provider` | | Passed to `getCandles`. `timeoutMs` defaults to 120 000 ms (deep history takes several batches). |
| `signal` | required | Your entry rule. |
| `exits` | `defaultExits()` | Exits compared on the same entries. |
| `fee` | `0.001` | Fee per side, fraction of the notional. |
| `slippage` | `0.0005` | Adverse slippage per side, fraction of the price. |
| `splitRatio` | `0.7` | In-sample share of the tradable bars. |
| `warmupBars` | signal's, else 200 | Bars used only to warm indicators up, never traded. The largest need of the signal and the exits wins. |
| `runs` | `1000` | Random-entry runs per exit and split. `0` disables the baseline. |
| `seed` | `42` | Base seed of the baseline and of the causality draw. |
| `causalityChecks` | `100` | Signals checked at their own bar. `0` disables the check. |

## Exits

Entries never depend on the exit, so every exit runs on the same entries. `defaultExits({ stopPct, atrStopMult, atrTargetR, trailAtrMult, atrLength })` returns the four reference exits:

| Id | Rule |
| --- | --- |
| `fixed_1.5R`, `fixed_2R` | Stop 2% from the entry bar open, target 1.5× or 2× that distance (`fixedExit({ stopPct, targetR })`). |
| `atr1.5_2R` | Stop 1.5 × ATR(14) of the signal bar, target 2R (`atrExit({ mult, targetR, length })`). |
| `trail_atr3` | Initial stop 3 × ATR(14), then close − 3 × ATR after each **closed** bar, applied from the next bar (`atrTrailingExit({ mult, length })`). |

`targetR: null` gives a stop-only exit. A custom exit is an object `{ id, label, warmupBars?, levels(ctx), trail?(stop, bar, ctx) }`. `levels` receives `{ direction, entryOpen, signalBar, candles }` and returns `{ stop, target | null }` or `null` to skip the entry; `trail` runs after bar `bar` has closed.

## Protocol

1. **Frozen data.** Candles are validated (ordered, consistent OHLC) and frozen once; the bar still forming is dropped. The report records symbol, timeframe, first and last bar, count, gaps and a SHA-256. A live rerun gets new bars: save the snapshot and replay it with `loadSnapshot` to reproduce a result exactly (the checksum is verified).
2. **Chronological split.** After the warm-up, bars are split 70% in-sample (IS) / 30% out-of-sample (OOS), with exact dates. A signal and its entry must be in the same segment, and a position still open on the last bar of a segment is closed at that bar's close (`segment_end`), so no position crosses the split.
3. **No look-ahead.** Signals at a bar's close, entry at the next open, and the causality check above.
4. **Costs.** Fee and adverse slippage on every entry and every exit, in the strategy and in the random baseline.
5. **Pessimistic fills.** When the stop and the target are both inside the same candle, the trade is a loss. A bar that opens beyond the stop fills at its open (worse than the stop); beyond the target, at its open too.
6. **Sizing.** 100% of equity per trade, no leverage, compounded, one position at a time: a signal while a position is open is skipped.
7. **Random-entry baseline.** For each exit and split, `runs` seeded runs enter at random bars of the same segment with the same exit, costs, sizing, one-position rule, the strategy's trade count and its long/short mix. Entries skipped because a position was open are redrawn among the free bars; the report says when a run could not reach the trade count. **Percentile** = 100 × share of random runs with a strictly lower net return. p5, p50 and p95 of the random returns are given (linear interpolation).
8. **Metrics** per exit and split: compounded net return, win rate (trades with a positive net return), profit factor (gross profit / gross loss, `null` without a losing trade), max drawdown (largest peak-to-trough fall of equity, marked to market at every bar close while in a position) and the number of closed trades.

## The report

`report` is plain JSON (`JSON.stringify` it, render it in a page, send it to a model):

| Field | Content |
| --- | --- |
| `snapshot` | Symbol, timeframe, `barSeconds`, `count`, `firstTime`, `lastTime`, `gaps`, `droppedFormingBar`, `sha256` (no candles). |
| `settings` | Signal label, costs, split ratio, warm-up, runs, seed, exits. |
| `segments` | `warmup`, `inSample`, `outOfSample`: `start`, `end` (exclusive), `bars`, `startTime`, `endTime`. |
| `signals` | Every signal: `bar`, `time`, `direction`, `entryBar`, `entryTime`, `split` (`IS`, `OOS` or `null` when in the warm-up, across the split or on the last bar), `refs` as times. |
| `rows` | One per exit and split: `metrics`, `longs`, `shorts`, `skippedInPosition`, `baseline` (`runs`, `matchedRuns`, `meanTrades`, `p5`, `p50`, `p95`) and `percentile`. |
| `trades` | Every trade with bar indices **and** times: signal, entry, exit, `refs`, entry open and fill, initial stop, target, exit level and fill, `reason` (`stop`, `trailing_stop`, `stop_gap`, `target`, `target_gap`, `stop_and_target_same_bar`, `segment_end`) and net `return`. |
| `causality` | `reruns`, `checkedSignals`, `totalSignals`. |
| `warnings` | Plain sentences: short history, few trades, unmatched random runs, gaps, disabled check. |

`snapshot` (returned next to `report` by `backtest`) holds the candles for charts. Bar indices in the report point into `snapshot.candles`. `formatReport(report)` prints the whole report as text, `formatTable(report.rows)` only the table, and `tradesToCsv(report.trades)` one CSV line per trade (each `refs` name becomes a `<name>_time` column).

Every step is also exported for custom protocols: `freezeSnapshot`, `fetchSnapshot`, `checkCausality`, `splitSegments`, `simulate`, `fillPrice`, `tradeReturn`, `computeMetrics`, `randomBaseline`, `percentileRank`, `quantile`, `createRng`, `deriveSeed`.

## Reading the result

- Look at the **out-of-sample** rows first. In-sample results were seen while choosing the parameters.
- A percentile around 50 means "no better than random entries with the same exits". Above 95 on OOS is weak evidence, not proof: with four exits and two splits, one of them will look good by chance from time to time.
- With a few dozen trades or fewer, returns and percentiles are mostly noise. The report warns below 30 trades in a row.
- Changing parameters until the OOS rows look good turns OOS into in-sample. Decide the parameters first, or keep a final untouched period.
- Not modelled: funding rates, spreads wider than the slippage, partial fills, latency, exchange outages, taxes.
