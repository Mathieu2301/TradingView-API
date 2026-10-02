// Every error is a TradingViewError with a `code`.
// Run: npm run build && node --env-file=.env examples/errors.js
import {
  getCandles, getIndicator, getIndicatorData, TradingViewClient, TradingViewError,
} from '@mathieuc/tradingview';

const credentials = process.env.SESSION
  ? { session: process.env.SESSION, signature: process.env.SIGNATURE }
  : undefined;

async function show(title, run) {
  try {
    await run();
    console.log(`${title}: no error`);
  } catch (error) {
    if (!(error instanceof TradingViewError)) throw error;
    console.log(`${title}: [${error.code}] ${error.message}`);
  }
}

await show('Wrong credentials', () => new TradingViewClient({ credentials: { session: 'FAKE' } }).ready);
await show('Invalid symbol', () => getCandles('XXXXX'));
await show('Invalid timeframe', () => getCandles({ symbol: 'BINANCE:BTCEUR', timeframe: 'XX' }));
await show('Premium chart type without account', () => getCandles({ symbol: 'BINANCE:BTCEUR', timeframe: '15', chartType: 'Renko' }));
await show('Inexistent indicator', () => getIndicator('STD;XXXXXXX'));
await show('Timeout', () => getCandles({ symbol: 'BINANCE:BTCEUR', timeoutMs: 1 }));

// Low-level sessions report errors through their `error` event.
const client = new TradingViewClient();
const chart = client.createChart();
await show('Invalid timezone', () => new Promise((resolve, reject) => {
  chart.on('error', reject);
  chart.setMarket('BINANCE:BTCEUR');
  chart.setTimezone('Nowhere/Nowhere');
  setTimeout(resolve, 5_000);
}));
await show('Timeframe before market', async () => client.createChart().setTimeframe('15'));
await client.close();

if (credentials) {
  const supertrend = await getIndicator('STD;Supertrend');
  supertrend.setInput('Factor', -1);
  await show('Invalid study input', () => getIndicatorData({ symbol: 'BINANCE:BTCEUR', indicator: supertrend, credentials }));
}
