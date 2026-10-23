import type { BacktestReport, ReportRow, TradeRecord } from './run.js';

/** Unix seconds -> ISO 8601 UTC without milliseconds. */
export const isoTime = (seconds: number): string => new Date(seconds * 1000).toISOString().replace('.000Z', 'Z');

const BASE_COLUMNS = [
  'exit', 'split', 'direction', 'signal_time', 'entry_time', 'entry_open', 'entry_price', 'initial_stop', 'target',
  'exit_time', 'exit_level', 'exit_price', 'exit_reason', 'return_pct',
];

/**
 * Trades as CSV. Times are bar open times (ISO, UTC); prices include slippage. Each signal
 * `refs` name becomes a `<name>_time` column, placed before `signal_time`.
 */
export function tradesToCsv(trades: readonly TradeRecord[]): string {
  const refNames = [...new Set(trades.flatMap((t) => Object.keys(t.refs)))];
  const time = (value: number | undefined) => (value === undefined ? '' : isoTime(value));
  const num = (value: number | null) => (value === null ? '' : String(Number(value.toPrecision(10))));
  const header = [...BASE_COLUMNS.slice(0, 3), ...refNames.map((n) => `${n}_time`), ...BASE_COLUMNS.slice(3)];
  const lines = trades.map((t) => [
    t.exit, t.split, t.direction, ...refNames.map((n) => time(t.refs[n])), time(t.signalTime), time(t.entryTime),
    num(t.entryOpen), num(t.entryPrice), num(t.initialStop), num(t.target), time(t.exitTime), num(t.exitLevel),
    num(t.exitPrice), t.reason, (t.return * 100).toFixed(4),
  ].join(','));
  return [header.join(','), ...lines].join('\n') + '\n';
}

const pct = (value: number | null | undefined, digits = 1) => (value === null || value === undefined ? 'N/A' : `${(value * 100).toFixed(digits)}%`);

/** Compact side-by-side table: one row per exit and split. */
export function formatTable(rows: readonly ReportRow[]): string {
  const head = ['Exit', 'Split', 'Trades', 'Net', 'Win', 'PF', 'MaxDD', 'Rand p5', 'Rand p50', 'Rand p95', 'Pctl'];
  const body = rows.map((row) => {
    const m = row.metrics;
    const b = row.baseline;
    return [
      row.exit, row.split, String(m.trades), pct(m.netReturn), pct(m.winRate, 0),
      m.profitFactor === null ? 'N/A' : m.profitFactor.toFixed(2), pct(m.maxDrawdown),
      pct(b?.p5), pct(b?.p50), pct(b?.p95), row.percentile === null ? 'N/A' : row.percentile.toFixed(1),
    ];
  });
  const all = [head, ...body];
  const widths = head.map((_, c) => Math.max(...all.map((r) => r[c].length)));
  return all.map((r) => r.map((v, c) => (c < 2 ? v.padEnd(widths[c]) : v.padStart(widths[c]))).join('  ')).join('\n');
}

/** The whole report as plain text: data, split, signals, costs, results, definitions, warnings. */
export function formatReport(report: BacktestReport): string {
  const { snapshot: s, settings, segments, causality } = report;
  const range = (seg: BacktestReport['segments']['inSample']) => (seg.startTime === null || seg.endTime === null
    ? '(empty)'
    : `${isoTime(seg.startTime)} -> ${isoTime(seg.endTime)} (${seg.bars} bars)`);
  const count = (split: 'IS' | 'OOS') => {
    const list = report.signals.filter((sig) => sig.split === split);
    return `${list.length} (${list.filter((sig) => sig.direction === 'long').length} long, ${list.filter((sig) => sig.direction === 'short').length} short)`;
  };
  const missing = s.gaps.reduce((sum, gap) => sum + gap.missingBars, 0);
  const lines = [
    '== Data (frozen once, reused for every run) ==',
    `${s.symbol || 'candles'} ${s.timeframe || `${s.barSeconds}s`}: ${s.count} closed bars, ${isoTime(s.firstTime)} -> ${isoTime(s.lastTime)} (bar open times, UTC)`,
    `Forming bar dropped: ${s.droppedFormingBar ? 'yes' : 'no'}. sha256 ${s.sha256.slice(0, 16)}`,
    `Gaps: ${s.gaps.length} (${missing} missing bars)${s.gaps.slice(0, 5).map((g) => `\n  ${isoTime(g.afterTime)} -> ${isoTime(g.beforeTime)} (${g.missingBars} bars)`).join('')}`,
    `History: ${report.tradableYears.toFixed(2)} years tradable after warm-up.`,
    '',
    '== Split (chronological, no position crosses it) ==',
    `Warm-up:       ${range(segments.warmup)}, indicators only, never traded`,
    `In-sample:     ${range(segments.inSample)}`,
    `Out-of-sample: ${range(segments.outOfSample)}`,
    '',
    '== Signals ==',
    `Rule: ${settings.signal}. Signal at a bar's close, entry at the NEXT bar's open.`,
    `IS signals: ${count('IS')}. OOS signals: ${count('OOS')}.`,
    causality.reruns
      ? `Causality: rule rerun on ${causality.reruns} truncated histories (${causality.checkedSignals}/${causality.totalSignals} signals checked at their own bar): no look-ahead found.`
      : 'Causality: NOT checked.',
    `Costs per side: fee ${pct(settings.fee, 2)}, adverse slippage ${pct(settings.slippage, 2)}. Sizing: 100% of equity, no leverage, one position at a time.`,
    'Same-bar stop and target: counted as a stop. Gap through a level: filled at the open.',
    '',
    `== Results (random baseline: ${settings.runs} seeded runs per row, seed ${settings.seed}) ==`,
    formatTable(report.rows),
    `Exits: ${settings.exits.map((e) => `${e.id} = ${e.label}`).join('; ')}.`,
    'Net: compounded net return. Win: share of trades with a positive net return. PF: gross profit / gross loss (N/A without a losing trade).',
    'MaxDD: largest peak-to-trough equity fall, marked to market at bar closes. Pctl: 100 x share of random runs with a strictly lower net return.',
    ...report.warnings.map((w) => `WARNING: ${w}`),
    'Read the OOS rows first. A percentile near 50, a negative OOS return or few trades is a valid, inconclusive outcome, not a bug.',
  ];
  return lines.join('\n');
}
