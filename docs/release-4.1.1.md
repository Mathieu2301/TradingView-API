# 4.1.1

Release channel: `latest`. Patch release: no API change for 4.1.0 users.

## Pine studies: "Can't parse pine"

Since 27 Oct 2026, every Pine study failed on the chart with `study_error` "Can't parse pine": built-in (`STD;`), public (`PUB;`) and private (`USER;`) scripts alike, on 3.5.x and 4.x (#354).

TradingView moved the compiled script out of `pine-facade/translate`'s `result.ilTemplate`: first to the hidden `text` input, then to `result.metaInfo.defaults.inputs.text`. `getIndicator()` now reads all three locations, so a rollback on TradingView's side keeps working, and throws a clear `PARSE_ERROR` when none holds a compiled script (#355).

Verified live with an authenticated session: `STD;RSI` and a private `USER;` indicator return data again.

Still on 3.5.x: see the patch for `getIndicator` in `src/miscRequests.js` in #354.

Pre-release 4.1.1-beta.0 was published under the `beta` tag on 30 Oct 2026. 4.1.1 has the same code; only the version and these notes change.
