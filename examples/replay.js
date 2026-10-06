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

// replayStep() resolves when the server acknowledges the step; bars and study
// values arrive afterwards in chart updates, so print them from the 'update'
// event once every study has computed the latest bar.
let lastTime;
chart.on('update', () => {
  const bar = chart.lastCandle;
  if (!bar || bar.time === lastTime) return;
  const values = {};
  for (const [name, study] of Object.entries(studies)) {
    const row = study.values.find((v) => v.$time === bar.time);
    if (!row) return;
    values[name] = Object.entries(row).find(([key]) => key !== '$time')?.[1]; // First plot
  }
  lastTime = bar.time;
  console.log(new Date(bar.time * 1000).toISOString(), bar.close, values);
});

// Wait for the first bars before stepping.
await new Promise((resolve) => { chart.once('update', resolve); });
while (!ended) await chart.replayStep(1);
await new Promise((resolve) => { setTimeout(resolve, 1000); }); // Let the last bars arrive

// chart.replayStart(1000) plays automatically; chart.replayStop() pauses.
await client.close();
console.log('Done');
