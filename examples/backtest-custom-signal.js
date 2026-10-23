// Backtest your own entry rule: write the signal, the library applies the whole protocol
// (no look-ahead check, costs, IS/OOS split, four exits, random-entry baseline).
// Run: npm run build && node examples/backtest-custom-signal.js
// Research example only: it places no orders and says nothing about future returns.
import { writeFileSync } from 'node:fs';
import {
  backtest, ema, formatReport, tradesToCsv,
} from '@mathieuc/tradingview/backtest';

// Decided at the close of bar i with bars 0..i only; the engine enters at the next open.
function emaCross(candles) {
  const closes = candles.map((c) => c.close);
  const fast = ema(closes, 20);
  const slow = ema(closes, 50);
  const signals = [];
  for (let i = 50; i < candles.length; i++) {
    if (fast[i - 1] <= slow[i - 1] && fast[i] > slow[i]) signals.push({ bar: i, direction: 'long' });
    if (fast[i - 1] >= slow[i - 1] && fast[i] < slow[i]) signals.push({ bar: i, direction: 'short' });
  }
  return signals;
}
emaCross.warmupBars = 49;
emaCross.label = 'EMA(20) / EMA(50) cross';

const { report } = await backtest({ symbol: 'BINANCE:ETHUSDT', timeframe: '240', years: 2, signal: emaCross });
console.log(formatReport(report));
writeFileSync('ema-cross-trades.csv', tradesToCsv(report.trades));
