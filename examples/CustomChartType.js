const TradingView = require('../main');

/**
 * This example creates charts of custom types such as 'HeikinAshi', 'Renko',
 * 'LineBreak', 'Kagi', 'PointAndFigure', and 'Range' with default settings.
 */

const client = new TradingView.Client({
  /*
    Token and signature are only required if you want to use
    intraday timeframes (if you have a paid TradingView account)
  */
  token: process.env.SESSION,
  signature: process.env.SIGNATURE,
});

const chart = new client.Session.Chart();

chart.onError((...err) => {
  console.log('Chart error:', ...err);
  process.exit(1);
});

chart.onUpdate(() => {
  if (!chart.periods[0]) return;
  console.log('Last period', chart.periods[0]);
});

/* (0s) Heikin Ashi chart */
setTimeout(() => {
  console.log('\nSetting chart type to: HeikinAshi');

  chart.setMarket('BINANCE:BTCEUR', {
    type: 'HeikinAshi',
    timeframe: 'D',
  });
}, 0);

/* (5s) Renko chart */
setTimeout(() => {
  console.log('\nSetting chart type to: Renko');

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
}, 5000);

/* (10s) Line Break chart */
setTimeout(() => {
  console.log('\nSetting chart type to: LineBreak');

  chart.setMarket('BINANCE:BTCEUR', {
    type: 'LineBreak',
    timeframe: 'D',
    inputs: {
      source: 'close',
      lb: 3,
    },
  });
}, 10000);

/* (15s) Kagi chart */
setTimeout(() => {
  console.log('\nSetting chart type to: Kagi');

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
}, 15000);

/* (20s) Point & Figure chart */
setTimeout(() => {
  console.log('\nSetting chart type to: PointAndFigure');

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
}, 20000);

/* (25s) Range chart */
setTimeout(() => {
  console.log('\nSetting chart type to: Range');

  chart.setMarket('BINANCE:BTCEUR', {
    type: 'Range',
    timeframe: 'D',
    inputs: {
      range: 1,
      phantomBars: false,
    },
  });
}, 25000);

/* (30s) Delete chart, close client */
setTimeout(() => {
  console.log('\nClosing client...');
  client.end();
}, 30000);
