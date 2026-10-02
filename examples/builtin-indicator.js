// Built-in studies such as the fixed-range volume profile.
// Run: npm run build && node examples/builtin-indicator.js
import { BuiltInIndicator, TradingViewClient } from '@mathieuc/tradingview';

const profile = new BuiltInIndicator('VbPFixed@tv-basicstudies-241!');
profile.setOption('first_bar_time', Date.now() - 10 ** 8);

const client = new TradingViewClient();
const chart = client.createChart();
chart.setMarket('BINANCE:BTCEUR', { timeframe: '60', count: 1 });

const study = chart.createStudy(profile);
study.on('update', async () => {
  const rows = study.graphics.horizHists
    .filter((h) => h.lastBarTime === 0) // Profile that ends on the latest bar
    .sort((a, b) => b.priceHigh - a.priceHigh);
  if (!rows.length) return;
  for (const h of rows) {
    console.log(`~ ${Math.round((h.priceHigh + h.priceLow) / 2)} € : ${'_'.repeat(h.rate[0] / 3)}${'_'.repeat(h.rate[1] / 3)}`);
  }
  await client.close();
});
