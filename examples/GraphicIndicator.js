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

// TradingView.getIndicator('USER;01efac32df544348810bc843a7515f36').then((indic) => {
TradingView.getIndicator('PUB;5xi4DbWeuIQrU0Fx6ZKiI2odDvIW9q2j').then((indic) => {
  const STD = new chart.Study(indic);

  STD.onError((...err) => {
    console.log('Chart error:', ...err);
  });

  STD.onReady(() => {
    console.log('STD Loaded !');
  });

  STD.onUpdate(() => {
    console.log(STD.graphic);
    // console.log('Tables:', changes, STD.graphic.tables);
    // console.log('Cells', STD.graphic.tables[0].cells());
    client.end();
  });
});
