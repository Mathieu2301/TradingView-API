const TradingView = require('../main');

/**
 * This example runs a deep backtest using TradingView's
 * history-data server (requires a Premium plan).
 */

if (!process.env.SESSION || !process.env.SIGNATURE) {
  throw Error('Please set your sessionid and signature cookies');
}

console.log('----- Testing DeepBacktest: -----');

const client = new TradingView.Client({
  token: process.env.SESSION,
  signature: process.env.SIGNATURE,
  server: 'history-data',
});

client.onError((...error) => {
  console.error('Client error:', ...error);
});

const history = new client.Session.History();

history.onError(async (...error) => {
  console.error('History error:', ...error);
  history.delete();
  await client.end();
});

(async () => {
  console.log('Loading built-in strategy...');
  const indicator = await TradingView.getIndicator('STD;MACD%1Strategy');

  const from = Math.floor(new Date(2010, 1, 1).getTime() / 1000);
  const to = Math.floor(Date.now() / 1000);

  console.log('Running deep backtest...');
  history.requestHistoryData('AMEX:SPY', indicator, { timeframe: '5', from, to });

  history.onHistoryLoaded(async () => {
    console.log(
      'Deep backtest traded from',
      new Date(history.strategyReport.settings.dateRange.trade.from),
    );
    console.log('Closing client...');
    history.delete();
    await client.end();
    console.log('Done !');
  });
})();
