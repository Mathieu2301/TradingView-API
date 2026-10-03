# V4 reliability evidence

This page tracks reproducible release checks beyond the [capability matrix](v4-coverage.md). It is evidence for a beta, not a claim that every TradingView account feature works.

## V3/V4 candle parity

On 2 October 2026, the published `@mathieuc/tradingview@3.5.2` and V4 `main` (`95b6d0f`) loaded the same `BINANCE:BTCEUR` market. For each of `D` and `60`, the probe compared 19 closed candles out of 20 requested. All 38 matched on timestamp and OHLC. Volumes matched after applying V3's two-decimal rounding; V4 intentionally preserves the server precision. The still-open candle was excluded because it can change between sequential requests.

A repeat against the beta.2 candidate on 3 October 2026 again compared all 38 closed candles with zero mismatches.

Repeat without adding V3 to V4's dependencies:

```sh
npm ci
npm install --prefix /tmp/tradingview-v3-baseline --no-save --no-package-lock @mathieuc/tradingview@3.5.2
TV_V3_ENTRY=/tmp/tradingview-v3-baseline/node_modules/@mathieuc/tradingview/main.js npm run probe:parity
```

`probe:parity` exits nonzero on a mismatched closed candle. It needs live network access and is not part of deterministic CI.

## Live connection lifecycle

`tests/live/recovery.test.ts` starts candle and quote watchers on one client, closes the connection while both are active, verifies both stop and report `DISCONNECTED`, then fetches candles with a new client. This is a controlled socket close, not proof of recovery from every network failure. The library does not reconnect a closed `TradingViewClient` automatically; consumers create a new client.

`npm run probe:endurance -- --minutes=120 --cycle-seconds=600` streams one-minute BTCUSDT candles and quotes for two hours, rotates the connection every ten minutes, and emits JSON lines with startup counts, updates, heartbeats and errors. It exits nonzero on a startup failure, an early watcher close or missing data. It never reads or logs account credentials. A one-minute smoke run on 2 October 2026 completed three cycles with 16 candle updates, 18 quote updates, five heartbeats and zero errors. The completed two-hour run on 3 October 2026 recorded 12 successful cycles, 1,721 candle updates, 1,765 quote updates and 719 heartbeats, with zero failures/errors and no interruption. Connections rotated every ten minutes: this is not a two-hour unbroken-socket test and does not close #236 or the 12-hour Pine report #188. The saved JSONL summary was recovered before recording these counts. The probe also accepts `--symbol`, `--timeframe` and `--chart-type` for issue-specific checks. For example, issue #236 can be investigated with `--symbol=OANDA:EURUSD --chart-type=HeikinAshi`, though a closed forex market cannot prove that quote updates remain live.

## Account redirect regression

V4 now starts the account lookup at `/chart/` and follows `Location` only on HTTP 3xx responses. A deterministic test covers HTTP 200 with a misleading `Location` header. This ports the relevant guard from legacy PR #322; it does not claim to solve CAPTCHA/WAF challenges. The authenticated manual CI run passed all 22 live tests after this change. The beta.2 candidate also passed all 22 current live tests locally on 3 October 2026, including the recovered lifecycle regression.

## Remaining beta limitations

- Live checks exercise a small set of symbols, scripts and account rights, not every capability.
- Basic daily Replay and strategy reports are documented in [v4-coverage.md](v4-coverage.md); this is not proof of Deep Backtesting or universal intraday entitlement.
- Private/invite-only script cases, subscribed futures parity, owned layouts and long-running Pine failures need matching assets and targeted reproductions. See [backlog triage](v4-backlog-triage.md).
- Live CI is non-blocking. Review its actual test results, not just the overall workflow conclusion, before release.

## Account-scoped diagnostics (beta.5)

From a source checkout, set `SESSION` and `SIGNATURE` securely and run
`npm run probe:account`. The read-only probe authenticates, lists saved scripts,
then evaluates at most ten scripts sequentially on 100 daily BTCUSDT bars. Use
`--max-scripts=N` and `--timeout-ms=N` after `--` to change these bounds.
It prints only counts, index-based outcomes, script namespace categories and the
account token's plan claim. It does not print script IDs, names, source, values,
account identifiers or credentials. A plan claim is informational, not proof of
exchange or Deep Backtesting entitlement. Failures exit nonzero; an empty saved
script list is not considered successful private-script coverage.

The package now includes both diagnostics, so installed consumers can run:

```sh
node node_modules/@mathieuc/tradingview/scripts/probe-account.mjs
node node_modules/@mathieuc/tradingview/scripts/endurance.mjs --minutes=7 --cycle-seconds=600 --require-post-threshold-updates
```

The second command requires candle **and** quote callbacks after more than 30
heartbeats on the same connection. `--heartbeat-threshold=N` changes the threshold.
Counters reset per connection for threshold eligibility; ten short connections do
not constitute one long connection. Initial snapshots alone cannot satisfy this
mode. Any recorded error or interruption also makes the probe fail. Without the
flag, a completed run remains a transport/lifecycle check, not a liveness guarantee.
Run strict mode on an open market; a closed venue cannot supply the required proof.

### Verified private scripts and outstanding paid-account prerequisite

On 3 October 2026, all six saved `USER;` scripts accessible to the available account
completed: two studies and four strategies, each returning 100 candles and 200
study rows. Three strategies returned 208, 4 and 69 trades respectively; the fourth
returned a report with zero trades. These are account-specific fixtures, not a
reproduction of the private strategy in #89 or the table payload in #251.

A bounded request to `history-data` using the protocol in PR #204 reached the server
and returned `request_error` / `not_allowed`. No Deep Backtesting success is claimed.
An eligible account and current successful protocol capture are required before
shipping that API. No subscription was purchased and no account content was modified.
The original scripts/fixtures for #188 (long-running Pine depth error), #24 (Renko
GUI parity) and #311 (subscribed CME sessions) remain unavailable for exact reproduction.

### Unbroken-socket checks, 3 October 2026

- **BTCUSDT, six minutes, one connection:** 35 heartbeats, 85 candle callbacks,
  89 quote callbacks; after heartbeat 30 on that same connection, 13 candle and
  12 quote callbacks. Zero errors/failures; strict mode exited successfully.
- **OANDA:EURUSD HeikinAshi, seven minutes, one connection:** 41 heartbeats,
  one initial candle callback and one initial quote callback, zero errors/failures.
  The forex market was closed: this proves heartbeat continuity only and does not
  resolve #236's reported price-stream freeze on an open market.
- Negative controls: a short initial-snapshot-only run fails strict mode, and an
  interrupted run exits nonzero after cleanup. Account diagnostics also fail cleanly
  without credentials; a bounded one-script run was separately verified on Bun.

Neither run is a 12-hour Pine reproduction. The full authenticated live suite on
beta.4 passed all 22 tests; beta.5 changes diagnostic tooling/documentation only.
