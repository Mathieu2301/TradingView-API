const TradingView = require('../main');

module.exports = async (log, success, warn, err, cb) => {
  const client = new TradingView.Client();

  client.onError((...error) => {
    err('Client error', error);
    throw new Error('Client error');
  });

  const chart = new client.Session.Chart();

  chart.setMarket('BINANCE:BTCEUR', { // Set the market
    timeframe: 'D',
  });

  chart.onError((...error) => {
    err('Chart error', error);
    throw new Error('Chart error');
  });

  chart.onSymbolLoaded(() => { // When the symbol is successfully loaded
    success(`Market "${chart.infos.description}" loaded !`);
  });

  // Wait 3 seconds and set the market to BINANCE:ETHEUR
  setTimeout(() => {
    log('Setting market to BINANCE:ETHEUR...');
    chart.setMarket('BINANCE:ETHEUR', {
      timeframe: 'D',
    });
  }, 2000);

  // Wait 4 seconds and set the timeframe to 15 minutes
  setTimeout(() => {
    log('Setting timeframe to 15 minutes...');
    chart.setSeries('15');
  }, 3000);

  // Wait 5 seconds and set the chart type to "Heikin Ashi"
  setTimeout(() => {
    log('Setting the chart type to "Heikin Ashi"...');
    chart.setMarket('BINANCE:ETHEUR', {
      timeframe: 'D',
      type: 'HeikinAshi',
    });
  }, 4000);

  // Wait 7 seconds and close the chart
  setTimeout(() => {
    log('Closing the chart...');
    chart.delete();
  }, 5000);

  // Wait 8 seconds and close the client
  setTimeout(async () => {
    log('Closing the client...');
    await client.end();
    cb();
  }, 6000);
};
