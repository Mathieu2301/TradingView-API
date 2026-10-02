// Indicators that draw labels, lines, boxes, tables, polygons...
// Run: npm run build && node --env-file=.env examples/graphic-indicator.js
import { getIndicatorData } from '@mathieuc/tradingview/data';

if (!process.env.SESSION || !process.env.SIGNATURE) throw new Error('Please set your SESSION and SIGNATURE cookies');

const { indicator, graphics } = await getIndicatorData({
  symbol: 'BINANCE:BTCEUR',
  timeframe: '5',
  count: 1_000,
  indicator: 'STD;Zig_Zag',
  credentials: { session: process.env.SESSION, signature: process.env.SIGNATURE },
});

console.log(`'${indicator.description}' graphics:`);
console.log('Lines:', graphics.lines.slice(0, 5)); // x positions are bars back from the latest bar
console.log('Labels:', graphics.labels.slice(0, 5));
console.log('Tables:', graphics.tables.map((t) => t.cells.map((row) => row.map((cell) => cell.text))));
