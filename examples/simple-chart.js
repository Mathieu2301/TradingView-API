// Low-level chart session: change market, timeframe and chart type on one chart.
// Run: npm run build && node examples/simple-chart.js
import { TradingViewClient } from '@mathieuc/tradingview';

const client = new TradingViewClient();
const chart = client.createChart();

chart.on('error', (error) => console.error('Chart error:', error.code, error.message));
chart.on('symbolLoaded', (info) => console.log(`Market "${info.description}" loaded`));
chart.on('update', () => {
  const last = chart.lastCandle;
  if (last) console.log(`[${chart.symbolInfo?.description}] ${last.close} ${chart.symbolInfo?.currency_id}`);
});

chart.setMarket('BINANCE:BTCEUR', { timeframe: 'D' });

setTimeout(() => {
  console.log('\nSetting market to BINANCE:ETHEUR...');
  chart.setMarket('BINANCE:ETHEUR', { timeframe: 'D' });
}, 5_000);

setTimeout(() => {
  console.log('\nSetting timeframe to 15 minutes...');
  chart.setTimeframe('15');
}, 10_000);

setTimeout(() => {
  console.log('\nSetting the chart type to Heikin Ashi...');
  chart.setMarket('BINANCE:ETHEUR', { timeframe: 'D', type: 'HeikinAshi' });
}, 15_000);

setTimeout(async () => {
  console.log('\nClosing...');
  chart.delete();
  await client.close();
}, 20_000);
