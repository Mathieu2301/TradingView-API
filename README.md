# Tradingview API
Get realtime stocks from Tradingview

___
## Installation

```
npm i @mathieuc/tradingview
```

## Example (test.js)

```javascript
const stocksAPI = require('tradingview');

(async () => {
  const stocks = stocksAPI();

  stocks.on('logged', async () => {
    console.log('API LOGGED');

    const searchBTC = (await stocks.search('bitcoin euro', 'crypto'))[0];
    console.log('Found Bitcoin / Euro:', searchBTC);
    stocks.subscribe(searchBTC.id);
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
```

___
## Problems

 If you have errors in console or unwanted behavior, just reload the page.
 If the problem persists, please create an issue [here](https://github.com/Mathieu2301/Tradingview-API/issues).
