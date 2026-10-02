// Real-time candles with the high-level data API.
// Run: npm run build && node examples/watch-candles.js
import { watchCandles } from '@mathieuc/tradingview/data';

const watcher = await watchCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: '1', count: 10 }, {
  onData: (candles) => {
    const last = candles.at(-1);
    console.log(new Date(last.time * 1000).toISOString(), 'close', last.close);
  },
  onError: (error) => console.error('Watcher error:', error.code, error.message),
});

console.log(`Watching ${watcher.symbolInfo?.description}... (stops after 30 seconds)`);
setTimeout(() => watcher.stop(), 30_000);
await watcher.closed;
console.log('Stopped');
