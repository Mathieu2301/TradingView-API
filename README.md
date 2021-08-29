# Tradingview API
Get realtime market from Tradingview

___
## Installation

```
npm i @mathieuc/tradingview
```

## Examples (./tests/)

```javascript
/*
  ./tests/prices.js
  Search for Bitcoin and Ethereum and get real time prices
*/

const marketAPI = require('tradingview');

(async () => {
  const market = marketAPI();

  market.on('logged', async () => {
    console.log('API LOGGED');

    const searchBTC = (await market.search('bitcoin euro', 'crypto'))[0];
    console.log('Found Bitcoin / Euro:', searchBTC);
    market.subscribe(searchBTC.id);
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
```

```javascript
/*
  ./tests/analysis.js
  Search for Bitcoin and get the Technical Analysis in all timeframes
*/

const marketAPI = require('tradingview');

const market = marketAPI();

market.on('logged', async () => {
  const searchBTC = (await market.search('bitcoin euro', 'crypto'))[0];
  console.log('Found Bitcoin / Euro:', searchBTC);

  const TA = await searchBTC.getTA();
  console.log('Full technical analysis for Bitcoin:', TA);

  // You can also use this way: await market.getTA('crypto', 'BINANCE:BTCEUR');
});
```

```javascript
/*
  ./tests/indicator.js
  Get indicator values
*/

const marketAPI = require('tradingview');

const market = marketAPI(false); // 'false' for chart-only mode

market.on('logged', () => {
  market.initChart({
    symbol: 'COINBASE:BTCEUR',
    period: '240',
    range: 50,
    indicators: [
      { name: 'ACCU_DISTRIB', id: 'STD;Accumulation_Distribution', version: '25' },
      { name: 'CIPHER_A', id: 'PUB;vrOJcNRPULteowIsuP6iHn3GIxBJdXwT', version: '1.0' },
      { name: 'CIPHER_B', id: 'PUB;uA35GeckoTA2EfgI63SD2WCSmca4njxp', version: '15.0' },
      // Color Changing moving average
      { name: 'CCMA', id: 'PUB;5nawr3gCESvSHQfOhrLPqQqT4zM23w3X', version: '6.0' },
    ],
  }, (periods) => {
    if (!periods[0].CIPHER_B) return;
    if (!periods[0].CCMA) return;

    console.log('Last period:', {
      price: periods[0].$prices.close,
      moneyFlow: (periods[0].CIPHER_B.RSIMFIArea >= 0) ? 'POSITIVE' : 'NEGATIVE',
      VWAP: periods[0].CIPHER_B.VWAP,
      MA: (periods[0].CCMA.Plot <= periods[0].$prices.close) ? 'ABOVE' : 'UNDER',
    });
  });
});
```
___
## Problems
 If you have errors in console or unwanted behavior,
 please create an issue [here](https://github.com/Mathieu2301/Tradingview-API/issues).
