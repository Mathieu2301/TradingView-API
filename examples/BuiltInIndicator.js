const TradingView = require('../main');

/**
 * This example tests built-in indicators like volume-based indicators
 */

const volumeProfile = new TradingView.BuiltInIndicator('VbPFixed@tv-basicstudies-241!');

const needAuth = ![
  'VbPFixed@tv-basicstudies-241',
  'VbPFixed@tv-basicstudies-241!',
  'Volume@tv-basicstudies-241',
].includes(volumeProfile.type);

if (needAuth && (!process.env.SESSION || !process.env.SIGNATURE)) {
  throw Error('Please set your sessionid and signature cookies');
}

const client = new TradingView.Client(
  needAuth
    ? {
      token: process.env.SESSION,
      signature: process.env.SIGNATURE,
    }
    : {},
);

const chart = new client.Session.Chart();
chart.setMarket('BINANCE:BTCEUR', {
  timeframe: '60',
  range: 1,
});

/* Required or not, depending on the indicator */
volumeProfile.setOption('first_bar_time', Date.now() - 10 ** 8);
// volumeProfile.setOption('first_visible_bar_time', Date.now() - 10 ** 8);

const VOL = new chart.Study(volumeProfile);
VOL.onUpdate(() => {
  VOL.graphic.horizHists
    .filter((h) => h.lastBarTime === 0) // We only keep recent volume infos
    .sort((a, b) => b.priceHigh - a.priceHigh)
    .forEach((h) => {
      console.log(
        `~ ${Math.round((h.priceHigh + h.priceLow) / 2)} € :`,
        `${'_'.repeat(h.rate[0] / 3)}${'_'.repeat(h.rate[1] / 3)}`,
      );
    });

  client.end();
});
