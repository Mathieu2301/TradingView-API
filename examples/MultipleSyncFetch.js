const TradingView = require('../main');

/**
 * This examples synchronously fetches data from 3 indicators
 */

if (!process.env.SESSION || !process.env.SIGNATURE) {
  throw Error('Please set your sessionid and signature cookies');
}

const client = new TradingView.Client({
  token: process.env.SESSION,
  signature: process.env.SIGNATURE,
});

function getIndicData(indicator) {
  const chart = new client.Session.Chart();
  chart.setMarket('BINANCE:DOTUSDT');
  const STD = new chart.Study(indicator);

  console.log(`Getting "${indicator.description}"...`);

  return new Promise((res) => {
    STD.onUpdate(() => {
      res(STD.periods);
      console.log(`"${indicator.description}" done !`);
    });
  });
}

(async () => {
  console.log('Getting all indicators...');

  const indicData = await Promise.all([
    await TradingView.getIndicator('PUB;3lEKXjKWycY5fFZRYYujEy8fxzRRUyF3'),
    await TradingView.getIndicator('PUB;5nawr3gCESvSHQfOhrLPqQqT4zM23w3X'),
    await TradingView.getIndicator('PUB;vrOJcNRPULteowIsuP6iHn3GIxBJdXwT'),
  ].map(getIndicData));

  console.log(indicData);
  console.log('All done !');

  client.end();
})();
