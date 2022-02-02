const TradingView = require('../main');

module.exports = async (log, success, warn, err, cb) => {
  const client = new TradingView.Client();

  client.onError((...error) => {
    err('Client error', error);
    throw new Error('Client error');
  });

  const chart = new client.Session.Chart();
  chart.setMarket('BINANCE:BTCEUR', {
    timeframe: 'D',
    range: -1,
    to: Math.round(Date.now() / 1000) - 86400 * 7,
  });

  chart.onError((...error) => {
    err('Chart error', error);
    throw new Error('Chart error');
  });

  let interval = NaN;
  let consec = 1;
  let lastTime = 0;

  chart.onUpdate(async () => {
    const times = chart.periods.map((p) => p.time);

    if (lastTime === times[0]) {
      consec += 1;
      warn(`Same lastTime ${lastTime}, ${consec} times in a row`);
    } else consec = 1;
    [lastTime] = times;

    if (consec >= 10) {
      chart.delete();
      await client.end();
      cb();
    }

    const intrval = times[0] - times[1];
    if (Number.isNaN(interval) && times.length >= 2) interval = intrval;

    if (!Number.isNaN(interval) && interval !== intrval) {
      throw new Error(`Wrong interval: ${intrval} (should be ${interval})`);
    }

    log('Next ->', times[0]);

    if ((times[0] + 86400) * 1000 > Date.now()) {
      chart.delete();
      await client.end();
      cb();
    }

    chart.fetchMore(-1);
  });
};
