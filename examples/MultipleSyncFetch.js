const TradingView = require('../main');

/**
 * This examples synchronously fetches data from 3 indicators
 */

const client = new TradingView.Client();
const chart = new client.Session.Chart();
chart.setMarket('BINANCE:DOTUSDT');

function getIndicData(indicator) {
  return new Promise((res) => {
    const STD = new chart.Study(indicator);

    console.log(`Getting "${indicator.description}"...`);

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
