# High-level API guide (development preview)

[Repository](https://github.com/Mathieu2301/TradingView-API) · [npm package](https://www.npmjs.com/package/@mathieuc/tradingview) · [Open an issue](https://github.com/Mathieu2301/TradingView-API/issues/new/choose)

This is a **development preview** of a simpler data-access layer for any application, not an agent-only interface. It hides chart-session lifecycle and other low-level TradingView details. The temporary `/agent` subpath and `build:agent` script names predate the planned TypeScript/Bun redesign and do not define the final syntax. Build it from source with `npm ci && npm run build:agent`; the current npm release does not include `@mathieuc/tradingview/agent` yet. The historic `require('@mathieuc/tradingview')` API is unchanged.

## One-shot

```ts
import { fetchCandles } from './agent.js';

const controller = new AbortController();
const candles = await fetchCandles({
  symbol: 'BINANCE:BTCUSDT',
  timeframe: 'D',
  limit: 100,
  timeoutMs: 15_000,
  signal: controller.signal,
});
```

`fetchCandles` returns a chronological array of `{time, open, high, low, close, volume}`. `time` is a Unix timestamp in seconds. It closes the underlying chart session and connection even after a failed first fetch.

## Realtime worker

```ts
import { watchCandles } from './agent.js';

const worker = await watchCandles(
  { symbol: 'BINANCE:BTCUSDT', timeframe: '1' },
  {
    onData(snapshot) {
      console.log(snapshot[snapshot.length - 1]);
    },
    onError(error) {
      console.error(error);
    },
  },
);

try {
  // Keep doing work; each update brings a fresh full snapshot.
  console.log(worker.latest);
} finally {
  await worker.stop(); // Safe to call more than once.
}
```

`watchCandles` resolves after the first nonempty snapshot, then continues delivering snapshots. It rejects on initial timeout, chart/client error or disconnect. After startup, errors go to `onError`; the worker closes itself on transport failure. Abort with `signal` or call `stop()` to release resources.

## Providers

`MarketDataProvider` is a small adapter contract. `TradingViewProvider` is the first implementation. Applications can inject another provider into `fetchCandles(query, provider)` or `watchCandles(query, handlers, provider)` without changing their callers. The same interface makes isolated tests possible without network traffic.

Use only accounts and data sources for which you have the necessary permissions. Never paste session cookies or API keys into issues, source files, or agent instructions.
