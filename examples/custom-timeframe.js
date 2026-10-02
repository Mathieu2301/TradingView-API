// Second-based and other custom timeframes need an account with access to them.
// Run: npm run build && node --env-file=.env examples/custom-timeframe.js
import { getCandles } from '@mathieuc/tradingview/data';

if (!process.env.SESSION || !process.env.SIGNATURE) throw new Error('Please set your SESSION and SIGNATURE cookies');

const candles = await getCandles({
  symbol: 'CAPITALCOM:US100',
  timeframe: '1S',
  count: 10,
  timezone: 'Europe/Paris',
  credentials: { session: process.env.SESSION, signature: process.env.SIGNATURE },
});
console.log(candles);
