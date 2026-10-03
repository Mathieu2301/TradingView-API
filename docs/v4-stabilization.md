# V4 stabilization and release-candidate gates

Snapshot: 3 October 2026, starting from beta.5 (`b793115`).
The source/package version is staged as **4.0.0-rc.0**. This is a prepared candidate,
not a claim of npm publication or promotion of `latest`. Install the published beta
until the candidate is released. [Migration guide](migration-v4.md).

## What changed

- Normalize failures while consuming an HTTP response body, not only while fetching
  headers. Cancellation remains `ABORTED`; other stream failures become `HTTP_ERROR`.
- Cancel pending account lookup when the client closes, disconnects or times out.
  An intentional cancellation must not emit a late `AUTH_ERROR` or send an auth packet.
- Reject empty/malformed account tokens and token-like content in rejected HTTP pages.
- Exercise the real Node/Bun websocket transport against a Node loopback fixture:
  Origin/custom headers, Unicode binary decoding, remote close and failed handshake.
- Add repeatable live scanner, ranked-list and read-only watchlist checks.
- Add source-only V8 coverage with CI floors and downloadable HTML/JSON evidence.
- Extend packed-consumer checks to discovery exports and types; include examples,
  assets, the agent index and parity diagnostic in the tarball.
- Refresh the capability/backlog tables without closing unreproduced historical issues.

## Deterministic evidence

| Check | Result |
| --- | --- |
| Typecheck, lint, build | Passed locally |
| Node unit suite | 135 passed, 14 files |
| Bun unit suite | 135 passed, 14 files |
| Source lines | 95.21% (1,235 / 1,297) |
| Source statements | 92.62% (1,394 / 1,505) |
| Source functions | 94.73% (342 / 361) |
| Source branches | 83.67% (820 / 980) |
| Dependency audit | Zero reported vulnerabilities at install |
| Packed consumer | Node ESM, Node require(esm), Bun and strict TypeScript |

Negative control: the six new lifecycle/body/token regression scenarios were run
against unmodified beta.5 source; all six failed as expected. Restoring the candidate
source makes all six pass. This verifies that the assertions detect the actual defects.

Run `npm ci && npm run check`, `npm run test:bun` and `npm run test:coverage`.
Coverage excludes test helpers and is **not** a measure of TradingView symbols,
permissions, server behavior, GUI parity or account-feature completeness. Loopback
handshake tests do not establish DNS/proxy/internet-failure coverage.

CI runs deterministic checks on Node 20/22/24 and Bun. Node 22 additionally measures
coverage with floors of 90% lines, 85% statements/functions and 75% branches.
A growing test count is not itself a release gate; assertions and tested behavior matter.

## Live evidence

The local candidate suite passed **19 anonymous tests**; **six authenticated tests
were skipped**, not passed, because credentials were not loaded into that run.
The [manual authenticated CI run](https://github.com/Mathieu2301/TradingView-API/actions/runs/37149955645)
on candidate commit `8e0e564` subsequently passed **all 25 tests**, including all six
account tests (none skipped). Its Node 20/22/24 and Bun jobs also passed. A green
workflow with a non-blocking failed live job or skipped account tests is insufficient.

Earlier beta evidence remains in [reliability evidence](v4-reliability.md): six
private USER scripts, 22 authenticated-suite tests, BTC updates after 30 heartbeats,
and a two-hour rotating-connection endurance run. These are distinct observations,
not substitutes for running the current candidate or reproducing original reports.

## Release gates and explicit non-goals

| Gate / limitation | Disposition |
| --- | --- |
| Candidate deterministic CI and package consumption | Passed on Node 20/22/24 and Bun in the linked CI run |
| Current authenticated live suite | Passed: 25/25 in the linked manual CI run |
| Open-market EUR/USD HeikinAshi after 30 heartbeats | Scheduled for Monday 5 October, 09:00 Europe/Paris; remains pending |
| Populated account watchlists | Deterministic fixtures only; do not modify account content just to manufacture coverage |
| Deep Backtesting | Not shipped; available account returned `not_allowed` |
| Renko GUI parity, subscribed CME, original private scripts and 12-hour Pine issue | Matching assets/reproduction needed; no resolution claimed |
| Automatic reconnection / server-side alerts / trading execution | Outside this release's scope |

Do not promote npm `latest` (still V3) as part of candidate preparation. Once the
remaining required evidence is reviewed, publish the exact validated candidate
under a prerelease tag, verify registry installation on Node/Bun, and record the
published integrity/version. A stable V4 release is a separate promotion decision.

## Cleanup

The 13 initial local worktrees were inventoried. Two clean, fully ancestral
worktrees were removed; the old beta.1 tarball was retained separately. Branch
references were kept. The primary managed project, worktrees with local context,
and divergent/squash-merged branches were retained rather than assuming ancestry.
No remote branches, contributor PRs, account data or historical issues were deleted.
