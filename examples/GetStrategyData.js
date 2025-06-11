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
chart.setMarket('BYBIT:LINKUSDT.P', {
  timeframe: '60',
  range: 99999,
});

chart.onError((...err) => {
  console.log(err);
});

const mystrat = 'PUB;db3dda4d2c1f475bbc9240ff0a41116b';
const rsiStrategy = 'STD;RSI%1Strategy';
const rsiStudy = 'STD;RSI';
// NEED TO LOOK OUT FOR: mainSourceId
(async () => {
  const studID = await new Promise((resolve, reject) => {
    TradingView.getIndicator(rsiStudy).then((indic) => {
      const indicator = new chart.Study(indic);

      indicator.onError(() => reject(Error('error')));

      indicator.onUpdate(() => {
        // console.log(indicator.instance.inputs);
        // console.log('IDEEE', indicator.studID);
        // client.end();
        resolve(indicator.studID);
      });
    });
  });

  TradingView.getIndicator(mystrat).then((indic) => {
    const indicator = new chart.Study(indic);
    console.log(studID, indicator.studID);

    indicator.instance.inputs.in_1.value = 's1$0'; // saw this in real payload of tv
    console.log(indicator.instance.inputs.in_1);

    indicator.onUpdate(() => {
      const { strategyReport: { performance: { all } } } = indicator;
      console.log('Result: ', all.netProfitPercent);
      client.end();
    });
  });
})();
