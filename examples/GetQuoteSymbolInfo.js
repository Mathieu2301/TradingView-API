const TradingView = require('../main');

/**
 * This example creates a simple quote
 * Handy if you need to retreive the first_bar for deep_backtest
 */

const client = new TradingView.Client();

const chart = new client.Session.Quote({ fields: 'all' });
const symbol = new chart.Market('BYBIT:BTCUSDT.P');

symbol.onLoaded(() => {
  console.log('SymbolInfo: ', symbol.symbolInfo);
  client.end();
});
