require('./envLoader');
const { getSentNotifs, addSentNotifs } = require('./sentNotifs');
const marketAPI = require('../../main');
const discordWH = require('./discordWH')(process.env.DISCORD_TOKEN);

if (!process.env.SYMBOLS) process.env.SYMBOLS = 'BTCEUR';
if (!process.env.PERIOD) process.env.PERIOD = '240';

const market = marketAPI(false);

market.on('logged', () => {
  process.env.SYMBOLS.split(',').forEach((symbol) => {
    console.log('Listen', symbol);

    market.initChart({
      symbol,
      period: process.env.PERIOD,
      range: 30,
      timezone: 'Europe/Paris',
      indicators: [
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
      ],
    }, (periods) => {
      if (!periods[0].CIPHER_B) return;

      const pBefore = periods[1];
      const p = periods[0];

      const gapBefore = pBefore.CIPHER_B.VWAP;
      const gap = p.CIPHER_B.VWAP;

      const notifID = `${symbol}@${p.$time}@BULL_TRIGGER`;

      if (
        p.CIPHER_B.WTWave1 <= 0 && p.CIPHER_B.WTWave1 > -35
        && gapBefore < 0 && gapBefore < gap
        && pBefore.CIPHER_B.WTWave1 < p.CIPHER_B.WTWave1
        && !getSentNotifs().includes(notifID)
      ) {
        addSentNotifs(notifID);
        console.log(symbol, 'TRIG NOW', new Date(p.$time * 1000).toLocaleString());

        discordWH({
          content: process.env.DISCORD_MENTION,
          embeds: [
            {
              title: `Trigger wave on ${symbol} !`,
              color: 720640,
              description: `Cipher B trigger wave detected on ${symbol}.`,
              url: `https://fr.tradingview.com/chart/?symbol=${symbol}`,
              timestamp: new Date(p.$time * 1000),
              footer: {
                text: 'TradingView',
                icon_url: 'https://tradingview.com/favicon.ico',
              },
            },
          ],
        });
      }
    });
  });
});
