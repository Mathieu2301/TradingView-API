const TradingView = require('../main');

/*
  This example tests the
  getDrawings function
*/

// First parameter must be the layoutID
// (if the layout is private) Second parameter must be the sessionid cookie
// (if the layout is private) Third parameter must be the userid (you can use getUser function)

if (!process.argv[2]) throw Error('Please specify a layoutID');

TradingView.getDrawings(process.argv[2], null, {
  session: process.argv[3],
  id: process.argv[4],
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
