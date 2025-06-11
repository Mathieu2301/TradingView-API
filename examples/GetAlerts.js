const TradingView = require('../main');

/**
 * This example tests the getDrawings function
 */

if (!process.env.SESSION || !process.env.SIGNATURE) {
  throw Error('Please set your sessionid and signature cookies');
}

// First parameter must be the layoutID
// If the layout is private:
// - Second parameter must be the userid (you can use getUser function)
// - You should provide your sessionid and signature cookies in .env file

TradingView.getAlerts(process.env.SESSION, process.env.SIGNATURE).then((alerts) => {
  console.log(alerts);
}).catch((err) => {
  console.error('Error:', err.message);
});

// TradingView.getFiredAlerts({ limit: 50, symbol: 'BYBIT:BTCUSDT.P' }, process.argv[2], process.argv[3]).then((alerts) => {
//   console.log(alerts);
// }).catch((err) => {
//   console.error('Error:', err.message);
// });

// const alertsToModify = [123124, 125123];
// TradingView.modifyAlerts(alertsToModify, 'start', process.argv[2], process.argv[3]).then((alerts) => {
//   console.log(alerts);
// }).catch((err) => {
//   console.error('Error:', err.message);
// });
