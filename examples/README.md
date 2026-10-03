# Examples

Build once, then run any example with Node or Bun:

```bash
npm ci && npm run build
node examples/candles.js
bun examples/candles.js          # Bun loads .env automatically
node --env-file=.env examples/indicator-data.js   # Examples that need an account
```

Examples that need an account read the `SESSION` and `SIGNATURE` cookies from the environment (see `.env.sample`). Never commit them.

| Example | API | Account |
| --- | --- | --- |
| [candles.js](candles.js) | `getCandles` (count, from/to) | No |
| [watch-candles.js](watch-candles.js) | `watchCandles` | No |
| [quotes.js](quotes.js) | `getQuote`, `getQuotes`, `watchQuotes` | No |
| [indicator-data.js](indicator-data.js) | `getIndicatorData` | Pine scripts only |
| [screener.js](screener.js) | `getScreener` (filters, columns, ranking) | No |
| [search.js](search.js) | `searchMarkets`, `searchIndicators`, `getTechnicalAnalysis` | No |
| [custom-chart-types.js](custom-chart-types.js) | Heikin Ashi, Renko, Line Break, Kagi, P&F, Range | No (daily) |
| [errors.js](errors.js) | `TradingViewError` codes | Partly |
| [simple-chart.js](simple-chart.js) | `TradingViewClient`, `ChartSession` | No |
| [quote-session.js](quote-session.js) | `QuoteSession` | No |
| [builtin-indicator.js](builtin-indicator.js) | `BuiltInIndicator`, study graphics | No |
| [fake-replay.js](fake-replay.js) | Negative counts and `fetchMore` | No |
| [strategy-report.js](strategy-report.js) | Public strategy → trade records → closed/open PnL summary | Yes (Basic tested) |
| [replay.js](replay.js) | Replay mode with studies | Pine studies only |
| [custom-timeframe.js](custom-timeframe.js) | Second-based timeframes | Yes |
| [from-to.js](from-to.js) | Reference times and ranges | Yes |
| [graphic-indicator.js](graphic-indicator.js) | Labels, lines, boxes, tables | Yes |
| [multiple-indicators.js](multiple-indicators.js) | Shared connection | Yes |
| [private-indicators.js](private-indicators.js) | `getPrivateIndicators` | Yes |
| [drawings.js](drawings.js) | `getDrawings` | Private layouts |
| [pine-permissions.js](pine-permissions.js) | `PinePermissionManager` | Yes (script owner) |
| [user-login.js](user-login.js) | `loginUser`, `getUser` | Username/password |
