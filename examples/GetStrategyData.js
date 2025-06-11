const TradingView = require('../main');

if (!process.env.SESSION || !process.env.SIGNATURE) {
  throw Error('Please set your sessionid and signature cookies');
}

const client = new TradingView.Client({
  server: 'prodata',
  token: process.env.SESSION,
  signature: process.env.SIGNATURE,
  // DEBUG: 'study',
});

const chart = new client.Session.Chart();
chart.setMarket('BYBIT:BTCUSDT.P', {
  timeframe: '60',
  range: 99999,
});

chart.onError((...err) => {
  console.log(err);
});

const mystrat = 'PUB;db3dda4d2c1f475bbc9240ff0a41116b';
// const mystrat = 'StrategyScript$USER;de623475265547e3acaf9ea5de52f4b1@tv-scripting-101[v.1.0]';
const rsiStrategy = 'STD;RSI%1Strategy';
const rsiStudy = 'STD;RSI';
// NEED TO LOOK OUT FOR: mainSourceId
(async () => {
  const studID = await new Promise((resolve, reject) => {
    TradingView.getIndicator(rsiStudy).then((indic) => {
      const indicator = new chart.Study(indic);

      indicator.onError(() => reject(Error('error')));

      indicator.onUpdate(() => {
        // client.end();
        resolve(indicator.studID);
      });
    });
  });
  console.log('STUDID', studID);

  TradingView.getIndicator(mystrat).then((indic) => {
    const indicator = new chart.Study(indic);
    indicator.instance.inputs.in_1.value = 's1_st1$0';

    // console.log('inputs', indicator.instance.inputs);

    indicator.onError((...err) => {
      console.log('Study error:', ...err);
    });

    indicator.onUpdate(() => {
      const { strategyReport: { performance: { all } } } = indicator;

      console.log('Result: ', all.netProfitPercent);

      client.end();
    });
  });
})();
