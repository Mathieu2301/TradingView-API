const TradingView = require('../main');

/**
 * This example tests custom timeframes like 1 second
 */

if (!process.env.SESSION || !process.env.SIGNATURE) {
  throw Error('Please set your sessionid and signature cookies');
}

const client = new TradingView.Client({
  token: process.env.SESSION,
  signature: process.env.SIGNATURE,
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
