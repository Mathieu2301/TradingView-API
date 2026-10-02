# V4 reliability evidence

This page tracks reproducible release checks beyond the [capability matrix](v4-coverage.md). It is evidence for a beta, not a claim that every TradingView account feature works.

## V3/V4 candle parity

On 2 October 2026, the published `@mathieuc/tradingview@3.5.2` and V4 `main` (`95b6d0f`) loaded the same `BINANCE:BTCEUR` market. For each of `D` and `60`, the probe compared 19 closed candles out of 20 requested. All 38 matched on timestamp and OHLC. Volumes matched after applying V3's two-decimal rounding; V4 intentionally preserves the server precision. The still-open candle was excluded because it can change between sequential requests.

Repeat without adding V3 to V4's dependencies:

```sh
npm ci
npm install --prefix /tmp/tradingview-v3-baseline --no-save --no-package-lock @mathieuc/tradingview@3.5.2
TV_V3_ENTRY=/tmp/tradingview-v3-baseline/node_modules/@mathieuc/tradingview/main.js npm run probe:parity
```

`probe:parity` exits nonzero on a mismatched closed candle. It needs live network access and is not part of deterministic CI.

## Live connection lifecycle

`tests/live/recovery.test.ts` starts candle and quote watchers on one client, closes the connection while both are active, verifies both stop and report `DISCONNECTED`, then fetches candles with a new client. This is a controlled socket close, not proof of recovery from every network failure. The library does not reconnect a closed `TradingViewClient` automatically; consumers create a new client.

`npm run probe:endurance -- --minutes=120 --cycle-seconds=600` streams one-minute BTCUSDT candles and quotes for two hours, rotates the connection every ten minutes, and emits JSON lines with startup counts, updates, heartbeats and errors. It exits nonzero on a startup failure, an early watcher close or missing data. It never reads or logs account credentials. A one-minute smoke run on 2 October 2026 completed three cycles with 16 candle updates, 18 quote updates, five heartbeats and zero errors. The two-hour result should only be recorded after the run ends. The probe also accepts `--symbol`, `--timeframe` and `--chart-type` for issue-specific checks. For example, issue #236 can be investigated with `--symbol=OANDA:EURUSD --chart-type=HeikinAshi`, though a closed forex market cannot prove that quote updates remain live.

## Account redirect regression

V4 now starts the account lookup at `/chart/` and follows `Location` only on HTTP 3xx responses. A deterministic test covers HTTP 200 with a misleading `Location` header. This ports the relevant guard from legacy PR #322; it does not claim to solve CAPTCHA/WAF challenges. The authenticated manual CI run passed all 22 live tests after this change.

## Remaining beta limitations

- The 17 anonymous live tests and five authenticated tests from the [coverage matrix](v4-coverage.md) exercise short-lived calls. The authenticated subset requires `SESSION` and `SIGNATURE`; all five tests passed in the manual GitHub Actions run on 2 October 2026.
- `prodata`, private/invite-only scripts, owned layouts and drawings, Pine permission changes, password login and a live compressed strategy report still require suitable account assets. Deterministic tests cover their known packet shapes but are not live proof.
- The scheduled/manual live CI job is currently non-blocking. A red live run must be reviewed before a stable V4 release.
