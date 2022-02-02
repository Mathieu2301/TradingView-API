const TradingView = require('../main');

module.exports = async (log, success, warn, err, cb) => {
  const client = new TradingView.Client(); // Creates a websocket client

  const tests = [
    (next) => { /* Testing "Credentials error" */
      log('Testing "Credentials error" error:');

      const client2 = new TradingView.Client({
        token: 'FAKE_CREDENTIALS', // Set wrong credentials
      });

      client2.onError((...error) => {
        success('=> Client error:', error);
        client2.end();
        next();
      });
    },

    (next) => { /* Testing "Invalid symbol" */
      log('Testing "Invalid symbol" error:');

      const chart = new client.Session.Chart();
      chart.onError((...error) => { // Listen for errors
        success('=> Chart error:', error);
        chart.delete();
        next();
      });

      chart.setMarket('XXXXX'); // Set a wrong market
    },

    (next) => { /* Testing "Invalid timezone" */
      log('Testing "Invalid timezone" error:');

      const chart = new client.Session.Chart();
      chart.onError((...error) => { // Listen for errors
        success('=> Chart error:', error);
        next();
      });

      chart.setMarket('BINANCE:BTCEUR'); // Set a market
      chart.setTimezone('Nowhere/Nowhere'); // Set a fake timezone
    },

    (next) => { /* Testing "Custom timeframe" */
      log('Testing "Custom timeframe" error:');

      const chart = new client.Session.Chart();
      chart.onError((...error) => { // Listen for errors
        success('=> Chart error:', error);
        chart.delete();
        next();
      });

      chart.setMarket('BINANCE:BTCEUR', { // Set a market
        timeframe: '20', // Set a custom timeframe
        /*
          Timeframe '20' isn't available because we are
          not logged in as a premium TradingView account
        */
      });
    },

    (next) => { /* Testing "Invalid timeframe" */
      log('Testing "Invalid timeframe" error:');

      const chart = new client.Session.Chart();
      chart.onError((...error) => { // Listen for errors
        success('=> Chart error:', error);
        next();
      });

      chart.setMarket('BINANCE:BTCEUR', { // Set a market
        timeframe: 'XX', // Set a wrong timeframe
      });
    },

    (next) => { /* Testing "Study not auth" */
      log('Testing "Study not auth" error:');

      const chart = new client.Session.Chart();
      chart.onError((...error) => { // Listen for errors
        success('=> Chart error:', error);
        next();
      });

      chart.setMarket('BINANCE:BTCEUR', { // Set a market
        timeframe: '15',
        type: 'Renko',
      });

      chart.onUpdate(() => {
        log('DATA', chart.periods[0]);
      });
    },

    (next) => { /* Testing "Set the market before" */
      log('Testing "Set the market before..." error:');

      const chart = new client.Session.Chart();
      chart.onError((...error) => { // Listen for errors
        success('=> Chart error:', error);
        chart.delete();
        next();
      });

      chart.setSeries('15'); // Set series before setting the market
    },

    (next) => { /* Testing "Inexistent indicator" */
      log('Testing "Inexistent indicator" error:');

      TradingView.getIndicator('STD;XXXXXXX')
        .catch((error) => {
          success('=> API error:', [error.message]);
          next();
        });
    },

    async (next) => { /* Testing "Invalid value" */
      log('Testing "Invalid value" error:');

      const chart = new client.Session.Chart();
      chart.setMarket('BINANCE:BTCEUR'); // Set a market

      const ST = await TradingView.getIndicator('STD;Supertrend');
      ST.setOption('Factor', -1); // This will cause an error

      const Supertrend = new chart.Study(ST);
      Supertrend.onError((...error) => {
        success('=> Study error:', error);
        chart.delete();
        next();
      });
    },
  ];

  (async () => {
    // eslint-disable-next-line no-restricted-syntax, no-await-in-loop
    for (const t of tests) await new Promise(t);
    success(`Crashtests ${tests.length}/${tests.length} done !`);
    cb();
  })();
};
