// Replay mode: step through history bar by bar with indicators.
// Run: npm run build && node --env-file=.env examples/replay.js
import { BuiltInIndicator, getIndicator, TradingViewClient } from '@mathieuc/tradingview';

const credentials = process.env.SESSION
  ? { session: process.env.SESSION, signature: process.env.SIGNATURE }
  : undefined;

const client = new TradingViewClient({ credentials });
const chart = client.createChart();
chart.setMarket('BINANCE:BTCEUR', {
  timeframe: 'D',
  replay: Math.round(Date.now() / 1000) - 86_400 * 7, // Start seven days ago
  count: 1,
});

const studies = { Volume: chart.createStudy(new BuiltInIndicator('Volume@tv-basicstudies-241')) };
if (credentials) {
  const ema = await getIndicator('STD;EMA');
  studies.EMA_50 = chart.createStudy(ema.clone().setInput('Length', 50));
}

let ended = false;
chart.on('replayEnd', () => { ended = true; });
await new Promise((resolve) => { chart.once('replayLoaded', resolve); });

while (!ended) {
  await chart.replayStep(1);
  const bar = chart.lastCandle;
  const values = Object.fromEntries(Object.entries(studies).map(([name, study]) => [name, study.values.at(-1)]));
  console.log(bar && new Date(bar.time * 1000).toISOString(), bar?.close, values);
}

// chart.replayStart(1000) plays automatically; chart.replayStop() pauses.
await client.close();
console.log('Done');
