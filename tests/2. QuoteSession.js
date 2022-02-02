const TradingView = require('../main');

module.exports = (log, success, warn, err, cb) => {
  const client = new TradingView.Client();

  client.onError((...error) => {
    err('Client error', ...error);
    throw new Error('Client error');
  });

  const quoteSession = new client.Session.Quote({
    fields: 'all',
  });

  const BTC = new quoteSession.Market('BTCEUR');

  BTC.onLoaded(() => {
    success('BTCEUR LOADED');
  });

  const keys = [
    'volume', 'update_mode', 'type', 'timezone',
    'short_name', 'rtc_time', 'rtc', 'rchp', 'ch',
    'rch', 'provider_id', 'pro_name', 'pricescale',
    'prev_close_price', 'original_name', 'lp',
    'open_price', 'minmove2', 'minmov', 'lp_time',
    'low_price', 'is_tradable', 'high_price',
    'fractional', 'exchange', 'description',
    'current_session', 'currency_code', 'chp',
    'currency-logoid', 'base-currency-logoid',
  ];

  BTC.onData(async (data) => {
    const rsKeys = Object.keys(data);
    success('BTCEUR DATA');
    if (rsKeys.length <= 2) return;

    keys.forEach((k) => {
      if (!rsKeys.includes(k)) {
        err(`Missing '${k}' key in`, rsKeys);
        throw new Error('Missing key');
      }
    });

    quoteSession.delete();
    await client.end();
    cb();
  });

  BTC.onError((...error) => {
    err('BTCEUR ERROR:', error);
    throw new Error('Missing key');
  });
};
