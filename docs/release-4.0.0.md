# 4.0.0

Release channel: `latest`. This is the stable V4 release; V3 remains available by installing `@mathieuc/tradingview@3` explicitly.

## Highlights

- Make the V4 TypeScript/ESM data API the default installation: candles, quotes, indicators, screeners, watchlists and low-level sessions.
- Include an interactive `npx @mathieuc/tradingview` quick-start with hosted and local-agent paths, plus library-only installation.
- Point the quick-start, agent prompt, and English/French/Spanish/Portuguese guides at the stable package instead of `next`.

## Migration

V4 is a breaking rewrite with no V3 compatibility layer. Existing V3 projects should follow [the migration guide](migration-v4.md) and [the coverage matrix](v4-coverage.md). The npm `next` tag remains on 4.0.0-rc.2; install `@mathieuc/tradingview` for the stable version.

## Verification

The final release gate is `npm ci`, `npm run check`, `npm run test:bun`, a packed-tarball smoke test, and a fresh public-registry installation under Node and Bun. CI covers Node 20/22/24 and Bun. The published tarball and `latest` dist-tag must be checked against the locally packed release.
