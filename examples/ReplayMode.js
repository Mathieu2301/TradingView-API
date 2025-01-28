const TradingView = require('../main');

/**
 * This example tests the real replay mode by fetching
 * indicator data and stores it in a 'periods' variable
 */

if (!process.env.SESSION || !process.env.SIGNATURE) {
  throw Error('Please set your sessionid and signature cookies');
}

console.log('----- Testing ReplayMode: -----');

const client = new TradingView.Client({
  token: process.env.SESSION,
  signature: process.env.SIGNATURE,
});
const chart = new client.Session.Chart();

const config = {
  symbol: 'BINANCE:BTCEUR',
  timeframe: 'D',
  startFrom: Math.round(Date.now() / 1000) - 86400 * 7, // Seven days before now
  // startFrom: 1600000000,
};

chart.setMarket(config.symbol, {
  timeframe: config.timeframe,
  replay: config.startFrom,
  range: 1,
});

// chart.onReplayLoaded(() => {
//   console.log('STARTING REPLAY MODE');
//   chart.replayStart(1000);

//   // setTimeout(() => {
//   //   console.log('STOPPING REPLAY MODE');
//   //   chart.replayStop();
//   // }, 7000);
// });

let loading = 0;
const indicators = [];
const periods = {};

let interval = NaN;

async function step() {
  const period = { ...chart.periods[0] };

  const times = Object.keys(periods);
  const intrval = times[times.length - 1] - times[times.length - 2];
  if (Number.isNaN(interval) && times.length >= 2) interval = intrval;

  if (!Number.isNaN(interval) && interval !== intrval) {
    throw new Error(`Wrong interval: ${intrval} (should be ${interval})`);
  }

  indicators.forEach(([n, i]) => {
    const plots = { ...i.periods[0] };
    delete plots.$time;
    period[n] = { plots };

    Object.keys(i.graphic).forEach((g) => {
      if (!i.graphic[g].length) return;
      if (!period[n].graphics) period[n].graphics = {};
      period[n].graphics[g] = i.graphic[g];
    });
  });

  periods[period.time] = period;

  console.log('Next ->', period.time, times.length);

  await chart.replayStep(1);
  step();
}

chart.onReplayEnd(async () => {
  await client.end();
  console.log('Done !', Object.keys(periods).length);
});

async function addIndicator(name, pineId, options = {}) {
  loading += 1;

  const indic = pineId.includes('@')
    ? new TradingView.BuiltInIndicator(pineId)
    : await TradingView.getIndicator(pineId);
  Object.keys(options).forEach((o) => { indic.setOption(o, options[o]); });

  const std = new chart.Study(indic);

  std.onReady(() => {
    indicators.push([name, std]);
    if (loading === indicators.length) step();
  });
}

addIndicator('Volume', 'Volume@tv-basicstudies-241');
addIndicator('EMA_50', 'STD;EMA', { Length: 50 });
addIndicator('EMA_200', 'STD;EMA', { Length: 200 });
