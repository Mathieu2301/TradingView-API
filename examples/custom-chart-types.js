// Custom bar types: Heikin Ashi, Renko, Line Break, Kagi, Point & Figure and Range.
// Run: npm run build && node examples/custom-chart-types.js
import { getCandles } from '@mathieuc/tradingview/data';

const types = {
  HeikinAshi: {},
  Renko: { source: 'close', sources: 'Close', boxSize: 3, style: 'ATR', atrLength: 14, wicks: true },
  LineBreak: { source: 'close', lb: 3 },
  Kagi: { source: 'close', style: 'ATR', atrLength: 14, reversalAmount: 1 },
  PointAndFigure: { sources: 'Close', reversalAmount: 3, boxSize: 1, style: 'ATR', atrLength: 14, oneStepBackBuilding: false },
  Range: { range: 1, phantomBars: false },
};

for (const [chartType, chartInputs] of Object.entries(types)) {
  const candles = await getCandles({ symbol: 'BINANCE:BTCEUR', timeframe: 'D', count: 50, chartType, chartInputs });
  console.log(chartType.padEnd(15), `${candles.length} bars, last close ${candles.at(-1)?.close}`);
}
