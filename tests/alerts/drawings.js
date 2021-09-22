require('./envLoader');
const marketAPI = require('../../main');

if (!process.env.LAYOUT_ID) console.error('You need to set a layout id');

const market = marketAPI(false);

console.log('Connecting...');

(async () => {
  /*
  * Important ! If you want to get a layout without login, you have to
  * set it in public mode. If you get an error, please wait few minutes.
  * Try getting to https://www.tradingview.com/chart/LAYOUT_ID/ in incognito mode.
  */
  const user = (process.env.SESSION_ID) ? await market.getUser(process.env.SESSION_ID) : {};
  console.log('Connected as', user.firstName || user.username || 'anonymous', '!');

  console.log(`Gettings drawings of '${process.env.LAYOUT_ID}' layout...`);

  const drawings = await market.getDrawings(process.env.LAYOUT_ID, '', {
    id: user.id,
    session: user.session,
  });

  const lines = drawings.filter((d) => (
    ['LineToolHorzLine', 'LineToolRay', 'LineToolTrendLine', 'LineToolHorzRay'].includes(d.type)
    && d.state.linestyle === 0
    && d.state.linewidth === 4
  ));

  console.log(
    `Found ${drawings.length} result(s) including ${lines.length} thick line(s):`,
    lines.map((l) => ({
      market: l.symbol,
      type: l.type,
      points: l.points,
      text: l.state.text,
    })),
  );
})();
