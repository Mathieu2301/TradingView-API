// Indicator values with the high-level data API.
// Pine indicators (STD;..., PUB;..., USER;...) need an account: set SESSION and SIGNATURE.
// Run: npm run build && node --env-file=.env examples/indicator-data.js
import { getIndicatorData } from '@mathieuc/tradingview/data';

const credentials = process.env.SESSION
  ? { session: process.env.SESSION, signature: process.env.SIGNATURE }
  : undefined;

// A built-in study works without an account.
const volume = await getIndicatorData({ symbol: 'BINANCE:BTCEUR', indicator: 'Volume@tv-basicstudies-241', count: 5 });
console.log('Volume rows:', volume.values);

if (credentials) {
  const rsi = await getIndicatorData({
    symbol: 'BINANCE:BTCEUR',
    timeframe: '60',
    indicator: 'STD;RSI',
    inputs: { Length: 21 }, // Input ID, number, inline name or internal ID
    credentials,
  });
  console.log('Last RSI row:', rsi.values.at(-1));
} else console.log('Set SESSION and SIGNATURE to run a Pine indicator');
