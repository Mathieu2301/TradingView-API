const TradingView = require('../main');

/**
 * This example tests an indicator that sends graphic data such
 * as 'lines', 'labels', 'boxes', 'tables', 'polygons', etc...
 */

if (!process.env.SESSION || !process.env.SIGNATURE) {
  throw Error('Please set your sessionid and signature cookies');
}

const client = new TradingView.Client({
  token: process.env.SESSION,
  signature: process.env.SIGNATURE,
});

const chart = new client.Session.Chart();
chart.setMarket('BINANCE:BTCEUR', {
  timeframe: '5',
  range: 10000,
});

// TradingView.getIndicator('USER;01efac32df544348810bc843a7515f36').then((indic) => {
// TradingView.getIndicator('PUB;5xi4DbWeuIQrU0Fx6ZKiI2odDvIW9q2j').then((indic) => {
TradingView.getIndicator('STD;Zig_Zag').then((indic) => {
  const STD = new chart.Study(indic);

  STD.onError((...err) => {
    console.log('Study error:', ...err);
  });

  STD.onReady(() => {
    console.log(`STD '${STD.instance.description}' Loaded !`);
  });

  STD.onUpdate(() => {
    console.log('Graphic data:', STD.graphic);
    // console.log('Tables:', changes, STD.graphic.tables);
    // console.log('Cells:', STD.graphic.tables[0].cells());
    client.end();
  });
});
