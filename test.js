require('@mathieuc/console')(
  '§', // Character you want to use (defaut: '§')
  true, // Active timestamp (defaut: false)
);

const TradingView = require('./main');

const log = (...msg) => console.log('§90§30§103 TEST §0', ...msg);

const client = new TradingView.Client({ DEBUG: true });

client.onEvent((event, data) => {
  log('EVENT:', event, data);
});

client.onError((...error) => {
  log(...error);
});

// const quoteSession = new client.Session.Quote({
//   fields: 'price',
// });

// const BTC = new quoteSession.Market('BTCEUR');

// BTC.onLoaded(() => {
//   log('BTCEUR LOADED !');
// });

// BTC.onData((data) => {
//   log('BTCEUR DATA:', data);
// });

// BTC.onError((...err) => {
//   log('BTCEUR ERROR:', err);
// });

const chart = new client.Session.Chart();
chart.setMarket('COINBASE:BTCEUR');
chart.setSeries('60');

chart.onSymbolLoaded(() => {
  log('Market loaded:', chart.infos.full_name);
});

chart.onError((...err) => {
  log('CHART ERROR:', ...err);
});

chart.onUpdate(() => {
  const last = chart.periods[0];
  if (!last) return;
  log(`Market last period: ${last.close}`);
});

TradingView.getIndicator('STD;Supertrend%Strategy').then((indicator) => {
  indicator.setOption('commission_type', 'percent');
  indicator.setOption('commission_value', 0);
  indicator.setOption('initial_capital', 25000);
  indicator.setOption('default_qty_value', 20);
  indicator.setOption('default_qty_type', 'percent_of_equity');
  indicator.setOption('currency', 'EUR');
  indicator.setOption('pyramiding', 10);

  const SuperTrend = new chart.Study(indicator);

  SuperTrend.onReady(() => {
    log('SuperTrend ready !');
  });

  SuperTrend.onError((...err) => {
    log('SuperTrend ERROR:', err[0]);
  });

  // let QTY = 10;
  // setInterval(() => {
  //   QTY += 10;
  //   console.log('TRY WITH', QTY, '%');
  //   indicator.setOption('default_qty_value', QTY);

  //   SuperTrend.setIndicator(indicator);
  // }, 5000);

  SuperTrend.onUpdate((changes) => {
    // MarketCipher B is a strategy so it sends a strategy report
    log('SuperTrend update:', changes);

    const perfReport = SuperTrend.strategyReport.performance;

    log('Performance report:', {
      total: {
        trades: perfReport.all.totalTrades,
        perf: `${Math.round(perfReport.all.netProfitPercent * 10000) / 100} %`,
        profit: `${Math.round(perfReport.all.netProfit * 1000) / 1000} €`,
      },
      buy: {
        trades: perfReport.long.totalTrades,
        perf: `${Math.round(perfReport.long.netProfitPercent * 10000) / 100} %`,
        profit: `${Math.round(perfReport.long.netProfit * 1000) / 1000} €`,
      },
      sell: {
        trades: perfReport.short.totalTrades,
        perf: `${Math.round(perfReport.short.netProfitPercent * 10000) / 100} %`,
        profit: `${Math.round(perfReport.short.netProfit * 1000) / 1000} €`,
      },
    });

    if (changes.includes('fullReport')) {
      log('Last trade:', SuperTrend.strategyReport.trades[0]);
      // Do something...

      // // Remove SuperTrend strategy from the chart
      // SuperTrend.remove();
    }
  });
});

TradingView.getIndicator('PUB;uA35GeckoTA2EfgI63SD2WCSmca4njxp').then((indicator) => {
  indicator.setOption('Show_WT_Hidden_Divergences', true);
  indicator.setOption('Show_Stoch_Regular_Divergences', true);
  indicator.setOption('Show_Stoch_Hidden_Divergences', true);

  const CipherB = new chart.Study(indicator);

  CipherB.onReady(() => {
    log('MarketCipher B ready !');
  });

  CipherB.onError((...err) => {
    log('MarketCipher B ERROR:', err[0]);
  });

  CipherB.onUpdate(() => {
    const last = CipherB.periods[0];
    // MarketCipher B is not a strategy so it only sends plots values
    log('MarketCipher B last values:', {
      VWAP: Math.round(last.VWAP * 1000) / 1000,
      moneyFlow: (last.RSIMFIArea >= 0) ? 'POSITIVE' : 'NEGATIVE',
      buyCircle: last.Buy_and_sell_circle && last.VWAP > 0,
      sellCircle: last.Buy_and_sell_circle && last.VWAP < 0,
    });

    // Do something...
  });
});

// setTimeout(() => {
//   log('Set timeframe to 240...');
//   chart.setSeries('240');
// }, 5000);

// setInterval(() => {
//   log('Fetch 100 more periods...');
//   chart.fetchMore(100);
// }, 10000);
