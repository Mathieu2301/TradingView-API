// Honest backtest of an RSI divergence + EMA trend filter strategy, with a random-entry baseline.
// The protocol lives in the library (@mathieuc/tradingview/backtest); this file only wires the options.
// Run: npm run build && node examples/honest-backtest/index.js [--symbol BINANCE:BTCUSDT] [--timeframe 240]
// Offline replay of a saved snapshot: node examples/honest-backtest/index.js --snapshot path/to/snapshot.json
// Every option: node examples/honest-backtest/index.js --help
// Research example only: it places no orders and says nothing about future returns.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import {
  backtest, defaultExits, formatReport, loadSnapshot, rsiDivergence, tradesToCsv,
} from '@mathieuc/tradingview/backtest';

const DEFAULTS = {
  symbol: 'BINANCE:BTCUSDT', timeframe: '240', minYears: 2, splitRatio: 0.7,
  pivotLookback: 5, minPivotDistance: 5, maxPivotDistance: 60, rsiLength: 14, emaLength: 200, atrLength: 14,
  fee: 0.001, slippage: 0.0005, stopPct: 0.02, atrStopMult: 1.5, atrTargetR: 2, trailAtrMult: 3, runs: 1000, seed: 42,
};
const numeric = Object.keys(DEFAULTS).filter((name) => typeof DEFAULTS[name] === 'number');
const { values: args } = parseArgs({
  options: {
    symbol: { type: 'string', default: DEFAULTS.symbol },
    timeframe: { type: 'string', default: DEFAULTS.timeframe },
    count: { type: 'string' },
    snapshot: { type: 'string' },
    out: { type: 'string', default: 'honest-backtest-output' },
    help: { type: 'boolean', default: false },
    ...Object.fromEntries(numeric.map((name) => [name, { type: 'string' }])),
  },
});

if (args.help) {
  console.log(`Options (defaults in brackets):
  --symbol [${DEFAULTS.symbol}]  --timeframe [${DEFAULTS.timeframe}]  --count [enough for --minYears after warm-up]
  --snapshot <file>  replay a saved snapshot instead of downloading candles
  --out [honest-backtest-output]  folder for snapshot.json, report.json and trades.csv
  ${numeric.map((name) => `--${name} [${DEFAULTS[name]}]`).join('  ')}`);
  process.exit(0);
}

const o = { ...DEFAULTS };
for (const name of numeric) {
  if (args[name] === undefined) continue;
  const value = Number(args[name]);
  if (!Number.isFinite(value)) throw new Error(`--${name} must be a number`);
  o[name] = value;
}

const outDir = resolve(args.out);
mkdirSync(outDir, { recursive: true });

const { report, snapshot } = await backtest({
  symbol: args.symbol,
  timeframe: args.timeframe,
  years: o.minYears,
  ...(args.count ? { count: Number(args.count) } : {}),
  ...(args.snapshot ? { snapshot: loadSnapshot(readFileSync(args.snapshot, 'utf8')) } : {}),
  signal: rsiDivergence(o),
  exits: defaultExits(o),
  fee: o.fee,
  slippage: o.slippage,
  splitRatio: o.splitRatio,
  runs: o.runs,
  seed: o.seed,
});

console.log(formatReport(report));

if (!args.snapshot) writeFileSync(join(outDir, 'snapshot.json'), JSON.stringify(snapshot));
writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
writeFileSync(join(outDir, 'trades.csv'), tradesToCsv(report.trades));
console.log(`\nWrote ${report.trades.length} trades to ${join(outDir, 'trades.csv')}, the report to report.json${args.snapshot ? '' : ' and the snapshot to snapshot.json'}.`);
