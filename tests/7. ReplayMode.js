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
    replay: Math.round(Date.now() / 1000) - 86400 * 10,
    range: 1,
  });

  chart.onError((...error) => {
    err('Chart error', error);
    throw new Error('Chart error');
  });

  let finished = false;
  async function step() {
    log('Next');
    await chart.replayStep(1);
    if (!finished) step();
  }

  chart.onReplayLoaded(async () => {
    log('START REPLAY MODE');
    await chart.replayStart(200);

    setTimeout(async () => {
      await chart.replayStop();
      log('STOP REPLAY MODE');
      step();
    }, 1000);
  });

  chart.onReplayPoint((p) => {
    success('Point ->', p);
  });

  chart.onReplayEnd(async () => {
    finished = true;
    chart.delete();
    await client.end();
    cb();
  });
};
