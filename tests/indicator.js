const marketAPI = require('../main');

const market = marketAPI(false);

market.on('logged', () => {
  market.initChart({
    symbol: 'COINBASE:BTCEUR',
    period: '240',
    range: 50,
    indicators: [
      { name: 'ACCU_DISTRIB', id: 'STD;Accumulation_Distribution', version: '25' },
      { name: 'CIPHER_A', id: 'PUB;vrOJcNRPULteowIsuP6iHn3GIxBJdXwT', version: '1.0' },
      {
        name: 'CIPHER_B',
        id: 'PUB;uA35GeckoTA2EfgI63SD2WCSmca4njxp',
        settings: [ // Activate Stoch divergences
          true, true, true, true, true, true, 9, 12,
          'hlc3', 3, 53, 60, 100, -53, -60, -75, true,
          true, true, 45, -65, true, 15, -40, true, 60,
          150, 2.5, false, 'close', 14, 30, 60, false,
          false, 60, 30, true, true, false, 'close', 14,
          14, 3, 3, true, true, false, 'close', 10, 23,
          50, 0.5, false, false, '720', 0, 0, 0, 0, 0, 0,
          false, '60', '240', 0, 0, false, '240', false,
        ],
        version: '15.0',
      },
      // Color Changing Moving Average
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
