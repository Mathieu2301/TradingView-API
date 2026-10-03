/** Opt-in live endurance probe. No credentials are read or logged. */
import { TradingViewClient } from '../dist/index.js';
import { watchCandles, watchQuotes } from '../dist/data/index.js';

const argument = (name, fallback) => {
  const raw = process.argv.find((value) => value.startsWith(`--${name}=`))?.split('=')[1];
  const number = raw === undefined ? fallback : Number(raw);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`--${name} must be positive`);
  return number;
};

const textArgument = (name, fallback) => process.argv.find((value) => value.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const minutes = argument('minutes', 120);
const cycleSeconds = argument('cycle-seconds', 600);
const heartbeatThreshold = argument('heartbeat-threshold', 30);
const requirePostThresholdUpdates = process.argv.includes('--require-post-threshold-updates');
const symbol = textArgument('symbol', 'BINANCE:BTCUSDT');
const timeframe = textArgument('timeframe', '1');
const chartType = textArgument('chart-type', undefined);
const deadline = Date.now() + minutes * 60_000;
const metrics = { cycles: 0, starts: 0, failures: 0, candleUpdates: 0, quoteUpdates: 0, heartbeats: 0, postThresholdCandleUpdates: 0, postThresholdQuoteUpdates: 0, errors: [] };
let interrupted = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { interrupted = true; });

const report = (event, extra = {}) => console.log(JSON.stringify({
  at: new Date().toISOString(), event, ...extra,
}));

function waitForCycle(ms, watchers) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve('elapsed'), ms);
    Promise.race(watchers.map((watcher) => watcher.closed)).then(() => {
      clearTimeout(timer);
      resolve('closed');
    });
  });
}

const status = setInterval(() => report('status', { ...metrics, errors: metrics.errors.slice(-3) }), 60_000);
report('start', { minutes, cycleSeconds, symbol, timeframe, chartType, heartbeatThreshold, requirePostThresholdUpdates });
try {
  while (!interrupted && Date.now() < deadline) {
    metrics.cycles += 1;
    const client = new TradingViewClient();
    let cycleHeartbeats = 0;
    client.on('heartbeat', () => { metrics.heartbeats += 1; cycleHeartbeats += 1; });
    client.on('error', (error) => metrics.errors.push(error.code));
    let candles;
    let quotes;
    try {
      candles = await watchCandles({ symbol, timeframe, chartType, count: 5, client }, {
        onData: () => {
          metrics.candleUpdates += 1;
          if (cycleHeartbeats > heartbeatThreshold) metrics.postThresholdCandleUpdates += 1;
        },
        onError: (error) => metrics.errors.push(error.code),
      });
      quotes = await watchQuotes({ symbols: [symbol], fields: 'price', client }, {
        onData: () => {
          metrics.quoteUpdates += 1;
          if (cycleHeartbeats > heartbeatThreshold) metrics.postThresholdQuoteUpdates += 1;
        },
        onError: (error) => metrics.errors.push(error.code),
      });
      if (candles.latest.length !== 5 || typeof quotes.latest[symbol]?.lp !== 'number') {
        throw new Error('Initial market snapshots incomplete');
      }
      metrics.starts += 1;
      report('connected', { cycle: metrics.cycles, candles: candles.latest.length, quotePricePresent: true });
      const duration = Math.min(cycleSeconds * 1000, deadline - Date.now());
      const outcome = await waitForCycle(duration, [candles, quotes]);
      if (outcome === 'closed' && !interrupted) throw new Error('Watcher closed before planned rotation');
      report('rotation', { cycle: metrics.cycles, outcome });
    } catch (error) {
      metrics.failures += 1;
      metrics.errors.push(error?.code ?? error?.message ?? String(error));
      report('failure', { cycle: metrics.cycles, code: error?.code, message: error?.message });
    } finally {
      await Promise.allSettled([candles?.stop(), quotes?.stop()]);
      await client.close();
    }
    if (metrics.failures >= 3) break;
    if (metrics.failures && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 3_000));
  }
} finally {
  clearInterval(status);
  report('summary', { ...metrics, errors: metrics.errors.slice(-10), interrupted });
}
if (interrupted || metrics.failures || metrics.errors.length || metrics.starts === 0
  || metrics.quoteUpdates === 0 || metrics.candleUpdates === 0
  || (requirePostThresholdUpdates && (!metrics.postThresholdCandleUpdates || !metrics.postThresholdQuoteUpdates))) {
  process.exitCode = 1;
}
