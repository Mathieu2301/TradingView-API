const marketAPI = require('../main');

const market = marketAPI(false);

market.on('logged', async () => {
  const indicators = (await market.searchIndicator('strategy'))
    .filter((st) => (st.type === 'strategy' && st.access !== 'invite_only'))
    .map((st) => ({
      name: st.name,
      id: st.id,
      version: st.version,
      settings: {
        commission_type: 'percent',
        commission_value: 0,
        initial_capital: 25000,
        default_qty_value: 20,
        default_qty_type: 'percent_of_equity',
        currency: 'EUR',
        pyramiding: 10,
      },
    }));

  let total = indicators.length;
  console.log('Found', indicators.length, 'strategies');

  market.initChart({
    symbol: 'COINBASE:BTCEUR',
    period: '1D',
    range: 0,
    indicators,
  }, (_, strategies) => {
    const loaded = Object.keys(strategies).length;
    console.log(`Loading... ${loaded}/${total}`);

    if (loaded < total) return;
    market.end();

    console.log(
      'Best strategies:',
      Object.keys(strategies).map((stName) => ({
        n: stName,
        p: Math.round(strategies[stName].performance.all.netProfitPercent * 1000) / 1000,
      })).sort((a, b) => b.p - a.p),
    );
  });

  market.on('error', (...data) => {
    if (data[1].type === 'study_error') {
      console.error('Error with study:', indicators[data[1].data]);
      total -= 1;
      return;
    }

    console.error(...data);
  });
});
