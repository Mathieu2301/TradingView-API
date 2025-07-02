const TradingView = require('../main');

/**
 * This example tests the user login function
 */

if (!process.env.SESSION || !process.env.SIGNATURE) throw Error('Please set your sessionid and signature cookies');

// TradingView.getUser('process.env.SESSION', 'process.env.SIGNATURE').then((data) => {
TradingView.getUser(process.env.SESSION, process.env.SIGNATURE).then((data) => {
  console.log(data);
}).catch((err) => {
  console.error('Login error:', err.message);
});
