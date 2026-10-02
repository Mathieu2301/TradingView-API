// One-shot candles with the high-level data API.
// Run: npm run build && node examples/candles.js [SYMBOL] [TIMEFRAME]
import { getCandles } from '@mathieuc/tradingview/data';

const symbol = process.argv[2] ?? 'BINANCE:BTCUSDT';
const timeframe = process.argv[3] ?? 'D';

// The 100 most recent bars, oldest first. Resources are released automatically.
const candles = await getCandles({ symbol, timeframe, count: 100 });
const last = candles.at(-1);
console.log(`${candles.length} ${timeframe} candles for ${symbol}; last close ${last.close} at ${new Date(last.time * 1000).toISOString()}`);

// Every 4-hour bar of the last 7 days (history is loaded as deep as needed).
const week = await getCandles({ symbol, timeframe: '240', from: new Date(Date.now() - 7 * 86_400_000) });
console.log(`${week.length} 4h candles since ${new Date(week[0].time * 1000).toISOString()}`);
