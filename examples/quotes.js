// Quotes with the high-level data API.
// Run: npm run build && node examples/quotes.js
import { getQuote, getQuotes, watchQuotes } from '@mathieuc/tradingview/data';

const btc = await getQuote('BINANCE:BTCUSDT');
console.log('BTC/USDT', btc.lp, `${btc.chp}%`);

const prices = await getQuotes({ symbols: ['NASDAQ:AAPL', 'NASDAQ:MSFT', 'FX:EURUSD'], fields: 'price' });
for (const [symbol, quote] of Object.entries(prices)) console.log(symbol, quote.lp);

const watcher = await watchQuotes({ symbols: ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT'], fields: ['lp', 'chp'] }, {
  onData: (symbol, quote) => console.log(symbol, quote.lp),
  onError: (error) => console.error(error.message),
});
setTimeout(() => watcher.stop(), 15_000);
