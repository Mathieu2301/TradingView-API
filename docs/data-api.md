# Data API guide

[README](../README.md) · [Low-level API](low-level-api.md) · [Migrating from v3](migration-v4.md) · [Examples](../examples)

**V4 beta is currently available from this repository only; the latest npm release is still v3.** Build this checkout before running the examples below.

The data API is the simplest way to use this library, in any application. Each function opens what it needs, waits for complete data, and releases every websocket session (and the connection it opened) before returning, including on errors, timeouts and cancellation.

```ts
import { getCandles, watchQuotes } from '@mathieuc/tradingview/data';
```

Everything here is also exported from the root entry (`@mathieuc/tradingview`).

| Function | Returns |
| --- | --- |
| `getCandles(query)` | Candles, oldest first |
| `watchCandles(query, handlers)` | A watcher streaming candle snapshots |
| `getQuote(query)` / `getQuotes(query)` | Current quote(s) |
| `watchQuotes(query, handlers)` | A watcher streaming quotes |
| `getSymbolInfo(query)` | Symbol metadata (exchange, currency, session...) |
| `getIndicatorData(query)` | Indicator values, drawings and strategy report |
| `watchIndicator(query, handlers)` | A watcher streaming indicator results |
| `searchMarkets(text, options?)` | Markets matching a text |
| `searchIndicators(text, options?)` | Built-in and community indicators |
| `getTechnicalAnalysis(symbol, options?)` | TradingView technical ratings |

## Candles

```ts
const candles = await getCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: '60', count: 500 });
const last = candles.at(-1); // { time, open, high, low, close, volume }
```

`time` is the bar open time in Unix **seconds**. `getCandles('BINANCE:BTCUSDT')` is a shorthand for 100 daily candles.

