const TradingView = require('../main');

/*
  This example tests built-in indicators
  like volume-based indicators
*/

if (!process.argv[2]) throw Error('Please specify your \'sessionid\' cookie');

const client = new TradingView.Client({
  token: process.argv[2],
});

const chart = new client.Session.Chart();
chart.setMarket('BINANCE:BTCEUR', {
  timeframe: '60',
  range: 1,
});

const volumeProfile = new TradingView.BuiltInIndicator('VbPSessions@tv-volumebyprice-53');

/* Required for other volume-based built-in indicators */
// volumeProfile.setOption('first_bar_time', 1639080000000);
// volumeProfile.setOption('last_bar_time', 1639328400000);
// volumeProfile.setOption('first_visible_bar_time', 1639080000000);
// volumeProfile.setOption('last_visible_bar_time', 1639328400000);

const VOL = new chart.Study(volumeProfile);
VOL.onUpdate(() => {
  VOL.graphic.hists
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
