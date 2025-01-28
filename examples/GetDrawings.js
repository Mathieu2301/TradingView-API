const TradingView = require('../main');

/**
 * This example tests the getDrawings function
 */

// First parameter must be the layoutID
// If the layout is private:
// - Second parameter must be the userid (you can use getUser function)
// - You should provide your sessionid and signature cookies in .env file

if (!process.argv[2]) throw Error('Please specify a layoutID');

TradingView.getDrawings(process.argv[2], null, {
  session: process.env.SESSION,
  signature: process.env.SIGNATURE,
  id: process.argv[3],
}).then((drawings) => {
  console.log(`Found ${drawings.length} drawings:`, drawings.map((d) => ({
    id: d.id,
    symbol: d.symbol,
    type: d.type,
    text: d.state.text,
  })));
}).catch((err) => {
  console.error('Error:', err.message);
});
