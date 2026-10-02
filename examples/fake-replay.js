// "Fake replay": walk forward from a past date by loading newer bars, which
// also works on intraday timeframes without an account.
// Run: npm run build && node examples/fake-replay.js
import { TradingViewClient } from '@mathieuc/tradingview';

const client = new TradingViewClient();
const chart = client.createChart();

chart.setMarket('BINANCE:BTCEUR', {
  timeframe: '240',
  count: -1, // Negative: load bars after `to` instead of before
  to: Math.round(Date.now() / 1000) - 86_400 * 7, // Seven days ago
});

chart.on('seriesCompleted', async () => {
  const last = chart.lastCandle;
  console.log('Next ->', last && new Date(last.time * 1000).toISOString(), `(${chart.candles.length} bars)`);
  if (!last || last.time > Date.now() / 1000 - 86_400) {
    await client.close();
    console.log('Done');
    return;
  }
  chart.fetchMore(-2); // Two newer bars
});
