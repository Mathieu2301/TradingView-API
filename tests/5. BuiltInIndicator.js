const TradingView = require('../main');

module.exports = async (log, success, warn, err, cb) => {
  const client = new TradingView.Client();

  client.onError((...error) => {
    err('Client error', error);
    throw new Error('Client error');
  });

  const chart = new client.Session.Chart();
  chart.setMarket('BINANCE:BTCEUR', {
    timeframe: '60',
  });

  chart.onError((...error) => {
    err('Chart error', error);
    throw new Error('Chart error');
  });

  const volumeProfile = new TradingView.BuiltInIndicator('VbPFixed@tv-basicstudies-139!');

  volumeProfile.setOption('first_bar_time', Date.now() - 10 ** 8);

  const VOL = new chart.Study(volumeProfile);
  VOL.onUpdate(async () => {
    VOL.graphic.horizHists
      .filter((h) => h.lastBarTime === 0) // We only keep recent volume infos
      .sort((a, b) => b.priceHigh - a.priceHigh)
      .forEach((h) => {
        success(
          `~ ${Math.round((h.priceHigh + h.priceLow) / 2)} € :`,
          `${'_'.repeat(h.rate[0] / 3)}${'_'.repeat(h.rate[1] / 3)}`,
        );
      });

    chart.delete();
    await client.end();
    cb();
  });
};
