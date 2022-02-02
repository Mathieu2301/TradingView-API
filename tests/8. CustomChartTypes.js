const TradingView = require('../main');

module.exports = async (log, success, warn, err, cb) => {
  const client = new TradingView.Client();

  client.onError((...error) => {
    err('Client error', error);
    throw new Error('Client error');
  });

  const chart = new client.Session.Chart();

  chart.onError((...error) => {
    err('Chart error', error);
    throw new Error('Chart error');
  });

  /* (0s) Heikin Ashi chart */
  setTimeout(() => {
    log('Setting chart type to: HeikinAshi');

    chart.setMarket('BINANCE:BTCEUR', {
      type: 'HeikinAshi',
      timeframe: 'D',
    });
  }, 0);

  /* (1s) Renko chart */
  setTimeout(() => {
    log('Setting chart type to: Renko');

    chart.setMarket('BINANCE:BTCEUR', {
      type: 'Renko',
      timeframe: 'D',
      inputs: {
        source: 'close',
        sources: 'Close',
        boxSize: 3,
        style: 'ATR',
        atrLength: 14,
        wicks: true,
      },
    });
  }, 1000);

  /* (2s) Line Break chart */
  setTimeout(() => {
    log('Setting chart type to: LineBreak');

    chart.setMarket('BINANCE:BTCEUR', {
      type: 'LineBreak',
      timeframe: 'D',
      inputs: {
        source: 'close',
        lb: 3,
      },
    });
  }, 2000);

  /* (3s) Kagi chart */
  setTimeout(() => {
    log('Setting chart type to: Kagi');

    chart.setMarket('BINANCE:BTCEUR', {
      type: 'Kagi',
      timeframe: 'D',
      inputs: {
        source: 'close',
        style: 'ATR',
        atrLength: 14,
        reversalAmount: 1,
      },
    });
  }, 3000);

  /* (4s) Point & Figure chart */
  setTimeout(() => {
    log('Setting chart type to: PointAndFigure');

    chart.setMarket('BINANCE:BTCEUR', {
      type: 'PointAndFigure',
      timeframe: 'D',
      inputs: {
        sources: 'Close',
        reversalAmount: 3,
        boxSize: 1,
        style: 'ATR',
        atrLength: 14,
        oneStepBackBuilding: false,
      },
    });
  }, 4000);

  /* (5s) Range chart */
  setTimeout(() => {
    log('Setting chart type to: Range');

    chart.setMarket('BINANCE:BTCEUR', {
      type: 'Range',
      timeframe: 'D',
      inputs: {
        range: 1,
        phantomBars: false,
      },
    });
  }, 5000);

  /* (6s) Delete chart, close client */
  setTimeout(async () => {
    success('Closing client...');
    chart.delete();
    await client.end();
    cb();
  }, 6000);
};
