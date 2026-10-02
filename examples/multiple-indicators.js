// Several indicators in parallel over one shared connection.
// Run: npm run build && node --env-file=.env examples/multiple-indicators.js
import { getIndicatorData, TradingViewClient } from '@mathieuc/tradingview';

if (!process.env.SESSION || !process.env.SIGNATURE) throw new Error('Please set your SESSION and SIGNATURE cookies');
const credentials = { session: process.env.SESSION, signature: process.env.SIGNATURE };

const client = new TradingViewClient({ credentials });
try {
  const results = await Promise.all(['STD;RSI', 'STD;MACD', 'STD;Bollinger_Bands'].map((indicator) => (
    getIndicatorData({ symbol: 'BINANCE:DOTUSDT', indicator, client, credentials })
  )));
  for (const { indicator, values } of results) console.log(indicator.description, values.at(-1));
} finally {
  await client.close();
}
