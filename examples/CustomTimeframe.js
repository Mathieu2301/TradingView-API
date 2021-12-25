const TradingView = require('../main');

/*
  This example tests custom
  timeframes like 1 second
*/

if (!process.argv[2]) throw Error('Please specify your \'sessionid\' cookie');

const client = new TradingView.Client({
  token: process.argv[2],
});

const chart = new client.Session.Chart();
chart.setTimezone('Europe/Paris');

chart.setMarket('CAPITALCOM:US100', {
  timeframe: '1S',
  range: 10,
});

chart.onSymbolLoaded(() => {
  console.log(chart.infos.name, 'loaded !');
});

chart.onUpdate(() => {
  console.log('OK', chart.periods);
  client.end();
});
