// Low-level quote session: several symbols sharing one subscription list.
// Run: npm run build && node examples/quote-session.js
import { TradingViewClient } from '@mathieuc/tradingview';

const client = new TradingViewClient();
const quotes = client.createQuoteSession({ fields: ['lp', 'ch', 'chp', 'volume'] });

for (const symbol of ['BINANCE:BTCEUR', 'BINANCE:ETHEUR']) {
  const subscription = quotes.subscribe(symbol);
  subscription.on('data', (quote, changes) => console.log(symbol, changes));
  subscription.on('error', (error) => console.error(symbol, error.message));
}

setTimeout(async () => {
  quotes.delete();
  await client.close();
}, 10_000);
