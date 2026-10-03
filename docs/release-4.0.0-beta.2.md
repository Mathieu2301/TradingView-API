# 4.0.0-beta.2

Target npm dist-tag: **beta**. Keep **latest** on 3.5.2.

## Changes since beta.1

- Account lookup starts on `/chart/` and follows only HTTP redirects (#321).
- Market search accepts optional country and sector filters (#225).
- Regression coverage for empty notification counts (#243).
- Upgrade development tooling to patched Vitest 4.1.11+; npm audit is clean.
- Integrate V3/V4 parity and endurance probes and the controlled-disconnection
  live regression from #330, without its stale release/version changes.
- Record the completed two-hour rotating-connection run and its limitations.
- Add a protocol contribution guide and correct prerelease installation guidance
  in `llms.txt`.

No intended breaking change relative to beta.1. See [migration-v4.md](migration-v4.md)
for the breaking V3-to-V4 migration and [backlog triage](v4-backlog-triage.md) for
unresolved private, paid-account and long-duration reports.

## Release checks

Run deterministic Node/Bun suites, typecheck, lint, build, packed-consumer smoke,
dependency audit and live tests. Publish the inspected tarball only after CI
passes; verify the registry version, dist-tags and a fresh installation afterward.
