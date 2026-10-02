// Run every private (saved) indicator of your account on a chart.
// Run: npm run build && node --env-file=.env examples/private-indicators.js
import { getIndicator, getPrivateIndicators, TradingViewClient } from '@mathieuc/tradingview';

if (!process.env.SESSION || !process.env.SIGNATURE) throw new Error('Please set your SESSION and SIGNATURE cookies');
const credentials = { session: process.env.SESSION, signature: process.env.SIGNATURE };

const list = await getPrivateIndicators(credentials);
if (!list.length) {
  console.log('Your account has no private indicators');
  process.exit(0);
}

const client = new TradingViewClient({ credentials });
const chart = client.createChart();
chart.setMarket('BINANCE:BTCEUR', { timeframe: 'D' });

for (const item of list) {
  const study = chart.createStudy(await getIndicator(item.id, { version: item.version, credentials }));
  study.on('error', (error) => console.error(item.name, error.message));
  study.on('ready', () => {
    console.log(item.name, 'last values:', study.values.at(-1));
    if (study.strategyReport.performance.all) console.log(item.name, 'strategy:', study.strategyReport.performance.all);
  });
}

setTimeout(() => client.close(), 15_000);
