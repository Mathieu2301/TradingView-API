// Bars before or after a reference time, with an indicator on the same chart.
// The reference time needs an account with enough history access.
// Run: npm run build && node --env-file=.env examples/from-to.js
import { getCandles, getIndicator, TradingViewClient } from '@mathieuc/tradingview';

if (!process.env.SESSION || !process.env.SIGNATURE) throw new Error('Please set your SESSION and SIGNATURE cookies');
const credentials = { session: process.env.SESSION, signature: process.env.SIGNATURE };

// High level: every 4h bar between two dates.
const range = await getCandles({
  symbol: 'BINANCE:BTCEUR', timeframe: '240', from: new Date('2023-11-01'), to: new Date('2023-11-14'), credentials,
});
console.log(`${range.length} bars from ${new Date(range[0].time * 1000).toISOString()}`);

// Low level: 2 bars before a timestamp (negative counts load bars after it) and a study.
const client = new TradingViewClient({ credentials });
const chart = client.createChart();
chart.setMarket('BINANCE:BTCEUR', { timeframe: '240', count: 2, to: 1_700_000_000 });

const supertrend = chart.createStudy(await getIndicator('STD;Supertrend'));
supertrend.on('ready', async () => {
  console.log('Prices:', chart.candles);
  console.log('Study:', supertrend.values.slice(-2));
  await client.close();
});
