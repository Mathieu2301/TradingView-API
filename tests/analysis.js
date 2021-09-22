const marketAPI = require('../main');

(async () => {
  const market = marketAPI(false);

  const searchBTC = (await market.search('bitcoin euro', 'crypto'))[0];
  console.log('Found Bitcoin / Euro:', searchBTC);

  const TA = await searchBTC.getTA();
  console.log('Full technical analysis for Bitcoin:', TA);

  // You can also use this way: await market.getTA('crypto', 'BINANCE:BTCEUR');
})();
