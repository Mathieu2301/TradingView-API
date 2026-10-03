# 4.0.0-beta.1 release candidate

Status: prepared for review; not published by this change.
Target npm dist-tag: **beta**. Keep **latest** on 3.5.2.

## Changes since beta.0

- Preserve buy-and-hold history even when a report has no equity history (#331).
- Export `summarizeStrategyReport`: separate record counts, closed/open trade
  counts, closed net profit, open PnL and total PnL; retain unknown fields as
  undefined (#331).
- Reject structurally malformed trade lists before modifying a report; report
  parse errors consistently for plain and compressed envelopes (#332).
- Add a runnable public-strategy/report/PnL example, with bounded execution,
  credential checks and explicit failure status.
- Document Basic Replay playback evidence and separate paid UI export and
  Deep Backtesting limits from library report access.

## Validation

- Deterministic Node/Bun suites, typecheck, lint, build and packed-consumer smoke
  checks are required before publication.
- Basic live probe: daily BINANCE:BTCEUR Replay load, three step acknowledgments,
  automatic bar advancement, start and stop acknowledgments.
- Strategy example executed against Basic; report aggregates and history returned.
- Private compressed strategy capture validated in the preceding fixes.
- No claim of universal Replay entitlement, UI export success or Deep Backtesting.

## Publication gate

Publication requires the maintainer's explicit go-ahead. After approval, use the
reviewed commit with a clean checkout, rerun package checks, and publish the
inspected tarball using `npm publish <tarball> --tag beta`. Verify the resulting
version and dist-tags. Do not use the default `latest` tag. No tag, GitHub release,
or npm publication is created by preparing this candidate.

For v3 migration and breaking changes inherited from beta.0, see
[migration-v4.md](migration-v4.md). This candidate adds no new intended breaking
change relative to beta.0.
