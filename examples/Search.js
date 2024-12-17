const TradingView = require('../main');

/**
 * This example tests the searching functions such
 * as 'searchMarketV3' and 'searchIndicator'
 */

TradingView.searchMarketV3('BINANCE:').then((rs) => {
  console.log('Found Markets:', rs);
});

TradingView.searchIndicator('RSI').then((rs) => {
  console.log('Found Indicators:', rs);
});
