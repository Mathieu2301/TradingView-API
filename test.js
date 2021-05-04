const stocksAPI = require('./main');

(async () => {
  const stocks = stocksAPI();

  stocks.on('logged', async () => {
    console.log('API LOGGED');

    const searchBTC = (await stocks.search('bitcoin euro', 'crypto'))[0];
    console.log('Found Bitcoin / Euro:', searchBTC);
    stocks.subscribe(searchBTC.id);

    const btcTA = (await stocks.getTA(searchBTC.type, searchBTC.id));
    console.log('Technical Analysis for Bitcoin / Euro:', btcTA);
  });

  stocks.on('price', (data) => {
    console.log(data.symbol, '=>', data.price);
  });

  const searchETH = (await stocks.search('ethereum euro', 'crypto'))[0];
  console.log('Found Ethereum / Euro:', searchETH);

  setTimeout(() => {
    console.log('Subscribe to', searchETH.id);
    stocks.subscribe(searchETH.id);
  }, 10000);

  setTimeout(() => {
    console.log('Unsubscribe from', searchETH.id);
    stocks.unsubscribe(searchETH.id);
  }, 20000);
})();
