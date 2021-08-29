const marketAPI = require('../main');

(async () => {
  const market = marketAPI();

  market.on('logged', async () => {
    console.log('API LOGGED');

    const searchBTC = (await market.search('bitcoin euro', 'crypto'))[0];
    console.log('Found Bitcoin / Euro:', searchBTC);
    market.subscribe(searchBTC.id);

    const btcTA = (await market.getTA(searchBTC.type, searchBTC.id));
    console.log('Technical Analysis for Bitcoin / Euro:', btcTA);
  });

  market.on('price', (data) => {
    console.log(data.symbol, '=>', data.price);
  });

  const searchETH = (await market.search('ethereum euro', 'crypto'))[0];
  console.log('Found Ethereum / Euro:', searchETH);

  setTimeout(() => {
    console.log('Subscribe to', searchETH.id);
    market.subscribe(searchETH.id);
  }, 10000);

  setTimeout(() => {
    console.log('Unsubscribe from', searchETH.id);
    market.unsubscribe(searchETH.id);
  }, 20000);
})();
