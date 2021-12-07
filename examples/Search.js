const TradingView = require('../main');

/*
  This example tests the searching
  functions such as 'searchMarket'
  and 'searchIndicator'
*/

TradingView.searchMarket('BINANCE:').then((rs) => {
  console.log('Found Markets:', rs);
});

TradingView.searchIndicator('RSI').then((rs) => {
  console.log('Found Indicators:', rs);
});
