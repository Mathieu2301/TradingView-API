// Honest backtest of an RSI divergence + EMA trend filter strategy, with a random-entry baseline.
// Run: npm run build && node examples/honest-backtest/index.js [--symbol BINANCE:BTCUSDT] [--timeframe 240]
// Offline replay of a saved snapshot: node examples/honest-backtest/index.js --snapshot path/to/snapshot.json
// Every option: node examples/honest-backtest/index.js --help
// Research example only: it places no orders and says nothing about future returns.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { getCandles, timeframeSeconds } from '@mathieuc/tradingview';
import {
  DEFAULTS, freezeSnapshot, formatTable, isoTime, runBacktest, tradesToCsv,
} from './engine.js';

const numeric = ['minYears', 'splitRatio', 'pivotLookback', 'minPivotDistance', 'maxPivotDistance', 'rsiLength',
  'emaLength', 'atrLength', 'fee', 'slippage', 'stopPct', 'atrStopMult', 'atrTargetR', 'trailAtrMult', 'runs', 'seed'];
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
  --out [honest-backtest-output]  folder for snapshot.json and trades.csv
  ${numeric.map((name) => `--${name} [${DEFAULTS[name]}]`).join('  ')}`);
  process.exit(0);
}

const options = { ...DEFAULTS, symbol: args.symbol, timeframe: args.timeframe };
for (const name of numeric) {
  if (args[name] === undefined) continue;
  const value = Number(args[name]);
  if (!Number.isFinite(value)) throw new Error(`--${name} must be a number`);
  options[name] = value;
}

const pct = (value) => `${(value * 100).toFixed(2)}%`;
const outDir = resolve(args.out);
mkdirSync(outDir, { recursive: true });

// 1. Freeze the snapshot once. Everything below reads this frozen copy only.
let snapshot;
let droppedFormingBar;
if (args.snapshot) {
  const saved = JSON.parse(readFileSync(args.snapshot, 'utf8'));
  snapshot = freezeSnapshot(saved.candles, { ...saved, now: saved.lastTime + saved.barSeconds });
  if (snapshot.sha256 !== saved.sha256) throw new Error('Snapshot checksum mismatch');
  Object.assign(options, { symbol: snapshot.symbol, timeframe: snapshot.timeframe });
  droppedFormingBar = saved.droppedFormingBar; // As recorded when the snapshot was captured
} else {
  const barSeconds = timeframeSeconds(options.timeframe);
  if (!barSeconds) throw new Error(`Unsupported timeframe for this example: ${options.timeframe}`);
  const warmup = Math.max(options.rsiLength, options.emaLength, options.atrLength);
  const wanted = Math.ceil((options.minYears * 365.25 * 86_400) / barSeconds) + warmup + 1;
  const count = args.count ? Number(args.count) : wanted;
  const candles = await getCandles({ symbol: options.symbol, timeframe: options.timeframe, count, timeoutMs: 120_000 });
  snapshot = freezeSnapshot(candles, { symbol: options.symbol, timeframe: options.timeframe, barSeconds });
  droppedFormingBar = snapshot.droppedFormingBar;
  writeFileSync(join(outDir, 'snapshot.json'), JSON.stringify(snapshot));
}

console.log('== Snapshot (frozen once, reused for every run) ==');
console.log(`${snapshot.symbol} ${snapshot.timeframe}: ${snapshot.count} closed bars, ${isoTime(snapshot.firstTime)} -> ${isoTime(snapshot.lastTime)} (bar open times, UTC)`);
console.log(`Forming bar dropped: ${droppedFormingBar ? 'yes' : 'no'}. sha256 ${snapshot.sha256.slice(0, 16)}`);
const missing = snapshot.gaps.reduce((sum, gap) => sum + gap.missingBars, 0);
console.log(`Gaps: ${snapshot.gaps.length} (${missing} missing bars)${snapshot.gaps.slice(0, 5).map((g) => `\n  ${isoTime(g.afterTime)} -> ${isoTime(g.beforeTime)} (${g.missingBars} bars)`).join('')}`);

const report = runBacktest(snapshot, options);
const { inSample, outOfSample } = report.segments;
const tradableYears = ((snapshot.count - report.warmupBars) * snapshot.barSeconds) / (365.25 * 86_400);
console.log(tradableYears >= options.minYears
  ? `History: ${tradableYears.toFixed(2)} years tradable after warm-up (>= ${options.minYears} wanted).`
  : `WARNING: only ${tradableYears.toFixed(2)} years tradable after warm-up; ${options.minYears} wanted. The server returned less history. Results are even less conclusive.`);

// 2. Chronological split.
const range = (s) => `${isoTime(snapshot.candles[s.start].time)} -> ${isoTime(snapshot.candles[s.end - 1].time)} (${s.end - s.start} bars)`;
console.log('\n== Split (chronological, no position crosses it) ==');
console.log(`Warm-up:       ${isoTime(snapshot.firstTime)} -> ${isoTime(snapshot.candles[report.warmupBars - 1].time)} (${report.warmupBars} bars, indicators only, never traded)`);
console.log(`In-sample:     ${range(inSample)}`);
console.log(`Out-of-sample: ${range(outOfSample)}`);

// 3. Signals.
const inside = (s, seg) => s.signalBar >= seg.start && s.entryBar < seg.end;
const count = (seg) => {
  const list = report.signals.filter((s) => inside(s, seg));
  return `${list.length} (${list.filter((s) => s.direction === 'long').length} long, ${list.filter((s) => s.direction === 'short').length} short)`;
};
console.log('\n== Signals: RSI divergence + EMA trend filter ==');
console.log(`Pivot lookback ${options.pivotLookback}: a pivot is confirmed ${options.pivotLookback} bars later; signal at that bar's close, entry at the NEXT bar's open.`);
console.log(`RSI ${options.rsiLength}, EMA ${options.emaLength}, pivots ${options.minPivotDistance}-${options.maxPivotDistance} bars apart. IS signals: ${count(inSample)}. OOS signals: ${count(outOfSample)}.`);
console.log(`Costs per side: fee ${pct(options.fee)}, adverse slippage ${pct(options.slippage)}. Sizing: 100% of equity, no leverage, one position at a time.`);
console.log('Same-bar stop and target: counted as a stop. Gap through a level: filled at the open.');

console.log(`\n== Results (random baseline: ${options.runs} seeded runs per row, seed ${options.seed}) ==`);
console.log(formatTable(report.rows));
for (const row of report.rows) {
  if (row.baseline && row.baseline.matchedRuns < row.baseline.runs) {
    console.log(`Note: ${row.exit} ${row.split}: ${row.baseline.matchedRuns}/${row.baseline.runs} random runs reached ${row.metrics.trades} trades (mean ${row.baseline.meanTrades.toFixed(1)}).`);
  }
}
console.log(`Exits: ${[...new Set(report.rows.map((r) => `${r.exit} = ${r.exitLabel}`))].join('; ')}.`);
console.log('Net: compounded net return. Win: share of trades with a positive net return. PF: gross profit / gross loss (N/A without a losing trade).');
console.log('MaxDD: largest peak-to-trough equity fall, marked to market at bar closes. Pctl: 100 x share of random runs with a strictly lower net return.');
const fewest = Math.min(...report.rows.map((r) => r.metrics.trades));
if (fewest < 30) console.log(`WARNING: as few as ${fewest} trades in a row. With so few trades, net return and percentile are mostly noise.`);
console.log('A percentile near 50, a negative OOS return or few trades is a valid, inconclusive outcome, not a bug.');

writeFileSync(join(outDir, 'trades.csv'), tradesToCsv(report.trades, snapshot.candles));
console.log(`\nWrote ${report.trades.length} trades to ${join(outDir, 'trades.csv')}${args.snapshot ? '' : ` and the snapshot to ${join(outDir, 'snapshot.json')}`}.`);
