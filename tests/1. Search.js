const TradingView = require('../main');

module.exports = async (log, success, warn, err, cb) => {
  log('Searching market: \'BINANCE:\'');
  const markets = await TradingView.searchMarket('BINANCE:');
  success('Found', markets.length, 'markets');

  log('Searching indicator: \'RSI\'');
  const indicators = await TradingView.searchIndicator('RSI');
  success('Found', indicators.length, 'indicators');

  if (markets.length < 10 || indicators.length < 10) {
    err('Not enough results');
    throw new Error('Not enough results');
  }

  cb();
};
