require('./envLoader');
const { getSentNotifs, addSentNotifs } = require('./sentNotifs');
const marketAPI = require('../../main');
const discordWH = require('./discordWH')(process.env.DISCORD_TOKEN);

const markets = [
  {
    symbol: 'EURUSD',
    period: '1D',
    settings: {
      1: 21, // HMA 1 Length
      3: 89, // HMA 2 Length
      5: 7, // RSI Length
      8: 2, // Stop Loss (%)
      9: 1, // Take Profit (%)
    },
  },
  {
    symbol: 'GBPUSD',
    period: '1D',
    settings: {
      1: 220, // HMA 1 Length
      3: 150, // HMA 2 Length
      5: 1, // RSI Length
      8: 2, // Stop Loss (%)
      9: 1, // Take Profit (%)
    },
  },
  {
    symbol: 'USDCAD',
    period: '1D',
    settings: {
      1: 21, // HMA 1 Length
      3: 89, // HMA 2 Length
      5: 10, // RSI Length
      8: 3, // Stop Loss (%)
      9: 2, // Take Profit (%)
    },
  },
];

const market = marketAPI(false);

market.on('logged', () => {
  markets.forEach((mrk) => {
    console.log('Listen', mrk.symbol);

    market.initChart({
      symbol: mrk.symbol,
      period: mrk.period || '1D',
      range: mrk.range || 30,
      timezone: mrk.timezone || 'Europe/Paris',
      indicators: [
        // My Magimix Indicator
        {
          name: 'MAGIMIX',
          id: 'USER;d90a5e852ddc439b994db6beff14d702',
          version: mrk.version || 'last',
          settings: mrk.settings || [],
        },
      ],
    }, ({ 0: p }) => {
      if (!p.MAGIMIX) return;

      const signalType = p.MAGIMIX.Longsignal ? 'LONG' : 'SHORT';
      const notifID = `${mrk.symbol}@MAGIMIX@${p.$time}@${signalType}`;

      if (
        (p.MAGIMIX.Longsignal || p.MAGIMIX.Shortsignal)
        && !getSentNotifs().includes(notifID)
      ) {
        addSentNotifs(notifID);
        console.log(mrk.symbol, 'SIGNAL', new Date(p.$time * 1000).toLocaleString());

        discordWH({
          content: process.env.DISCORD_MENTION,
          embeds: [
            {
              title: `Magimix ${signalType} signal for ${mrk.symbol} !`,
              color: p.MAGIMIX.Longsignal ? 3066993 : 15158332,
              description: `Magimix ${signalType} signal for ${mrk.symbol} at ${p.$prices.close} !`,
              url: `https://fr.tradingview.com/chart/?symbol=${mrk.symbol}`,
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
