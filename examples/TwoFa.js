const TradingView = require('../main');

/**
 * This example tests the user login function
 */

if (!process.argv[2]) throw Error('Please specify your username/email');
if (!process.argv[3]) throw Error('Please specify your password');

TradingView.twoFactorAuth(process.argv[2], process.argv[3], process.argv[4])
  .then((data) => {
    console.log(data);
  })
  .catch((err) => {
    console.error('Login error:', err.message);
  });
