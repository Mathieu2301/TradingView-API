// Run: npm run build && node --env-file=.env examples/strategy-report.js
// Computes a public Pine strategy; does not place orders or export the TradingView UI.
import { getIndicatorData, summarizeStrategyReport } from '@mathieuc/tradingview';

if (!process.env.SESSION || !process.env.SIGNATURE) {
  console.error('Set SESSION and SIGNATURE in your environment (see .env.sample).');
  process.exitCode = 1;
} else {
  try {
    const { strategyReport } = await getIndicatorData({
      symbol: 'BINANCE:BTCEUR',
      timeframe: '60',
      count: 300,
      indicator: 'STD;Supertrend%Strategy',
      inputs: { commission_type: 'percent', default_qty_value: 20 },
      credentials: { session: process.env.SESSION, signature: process.env.SIGNATURE },
      timeoutMs: 30_000,
      signal: AbortSignal.timeout(45_000),
    });
    if (!strategyReport.performance.all) throw new Error('No strategy performance received');
    // Missing aggregates remain undefined, not zero. totalPnL requires both components.
    console.log('Summary:', summarizeStrategyReport(strategyReport));
    // Most recent first. An exit valuation alone does NOT prove that a trade is closed.
    console.log('Latest trade records:', strategyReport.trades.slice(0, 5));
    console.log('Available history:', Object.keys(strategyReport.history));
  } catch (error) {
    console.error(error.code ?? 'STRATEGY_ERROR', error.message);
    process.exitCode = 1;
  }
}
