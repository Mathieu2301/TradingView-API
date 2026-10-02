// Market search, indicator search and technical ratings.
// Run: npm run build && node examples/search.js
import { getTechnicalAnalysis, searchIndicators, searchMarkets } from '@mathieuc/tradingview';

const markets = await searchMarkets('BINANCE:BTC', { type: 'crypto' });
console.log('Markets:', markets.slice(0, 5).map((m) => `${m.id} (${m.description})`));

const indicators = await searchIndicators('RSI');
console.log('Indicators:', indicators.slice(0, 5).map((i) => `${i.id} - ${i.name} [${i.access}]`));

console.log('Daily ratings for', markets[0].id, (await getTechnicalAnalysis(markets[0].id))?.['1D']);
