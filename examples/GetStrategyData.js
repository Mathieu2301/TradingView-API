const TradingView = require('../main');

if (!process.env.SESSION || !process.env.SIGNATURE) {
  throw Error('Please set your sessionid and signature cookies');
}

const client = new TradingView.Client({
  server: 'prodata',
  token: process.env.SESSION,
  signature: process.env.SIGNATURE,
  // DEBUG: true,
});

const chart = new client.Session.Chart();
chart.setMarket('BYBIT:LINKUSDT.P', {
  timeframe: '60',
  range: 99999,
});

chart.onError((...err) => {
  console.log(err);
});

// Chart: https://www.tradingview.com/chart/iLrw9UNL/
const mystratId = 'PUB;db3dda4d2c1f475bbc9240ff0a41116b';
// const rsiStrategyId = 'STD;RSI%1Strategy';
const rsiStudyId = 'STD;RSI';

(async () => {
  const indicators = {
    rsiStudy: await TradingView.getIndicator(rsiStudyId),
    myStrategy: await TradingView.getIndicator(mystratId),
  };

  indicators.rsiStudy.setOption('RSI_Length', 9);
  const study = new chart.Study(indicators.rsiStudy);

  indicators.myStrategy.setOption('Enter_Short_after_crossing', `${study.studID}$0`); // important to be before next line
  const myStrategy = new chart.Study(indicators.myStrategy);
  console.log(myStrategy.studID);

  myStrategy.onUpdate(() => {
    const { strategyReport: { performance: { all } } } = myStrategy;
    console.log('Result: ', all);
    client.end();
  });
})();
