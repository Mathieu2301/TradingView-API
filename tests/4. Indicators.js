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

  TradingView.getIndicator('STD;Supertrend%Strategy').then((indicator) => {
    indicator.setOption('commission_type', 'percent');
    indicator.setOption('commission_value', 0);
    indicator.setOption('initial_capital', 25000);
    indicator.setOption('default_qty_value', 20);
    indicator.setOption('default_qty_type', 'percent_of_equity');
    indicator.setOption('currency', 'EUR');
    indicator.setOption('pyramiding', 10);

    const SuperTrend = new chart.Study(indicator);

    SuperTrend.onError((...error) => {
      err('SuperTrend error', error[0]);
      throw new Error('SuperTrend error');
    });

    let QTY = 10;

    SuperTrend.onUpdate(async () => {
      // MarketCipher B is a strategy so it sends a strategy report
      const perfReport = SuperTrend.strategyReport.performance;

      success('Performances:', {
        total: {
          trades: perfReport.all.totalTrades,
          perf: `${Math.round(perfReport.all.netProfitPercent * 10000) / 100} %`,
        },
        buy: {
          trades: perfReport.long.totalTrades,
          perf: `${Math.round(perfReport.long.netProfitPercent * 10000) / 100} %`,
        },
        sell: {
          trades: perfReport.short.totalTrades,
          perf: `${Math.round(perfReport.short.netProfitPercent * 10000) / 100} %`,
        },
      });

      if (QTY >= 50) {
        SuperTrend.remove();
        chart.delete();
        await client.end();
        cb();
        return;
      }

      QTY += 10;
      log('TRY WITH', QTY, '%');
      setTimeout(() => {
        indicator.setOption('default_qty_value', QTY);
        SuperTrend.setIndicator(indicator);
      }, 1000);
    });
  });

  TradingView.getIndicator('PUB;uA35GeckoTA2EfgI63SD2WCSmca4njxp').then((indicator) => {
    indicator.setOption('Show_WT_Hidden_Divergences', true);
    indicator.setOption('Show_Stoch_Regular_Divergences', true);
    indicator.setOption('Show_Stoch_Hidden_Divergences', true);

    const CipherB = new chart.Study(indicator);

    CipherB.onError((...error) => {
      err('MarketCipher B error:', error[0]);
      throw new Error('MarketCipher B error');
    });

    CipherB.onUpdate(() => {
      const last = CipherB.periods[0];
      // MarketCipher B is not a strategy so it only sends plots values
      success('MarketCipher B last values:', {
        VWAP: Math.round(last.VWAP * 1000) / 1000,
        moneyFlow: (last.RSIMFIArea >= 0) ? 'POSITIVE' : 'NEGATIVE',
        buyCircle: last.Buy_and_sell_circle && last.VWAP > 0,
        sellCircle: last.Buy_and_sell_circle && last.VWAP < 0,
      });

      CipherB.remove();
    });
  });
};
