const TradingView = require('../main');

/**
 * This example tests the user login function
 */

if (!process.argv[2]) throw Error('Please specify your session');
if (!process.argv[3]) throw Error('Please specify your signature');

TradingView.getUser(process.argv[2], process.argv[3]).then((data) => {
  console.log(data);
}).catch((err) => {
  console.error('Login error:', err.message);
});
