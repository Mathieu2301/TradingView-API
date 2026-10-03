# Screener

`getScreener` is available from both the root package and `@mathieuc/tradingview/data`.
It performs one HTTP scan, without creating WebSocket sessions.

```js
import { getScreener } from '@mathieuc/tradingview/data';

const page = await getScreener({
  market: 'america',
  columns: ['name', 'close', 'volume', 'Stoch.RSI.D'],
  filter: [{ left: 'type', operation: 'equal', right: 'stock' }],
  sort: { sortBy: 'volume', sortOrder: 'desc' },
  range: [0, 20],
});
console.log(page.totalCount, page.rows);
```

Each row has an exchange-qualified `symbol` and a `values` object keyed by the
requested columns. Values retain their upstream types, including null. Columns
must be nonempty and unique. Unknown fields and invalid server filters throw
`TradingViewError` with code `HTTP_ERROR`; they do not silently become empty results.

The default market is `global`. Other upstream universes include `america`,
`crypto` and `forex`. Exact column names, filter operations and available markets
are controlled by TradingView, not a stable schema owned by this package.
Use `symbols: ['NASDAQ:AAPL']` to restrict the scan to explicit tickers.

`range` is zero-based and end-exclusive, defaulting to `[0, 50]`. Request subsequent
pages explicitly. Rankings can change between requests; pages are not a transactionally
consistent snapshot. There is no automatic unbounded pagination, polling or retry.

The second argument accepts `credentials`, `fetch`, `headers` and `signal`.
Account cookies may be supplied but do not grant paid exchange rights. This is
**not a real-time screener subscription**: delays and entitlements remain upstream.
Use `watchQuotes` separately when you need quote updates for selected symbols.

## Live evidence

On 3 October 2026 an anonymous America scan with stock filters, volume sorting and
`name`, `close`, `volume`, `Stoch.RSI.D` returned a total count and two typed rows.
This establishes the request/response contract, not paid real-time availability.
