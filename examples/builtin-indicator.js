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
  // rate holds the [up, down] volume of each row: scale bars to 50 characters.
  const max = Math.max(...rows.map((h) => h.rate[0] + h.rate[1]));
  for (const h of rows) {
    const bar = (volume) => '_'.repeat(Math.round((volume / max) * 50));
    console.log(`~ ${Math.round((h.priceHigh + h.priceLow) / 2)} € : ${bar(h.rate[0])}${bar(h.rate[1])}`);
  }
  await client.close();
});
