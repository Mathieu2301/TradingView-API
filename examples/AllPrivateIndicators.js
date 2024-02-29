const TradingView = require('../main');

/**
 * This example creates a chart with all user's private indicators
 */

if (!process.argv[2]) throw Error('Please specify your \'sessionid\' cookie');
if (!process.argv[3]) throw Error('Please specify your \'signature\' cookie');

const client = new TradingView.Client({
  token: process.argv[2],
  signature: process.argv[3],
});

const chart = new client.Session.Chart();
chart.setMarket('BINANCE:BTCEUR', {
  timeframe: 'D',
});

TradingView.getPrivateIndicators(process.argv[2]).then((indicList) => {
  indicList.forEach(async (indic) => {
    const privateIndic = await indic.get();
    console.log('Loading indicator', indic.name, '...');

    const indicator = new chart.Study(privateIndic);

    indicator.onReady(() => {
      console.log('Indicator', indic.name, 'loaded !');
    });

    indicator.onUpdate(() => {
      console.log('Plot values', indicator.periods);
      console.log('Strategy report', indicator.strategyReport);
    });
  });
});
