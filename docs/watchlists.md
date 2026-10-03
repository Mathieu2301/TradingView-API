# Watchlists and ranked lists

## Read your watchlists

```js
import { getWatchlists } from '@mathieuc/tradingview/data';

const lists = await getWatchlists({
  credentials: {
    session: process.env.TV_SESSION,
    signature: process.env.TV_SIGNATURE,
  },
});
for (const list of lists) console.log(list.id, list.name, list.symbols);
```

This is a read-only account API. Each list preserves its numeric ID, name, ordered
`symbols` and additional upstream metadata. Entries can include section markers;
do not blindly pass every entry to `getQuotes`. Filter for exchange-qualified
symbols appropriate to your application. No lists are created, edited or deleted.

Credentials are required. Access rejection (401/403 or login redirects) produces
`AUTH_ERROR`; malformed responses and other failed statuses produce `HTTP_ERROR`.
Authenticated redirects are not followed. The options also accept `fetch`,
`headers` and `signal`. Treat returned names/symbols as private account data.

## Scanner-ranked lists

```js
import { getHotlist } from '@mathieuc/tradingview/data';

const page = await getHotlist({ kind: 'gainers', range: [0, 10] });
console.log(page.rows);
```

| Kind | Ranking |
| --- | --- |
| `gainers` | Percentage change descending |
| `losers` | Percentage change ascending |
| `mostActive` | Volume descending |
| `volumeGainers` | Relative volume (`relative_volume_10d_calc`) descending |

These are convenient [screener](screener.md) queries, **not an exact replica of the
TradingView hotlist widget**. UI universe, session and liquidity filters may differ.
Default universe: America stocks; default fields: name, close, change, volume and
relative volume. Override `market`, `columns`, `filter`, `range` or `symbols` as
needed. For a non-stock universe, supply appropriate filters (or `filter: []`),
since changing the market does not remove the default stock filter. Exchange data
may be delayed. No automatic polling or paid entitlement is implied.

## Evidence and limits

On 3 October 2026, the account endpoint returned two watchlists successfully.
Both were empty, so nonempty ordered entries and section preservation are covered
by deterministic fixtures, not claimed as live-tested account content. An anonymous
America relative-volume scan returned populated rows. No account data was modified.
