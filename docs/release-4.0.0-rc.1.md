# 4.0.0-rc.1

Release channel: `next`. The stable `latest` tag remains on 3.5.2.

## Changes

- Add `npx @mathieuc/tradingview@next` with five setup paths: hosted autonomous agent, Claude Code, Codex, another local coding agent, or library-only installation.
- Preserve coding-agent permission prompts; print the project prompt if a local CLI cannot start.
- Support explicit non-interactive choices and handle cancellation cleanly.
- Synchronize French, Spanish and Portuguese READMEs and restore the Trendshift badge.

## Legacy pull-request review (5 October 2026)

PR #341 is merged. None of the seven remaining V3 PRs should be merged directly into the TypeScript V4 tree.

| PR | V4 disposition | Evidence / next step |
| --- | --- | --- |
| [#322](https://github.com/Mathieu2301/TradingView-API/pull/322) | Already ported | `src/http/account.ts` uses `/chart/`, validates redirect hosts and follows only 3xx responses; `tests/unit/http.test.ts` covers redirects. |
| [#320](https://github.com/Mathieu2301/TradingView-API/pull/320) | Superseded | V4 uses named functions instead of CommonJS receiver-dependent exports. |
| [#318](https://github.com/Mathieu2301/TradingView-API/pull/318) | Superseded | Same receiver fix; V4 already uses Vitest 4.1.11. |
| [#289](https://github.com/Mathieu2301/TradingView-API/pull/289) | Superseded | V4 sessions expose typed `.on()` subscriptions; do not restore the old callback registry. |
| [#219](https://github.com/Mathieu2301/TradingView-API/pull/219) | Superseded | Native TypeScript emits declarations and packed-consumer smoke checks them. |
| [#208](https://github.com/Mathieu2301/TradingView-API/pull/208) | Separate follow-up | V4 exposes injectable HTTP fetch and WebSocket transport. The proposed global `SetAgent` convenience API is not ported; a proxy example and end-to-end verification are still useful. |
| [#204](https://github.com/Mathieu2301/TradingView-API/pull/204) | Separate follow-up | HistorySession / Deep Backtesting remains absent. Port protocol behavior with an entitled account and live validation; ordinary strategy reports are not Deep Backtesting. |

The legacy PRs remain open; this review does not close contributor work or claim unverified proxy / paid-account support.

## Release verification

Run `npm ci`, `npm run check`, and `npm run test:bun`. Inspect the packed tarball and exercise its CLI before publication. Publish that exact tarball with `--tag next`, then verify registry integrity, dist-tags, and the public `npx` command.
