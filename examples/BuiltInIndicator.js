const TradingView = require('../main');

/*
  This example tests built-in indicators
  like volume-based indicators
*/

if (!process.argv[2]) throw Error('Please specify your \'sessionid\' cookie');

const client = new TradingView.Client({
  token: process.argv[2],
});

const chart = new client.Session.Chart();
chart.setMarket('BINANCE:BTCEUR', {
  timeframe: '60',
});

const volumeProfile = new TradingView.BuiltInIndicator('VbPSessions@tv-volumebyprice-53');

const VOL = new chart.Study(volumeProfile);
VOL.onUpdate(() => {
  console.log((VOL.graphic.horizlines));
  client.end();
});
