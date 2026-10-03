/** Opt-in live comparison with the published v3 package. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const entry = process.env.TV_V3_ENTRY;
if (!entry) throw new Error('Set TV_V3_ENTRY to the installed v3 main.js path');
const { Client } = require(entry);
const { getCandles } = await import('../dist/data/index.js');
const symbol = 'BINANCE:BTCEUR';

async function legacyCandles(timeframe) {
  const client = new Client();
  const chart = new client.Session.Chart();
  try {
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('V3 chart timed out')), 20_000);
      const fail = (...parts) => { clearTimeout(timer); reject(new Error(parts.map(String).join(' '))); };
      chart.onError(fail);
      client.onError(fail);
      chart.onUpdate(() => {
        if (chart.periods.length < 20) return;
        clearTimeout(timer);
        resolve(chart.periods.map(({ time, open, max, min, close, volume }) => ({
          time, open, high: max, low: min, close, volume,
        })).sort((a, b) => a.time - b.time));
      });
      chart.setMarket(symbol, { timeframe, range: 20 });
    });
  } finally {
    chart.delete();
    await client.end();
  }
}

let total = 0;
let mismatches = 0;
for (const timeframe of ['D', '60']) {
  const oldBars = await legacyCandles(timeframe);
  const newBars = await getCandles({ symbol, timeframe, count: 20 });
  // Last bar can change between requests. V3 rounds volume to two decimals.
  const oldClosed = oldBars.slice(0, -1);
  const newClosed = newBars.slice(0, -1);
  const differences = oldClosed.flatMap((bar, index) => {
    const next = newClosed[index];
    const comparable = next && { ...next, volume: Math.round(next.volume * 100) / 100 };
    return JSON.stringify(bar) === JSON.stringify(comparable) ? [] : [index];
  });
  if (oldBars.length !== 20 || newBars.length !== 20) differences.push(-1);
  total += oldClosed.length;
  mismatches += differences.length;
  console.log(JSON.stringify({ timeframe, v3Bars: oldBars.length, v4Bars: newBars.length,
    closedBarsCompared: oldClosed.length, mismatchIndexes: differences }));
}
console.log(JSON.stringify({ closedBarsCompared: total, mismatches }));
if (mismatches) process.exitCode = 1;