| Option | Default | Description |
| --- | --- | --- |
| `symbol` | required | Exchange-qualified symbol: `BINANCE:BTCUSDT`, `NASDAQ:AAPL`, `FX:EURUSD`... Use `searchMarkets` to find one. |
| `timeframe` | `'D'` | `1`, `5`, `15`, `60`, `240` (minutes), `D`, `W`, `M`, `1S` (seconds)... |
| `count` | `100` | Number of most recent bars. Larger counts are loaded in batches automatically (deep history). |
| `from` | | `Date` or Unix seconds. Loads every bar from this time (deep history); `count` is then ignored. |
| `to` | now | `Date` or Unix seconds: newest bar time. |
| `maxCount` | `20000` | Safety cap for `from` ranges. |
| `chartType` | | `HeikinAshi`, `Renko`, `LineBreak`, `Kagi`, `PointAndFigure` or `Range`. |
| `chartInputs` | | Inputs for `chartType`, e.g. `{ boxSize: 3, style: 'ATR', atrLength: 14 }`. |
| `currency` | | Convert prices, e.g. `EUR`. |
| `session` | | `regular` or `extended`. |
| `adjustment` | `'splits'` | `splits`, `dividends` or `none`. |
| `backAdjustment` | | Back-adjust continuous futures. |
| `timezone` | | Chart timezone (affects daily and longer bar alignment). |
| `credentials`, `client`, `clientOptions`, `timeoutMs`, `signal` | | See [Connections, timeouts and cancellation](#connections-timeouts-and-cancellation). |

History stops early, without error, when the server has no more bars (`series_completed` reports `data_completed: "end"` or `"limit"`). Anonymous access is limited: in our tests, about 7 000 one-minute bars, and reference times (`to`) in the past were capped. An empty result rejects with `NO_DATA`; when the server reported a limit, the message says so.

## Watching candles

```ts
const watcher = await watchCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: '1', count: 50 }, {
  onData(candles) {
    console.log(candles.at(-1)?.close);
  },
  onError(error) {
    console.error(error.code, error.message);
  },
});

// ...later
await watcher.stop(); // Idempotent
```

- The promise resolves once the initial history is loaded; `onData` has already received it.
- Each snapshot is a frozen array of the `count` most recent bars, oldest first.
- `watcher.latest` holds the last snapshot, `watcher.symbolInfo` the symbol metadata.
- `watcher.closed` resolves when the watcher stops: after `stop()`, an aborted `signal`, or a fatal error.
- Errors before start-up reject the promise. Afterwards they go to `onError`; fatal ones (disconnection, symbol or series errors) also stop the watcher. There is no automatic reconnection: start a new watcher when `closed` resolves if you need one.

`watchCandles` accepts the same chart options as `getCandles`, except `from`, `to` and `maxCount`.

## Quotes

```ts
const quote = await getQuote('BINANCE:BTCUSDT');
console.log(quote.lp, quote.chp); // Last price, change in percent

const quotes = await getQuotes({ symbols: ['NASDAQ:AAPL', 'FX:EURUSD'], fields: 'price' });
console.log(quotes['NASDAQ:AAPL'].lp);
```

| Option | Default | Description |
| --- | --- | --- |
| `symbol` / `symbols` | required | One symbol, or a non-empty list (duplicates are ignored). |
| `fields` | `'all'` | `all`, `price` (`lp` only), or a list such as `['lp', 'bid', 'ask', 'volume']`. |
| `session` | `'regular'` | `regular` or `extended`. |

A quote contains the fields TradingView sent: `lp`, `lp_time`, `ch`, `chp`, `bid`, `ask`, `volume`, `open_price`, `high_price`, `low_price`, `prev_close_price`, `description`, `currency_code`... An unknown symbol rejects with `QUOTE_ERROR`.

```ts
const watcher = await watchQuotes({ symbols: ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT'] }, {
  onData(symbol, quote, changes) {
    console.log(symbol, quote.lp, changes);
  },
  onError: console.error,
});
console.log(watcher.latest); // Latest quote per symbol
await watcher.stop();
```

`watchQuotes` resolves once every symbol has loaded or failed. Failing symbols are reported to `onError` and the others keep streaming; if all fail, the promise rejects.

## Symbol information

```ts
const info = await getSymbolInfo('NASDAQ:AAPL');
console.log(info.description, info.currency_code, info.timezone, info.session, info.pricescale);
```

Anonymous sessions may be served by a substitute feed: for `NASDAQ:AAPL`, `full_name` can be `BATS:AAPL` while `pro_name` stays `NASDAQ:AAPL`.

## Indicators and strategies

```ts
const rsi = await getIndicatorData({
  symbol: 'BINANCE:BTCEUR',
  timeframe: '60',
  indicator: 'STD;RSI',
  inputs: { Length: 21 },
  credentials, // Pine scripts need an account
});
console.log(rsi.values.at(-1)); // { $time, RSI: 54.2, ... }
```

`indicator` accepts:

- a script ID: `STD;RSI` (built-in Pine), `PUB;xxxx` (community), `USER;xxxx` (private); use `searchIndicators` to find IDs, and `version` to pin a version;
- a built-in study type: `Volume@tv-basicstudies-241`, `VbPFixed@tv-basicstudies-241!`... (works without an account);
- a `PineIndicator` or `BuiltInIndicator` instance (it is copied, never modified).

`inputs` sets Pine inputs (by input ID `in_0`, number, inline name or internal ID, with type and option validation) or built-in options.

The result contains:

| Field | Description |
| --- | --- |
| `indicator` | The indicator definition used. |
| `candles` | Chart bars, oldest first. |
| `values` | One row per bar: `$time` plus one key per plot (unnamed or duplicate plots are `plot_N`). The server may compute a few rows before the first returned candle. |
| `graphics` | Drawings: `labels`, `lines`, `boxes`, `tables` (with `cells`), `polygons`, `horizLines`, `horizHists`, and `raw`. X positions are bars back from the latest loaded bar. |
| `strategyReport` | For Pine strategies: `performance`, `trades` (most recent first), `history` (equity, drawdown, buy & hold), `currency`, `settings`. Empty for studies. |

Without an account, TradingView refuses Pine studies ("maximum number of studies per chart"): the call rejects with `STUDY_ERROR`. Built-in studies work.

`watchIndicator(query, { onData, onError })` streams the same result on every study update; `watcher.latest` holds the last one.

### Strategy totals and open positions

```ts
import { summarizeStrategyReport } from '@mathieuc/tradingview/data';

const summary = summarizeStrategyReport(result.strategyReport);
// tradeRecordCount, closedTradeCount, openTradeCount,
// closedNetProfit, openPnL, totalPnL, currency
```

Trade records can include open positions with a current exit valuation. An `exit`
object does **not** establish that a trade is closed. The summary uses reported
`performance.all.totalTrades` and `totalOpenTrades`, never the record count, for
closed/open counts. It does not assign a closed/open status to individual records.
Counts may differ from the available records in a partial report.

`totalPnL` is closed net profit plus open PnL, in the report currency. Missing or
non-finite values remain `undefined`; a missing open PnL is not assumed to be zero.
Raw percentage/fraction fields are not rescaled. History series, including buy &
hold, are retained independently even when no equity series is provided. Updates
replace supplied arrays and retain omitted series; an empty array clears a series.

Malformed trade lists (a non-array or non-object records) raise `PARSE_ERROR`
before any part of that report is applied. Studies emit this error for both plain
and compressed reports. Omitted trade lists retain previous records; `[]` clears them.
This is structural validation, not full validation of every trade field.

These offline checks validate report decoding and normalization, not fresh-client
access, Replay playback, export entitlement or Deep Backtesting availability.

In a Basic-account UI check on October 3, 2026, both strategy trade CSV export and
strategy report XLSX export opened an upgrade prompt recommending Essential.
No successful export was verified. These are TradingView UI entitlements, not
library export methods or a guarantee about other accounts. Deep Backtesting is
separate and was blocked by a Premium upgrade prompt in that session.

### Complete strategy report example

See [strategy-report.js](../examples/strategy-report.js) for a bounded, executable
public-strategy → trade-records → PnL-summary workflow. Run it from a repository
checkout after building:

```bash
node --env-file=.env examples/strategy-report.js
```

It uses the account cookies from `.env`, runs a public Supertrend strategy and
closes its connection automatically. It places no orders. Trade records are
most recent first and can include open positions with current exit valuations;
use the reported aggregate counts rather than inferring closure from an exit.
Missing summary fields remain `undefined`, not zero. `count` selects returned
candles, not a guaranteed exact strategy backtest window. Basic was sufficient
for the tested symbol/timeframe; UI exports and Deep Backtesting have separate
subscription requirements.


## Search and technical analysis

```ts
const markets = await searchMarkets('BINANCE:BTC', { type: 'crypto' });
// [{ id: 'BINANCE:BTCUSDT', exchange, fullExchange, symbol, description, type, currency, country }, ...]

const indicators = await searchIndicators('RSI');
// [{ id: 'STD;RSI', version, name, author, image, source, type, access }, ...]

const ratings = await getTechnicalAnalysis('BINANCE:BTCUSDT');
// { '1': { All, MA, Other }, '5': ..., '1D': ..., '1W': ..., '1M': ... } or null
```

`searchMarkets` options: `type` (`stock`, `crypto`, `forex`, `futures`, `index`, `cfd`, `economic`...), `exchange`, `offset` (pagination). Ratings range from -2 (strong sell) to 2 (strong buy).

## Connections, timeouts and cancellation

Websocket data functions accept:

| Option | Description |
| --- | --- |
| `timeoutMs` | Default 15 000. One-shot functions: whole call. Watchers: until start-up. Rejects with `TIMEOUT`. Raise it for deep history. |
| `signal` | An `AbortSignal`. Aborting rejects with `ABORTED` (or stops a running watcher). |
| `credentials` | `{ session, signature }`: your `sessionid` and `sessionid_sign` cookies, for data your account can access. |
| `clientOptions` | Options for the connection opened by the call (`server`, `transport`, `debug`, `fetch`...). |
| `client` | Reuse an open `TradingViewClient`. The call only removes its own sessions and leaves the connection open. Useful for many calls in a row. |

```ts
import { TradingViewClient, getCandles, getQuote } from '@mathieuc/tradingview';

const client = new TradingViewClient({ credentials });
try {
  const [candles, quote] = await Promise.all([
    getCandles({ symbol: 'BINANCE:BTCUSDT', client }),
    getQuote({ symbol: 'BINANCE:BTCUSDT', client }),
  ]);
} finally {
  await client.close();
}
```

Keep credentials in environment variables or a secret store; never put them in source files, issues or prompts.

## Alternate candle providers

The V4 data API remains usable with a source other than TradingView. Implement `MarketDataProvider.watchCandles(query, handlers)`; its worker exposes `latest` and an idempotent `stop()`. Pass the provider to `getCandles(query, provider)` for a one-shot snapshot or `watchCandles(query, handlers, provider)` for streaming. The provider controls its own network access and must resolve only after its first usable snapshot.

```ts
import { getCandles, type MarketDataProvider } from '@mathieuc/tradingview/data';

declare const myProvider: MarketDataProvider;
const candles = await getCandles({ symbol: 'CUSTOM:ASSET' }, myProvider);
```

`TradingViewProvider` implements the same contract and can carry default connection options. The regular `getCandles(query)` and `watchCandles(query, handlers)` calls use TradingView directly, so no provider setup is needed.

## Errors

Every failure is a `TradingViewError` with a `code`:

| Code | Meaning |
| --- | --- |
| `INVALID_ARGUMENT` | Invalid query (checked before connecting). |
| `SYMBOL_ERROR` | Unknown symbol. |
| `SERIES_ERROR` | Bars refused (for example a chart type or timeframe your account cannot use). |
| `CRITICAL_ERROR` | Command refused (invalid timeframe, timezone...). |
| `STUDY_ERROR` | Indicator failed or not allowed. |
| `QUOTE_ERROR` | Quote refused for a symbol. |
| `NO_DATA` | No bars in the requested range. |
| `AUTH_ERROR` | Credentials rejected. |
| `NOT_FOUND` | Unknown indicator, layout... |
| `TIMEOUT`, `ABORTED`, `DISCONNECTED`, `CONNECTION_ERROR`, `PROTOCOL_ERROR`, `HTTP_ERROR`, `PARSE_ERROR` | Transport and decoding failures. |
| `CALLBACK_ERROR` | A watcher callback threw; the stream remains active. |

`error.details` keeps the raw server payload when there is one.

