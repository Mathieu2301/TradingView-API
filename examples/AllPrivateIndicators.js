const TradingView = require('../main');

/*
  This example creates a chart with
  all user's private indicators
*/

const client = new TradingView.Client({
  /* Token is only needed if at least one indicator is
    PRIVATE (if you have a paid TradingView account) */
  token: 'YOUR_SESSION_ID_COOKIE',
});

const chart = new client.Session.Chart();
chart.setMarket('BINANCE:BTCEUR', {
  timeframe: 'D',
});

TradingView.getPrivateIndicators('YOUR_SESSION_ID_COOKIE').then((indicList) => {
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
