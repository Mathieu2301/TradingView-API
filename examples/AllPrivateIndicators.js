const TradingView = require('../main');

/**
 * This example creates a chart with all user's private indicators
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
  timeframe: 'D',
});

(async () => {
  const indicList = await TradingView.getPrivateIndicators(process.argv[2]);

  if (!indicList.length) {
    console.error('Your account has no private indicators');
    process.exit(0);
  }

  for (const indic of indicList) {
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
  }
})();
