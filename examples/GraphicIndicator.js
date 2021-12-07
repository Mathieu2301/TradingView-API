const TradingView = require('../main');

/*
  This example tests an indicator that sends
  graphic data such as 'lines', 'labels',
  'boxes', 'tables', 'polygons', etc...
*/

const client = new TradingView.Client();

const chart = new client.Session.Chart();
chart.setMarket('BINANCE:BTCEUR', {
  timeframe: 'W',
});

// TradingView.getIndicator('PUB;5xi4DbWeuIQrU0Fx6ZKiI2odDvIW9q2j').then((indic) => {
TradingView.getIndicator('USER;8bbd8017fd3e4881bf91f4fea5e3d538').then((indic) => {
  const STD = new chart.Study(indic);

  STD.onError((...err) => {
    console.log('Chart error:', ...err);
  });

  STD.onReady(() => {
    console.log('STD Loaded !');
  });

  STD.onUpdate((changes) => {
    // STD.graphic;
    console.log('Update:', changes);
  });
});

setInterval(() => {
  chart.fetchMore(100);
}, 2000);

setTimeout(() => {
  console.log('Setting timeframe to: \'D\'');
  chart.setSeries('D');
}, 5000);

chart.onUpdate(() => console.log(chart.periods.length));
