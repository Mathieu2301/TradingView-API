# Extending the TradingView protocol

This guide is for maintainers and coding agents. The protocol is undocumented and
may change upstream. Start from an observed exchange, not a guessed command name.

## 1. Establish a reproducible case

Record the issue, symbol, timeframe, account plan, study identifier and expected
behavior. Separate a missing implementation from an entitlement refusal, stale
cookie, closed market or browser-only feature. Confirm the same operation in the
matching TradingView account before asserting parity.

For browser captures, keep only the minimal request/response sequence needed to
explain the behavior. Remove cookies, auth tokens, account identifiers and private
script source. Never commit a raw authenticated network log.

## 2. Choose the layer

| Concern | Implementation | Regression tests |
| --- | --- | --- |
| Frame lengths, heartbeats, packet decoding | `src/protocol/` | `tests/unit/protocol.test.ts` |
| Socket lifecycle and session routing | `src/client/` | `tests/unit/client.test.ts` |
| Chart commands, candle state, Replay | `src/chart/chart-session.ts` | `tests/unit/chart.test.ts` |
| Study updates and graphics | `src/chart/study.ts`, `graphics.ts` | `tests/unit/study.test.ts` |
| Plain/compressed strategy reports | `src/chart/strategy.ts` | `tests/unit/strategy.test.ts` |
| HTTP endpoints | `src/http/` | `tests/unit/http.test.ts` |
| One-shot calls and cancellable watchers | `src/data/` | `tests/unit/data.test.ts` |

Read the closest implementation and test before editing. Preserve the distinction
between native `BuiltInIndicator` identifiers and Pine identifiers resolved by
`getIndicator`. A chart session is not the browser's existing chart. Deep
Backtesting uses a separate history protocol; ordinary strategy reports do not
prove support for it.

## 3. Make the contract explicit

Define public types, units, ordering and missing-value behavior. Candle timestamps
are Unix seconds and high-level candles are oldest first. Preserve unknown values
as unknown instead of converting absence into zero. Keep existing exports and
cancellation/timeout behavior. HTTP additions use the existing request helper and
accept injected `fetch` and `signal`; socket additions use existing session routing.

For stateful packets, test initial data, incremental updates, malformed payloads,
server errors and cleanup. Validate a complete update before mutating state. A
watcher must stop on cancellation/disconnection and release listeners/sessions.
Do not promise automatic reconnect: the current client is terminal after close.

## 4. Verify at the right strength

```sh
npm ci
npm run check
npm run test:bun
npm audit
```

For upstream behavior, run a small bounded live probe or `npm run test:live`.
Authenticated tests read `SESSION` and `SIGNATURE` from the environment; do not put
them in examples, logs or command arguments. Run live tests only with authorized
accounts/assets. Record the tested symbol, timeframe and account tier, not secrets.

Use `npm run probe:parity` for the documented V3/V4 candle comparison and
`npm run probe:endurance -- --minutes=2 --cycle-seconds=30` for a short lifecycle
smoke. See [reliability evidence](v4-reliability.md) for setup and longer probes.
A rotating-connection run is not a single long-lived connection reproduction;
a crypto probe cannot establish forex or subscribed-futures parity.

## 5. Deliver without overstating coverage

Update API docs, a runnable example if useful, [coverage](v4-coverage.md) and the
relevant [backlog disposition](v4-backlog-triage.md). Distinguish mocked regression,
live observation and unresolved account-specific reports. Include commands and
results in the PR; inspect all CI jobs, including non-blocking live failures.
Publish prereleases with `--tag beta` only. Keep `latest` on V3 until a separate
stable-release decision; a merged PR does not itself publish an npm version.
