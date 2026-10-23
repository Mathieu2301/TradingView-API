# 4.0.1

Release channel: `latest`. Patch release; no API changes.

## Changes

- The `npx @mathieuc/tradingview` quick-start opens the TradingView agent page on molted.studio directly (the previous `market-watch-alerts` URL redirected there), with `utm_medium=cli` tracking.
- README (EN/FR/ES/PT) opens with the product film; the film files are excluded from the npm tarball to keep installs small.
- The Bun proxy test accepts newer Bun wording for HTTP 407 WebSocket errors. Client behavior is unchanged.

## Deprecation

npm versions below 4 are now marked as deprecated, pointing to the [migration guide](migration-v4.md).
