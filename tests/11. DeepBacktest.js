const TradingView = require('../main');

const wait = (ms) => new Promise((cb) => { setTimeout(cb, ms); });

module.exports = async (log, success, warn, err, cb) => {
  if (!process.env.SESSION || !process.env.SIGNATURE) {
    warn('No sessionid/signature was provided');
    cb();
    return;
  }

  log('Creating logged history client');
  const client = new TradingView.Client({
    // requires a Premium plan
    token: process.env.SESSION,
    signature: process.env.SIGNATURE,
    // needs a new server type
    server: 'history-data',
  });

  client.onError((...error) => {
    err('Client error', error);
  });

  const history = new client.Session.History();

  history.onError((...error) => {
    err('History error', error);
    history.delete();
    client.end();
    cb();
  });

  await wait(1000);
  log('Loading built-in strategy....');
  const indicator = await TradingView.getIndicator('STD;MACD%1Strategy');

  const from = Math.floor(new Date(2010, 1, 1) / 1000);
  const to = Math.floor(Date.now() / 1000);

  log('Running deep backtest....');
  history.requestHistoryData('AMEX:SPY', indicator, { timeframe: '5', from, to });
  history.onHistoryLoaded(async () => {
    success('Deep backtest traded from', new Date(history.strategyReport.settings.dateRange.trade.from));
    log('Closing client...');
    history.delete();
    await client.end();
    success('Client closed');
    cb();
  });

  log('Strategy loaded !');
};
