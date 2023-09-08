const TradingView = require('../main');

/**
 * This example creates a BTCEUR daily chart
 */

const client = new TradingView.Client(); // Creates a websocket client

const chart = new client.Session.Chart(); // Init a Chart session

chart.setMarket('BINANCE:BTCEUR', { // Set the market
  timeframe: 'D',
});

chart.onError((...err) => { // Listen for errors (can avoid crash)
  console.error('Chart error:', ...err);
  // Do something...
});

chart.onSymbolLoaded(() => { // When the symbol is successfully loaded
  console.log(`Market "${chart.infos.description}" loaded !`);
});

chart.onUpdate(() => { // When price changes
  if (!chart.periods[0]) return;
  console.log(`[${chart.infos.description}]: ${chart.periods[0].close} ${chart.infos.currency_id}`);
  // Do something...
});

// Wait 5 seconds and set the market to BINANCE:ETHEUR
setTimeout(() => {
  console.log('\nSetting market to BINANCE:ETHEUR...');
  chart.setMarket('BINANCE:ETHEUR', {
    timeframe: 'D',
  });
}, 5000);

// Wait 10 seconds and set the timeframe to 15 minutes
setTimeout(() => {
  console.log('\nSetting timeframe to 15 minutes...');
  chart.setSeries('15');
}, 10000);

// Wait 15 seconds and set the chart type to "Heikin Ashi"
setTimeout(() => {
  console.log('\nSetting the chart type to "Heikin Ashi"s...');
  chart.setMarket('BINANCE:ETHEUR', {
    timeframe: 'D',
    type: 'HeikinAshi',
  });
}, 15000);

// Wait 20 seconds and close the chart
setTimeout(() => {
  console.log('\nClosing the chart...');
  chart.delete();
}, 20000);

// Wait 25 seconds and close the client
setTimeout(() => {
  console.log('\nClosing the client...');
  client.end();
}, 25000);
