const TradingView = require('./main');

const client = new TradingView.Client({
  token: null,
});

client.onEvent((event, data) => {
  console.log('[TEST] EVENT:', event, data);
});

const quoteSession = new client.Session.Quote({
  fields: 'price',
});

// const quoteSession2 = new client.Session.Quote({
//   fields: 'price',
// });

const BTC = new quoteSession.Market('BTCEUR');
BTC.onData((data) => {
  console.log('[TEST] BTCEUR DATA', data);
});
BTC.onError((...err) => {
  console.log('[TEST] BTCEUR ERROR', err);
});

// const BTC = new quoteSession.Symbol('BTCEUR');
// BTC.onData((symbol) => {
//   console.log(symbol);
// });

// setTimeout(() => {
//   BTC.close();
// }, 5000);
