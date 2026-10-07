#!/usr/bin/env node
// Packs the library, installs the tarball in a temporary project and checks
// that both entry points load (ESM + type declarations) under Node and Bun.
// No TradingView call is made; installing the tarball may access the npm registry.
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname ?? new URL('.', import.meta.url).pathname, '..');
const run = (cmd, args, cwd) => {
  try {
    return execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  } catch (error) {
    process.stderr.write(`${error.stdout ?? ''}${error.stderr ?? ''}`);
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
};

const dir = mkdtempSync(join(tmpdir(), 'tv-smoke-'));
try {
  const packed = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', dir], root))[0];
  const files = packed.files.map((f) => f.path);
  for (const required of ['bin/tradingview.mjs', 'dist/quick-start.js', 'dist/index.js', 'dist/index.d.ts', 'dist/data/index.js', 'dist/data/index.d.ts', 'README.md', 'llms.txt', 'scripts/endurance.mjs', 'scripts/probe-account.mjs', 'scripts/parity.mjs', 'examples/screener.js']) {
    if (!files.includes(required)) throw new Error(`Missing ${required} in package`);
  }
  if (files.some((f) => f.startsWith('src/') || f.startsWith('tests/'))) throw new Error('Sources or tests leaked into package');
  console.log(`packed ${packed.filename} (${files.length} files, ${packed.size} bytes)`);

  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'smoke', private: true, type: 'module' }));
  run('npm', ['install', '--no-audit', '--no-fund', '--ignore-scripts', join(dir, packed.filename)], dir);

  const launcher = join(dir, 'node_modules', '@mathieuc', 'tradingview', 'bin', 'tradingview.mjs');
  const help = run('node', [launcher, '--help'], dir);
  if (!help.includes('Autonomous agent (recommended)')) throw new Error('CLI help missing');
  const prompt = run('node', [launcher, '--choice', '4'], dir);
  if (!prompt.includes('@mathieuc/tradingview')) throw new Error('CLI prompt missing');
  const noTty = spawnSync('node', [launcher], { cwd: dir, encoding: 'utf8' });
  if (noTty.status !== 1 || !noTty.stderr.includes('--choice')) throw new Error('CLI non-TTY guard failed');
  const bin = join(dir, 'node_modules', '.bin', 'tradingview');
  if (!run(bin, ['--help'], dir).includes('TradingView-API quick-start')) throw new Error('CLI bin link missing');
  // Exercise real child-process argv and cwd without launching paid agents or
  // installing another registry package. This job runs on Linux in CI.
  const fakeBin = join(dir, 'fake bin');
  mkdirSync(fakeBin);
  const captured = join(dir, 'captured.json');
  const { AGENT_PROMPT } = await import('../dist/quick-start.js');
  for (const [choice, command] of [['2', 'claude'], ['3', 'codex'], ['5', 'npm']]) {
    const executable = join(fakeBin, command);
    writeFileSync(executable, `#!${process.execPath}
import { writeFileSync } from 'node:fs';
writeFileSync(process.env.TV_CAPTURE, JSON.stringify({ args: process.argv.slice(2), cwd: process.cwd() }));
`);
    chmodSync(executable, 0o755);
    const child = spawnSync(process.execPath, [launcher, '--choice', choice], {
      cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: fakeBin + ':' + process.env.PATH, TV_CAPTURE: captured },
    });
    if (child.status !== 0) throw new Error(`CLI choice ${choice} failed: ${child.stderr}`);
    const received = JSON.parse(readFileSync(captured, 'utf8'));
    const expected = choice === '5' ? ['install', '@mathieuc/tradingview'] : [AGENT_PROMPT];
    if (received.cwd !== dir || JSON.stringify(received.args) !== JSON.stringify(expected)) throw new Error(`CLI choice ${choice} altered argv or cwd`);
  }
  console.log('quick-start packed CLI ok');

  const check = `
    import * as tv from '@mathieuc/tradingview';
    import { getCandles, watchQuotes, TradingViewError, TradingViewProvider } from '@mathieuc/tradingview/data';
    const pkg = JSON.parse(await (await import('node:fs/promises')).readFile(new URL(import.meta.resolve('@mathieuc/tradingview/package.json')), 'utf8'));
    if (typeof tv.TradingViewClient !== 'function' || typeof getCandles !== 'function' || typeof watchQuotes !== 'function' || typeof TradingViewProvider !== 'function') throw new Error('exports missing');
    for (const name of ['getScreener', 'getWatchlists', 'getHotlist', 'summarizeStrategyReport']) {
      if (typeof tv[name] !== 'function') throw new Error('missing export: ' + name);
    }
    if (tv.getCandles !== getCandles) throw new Error('entry points disagree');
    const frame = tv.protocol.encodePacket('set_auth_token', ['x']);
    if (tv.protocol.decodeFrames(frame)[0].packet.m !== 'set_auth_token') throw new Error('protocol roundtrip failed');
    const error = await getCandles({ symbol: '' }).catch((e) => e);
    if (!(error instanceof TradingViewError) || error.code !== 'INVALID_ARGUMENT') throw new Error('validation failed');
    console.log('ok', pkg.version, typeof Bun === 'undefined' ? 'node ' + process.version : 'bun ' + Bun.version);
  `;
  writeFileSync(join(dir, 'check.mjs'), check);
  process.stdout.write(run('node', ['check.mjs'], dir));

  // CommonJS consumers can require() the ESM build on Node >= 20.19 / 22.12.
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major > 22 || (major === 22 && minor >= 12) || (major === 20 && minor >= 19)) {
    writeFileSync(join(dir, 'check.cjs'), `
      const { getCandles } = require('@mathieuc/tradingview/data');
      const { TradingViewClient } = require('@mathieuc/tradingview');
      if (typeof getCandles !== 'function' || typeof TradingViewClient !== 'function') throw new Error('require failed');
      console.log('require ok');
    `);
    process.stdout.write(run('node', ['check.cjs'], dir));
  } else console.log(`require(esm) not supported by Node ${process.version}: skipped`);

  const bun = spawnSync('bun', ['--version']);
  if (bun.status === 0) process.stdout.write(run('bun', ['check.mjs'], dir));
  else console.log('bun not installed: skipped');

  // Type declarations resolve for a TypeScript consumer.
  const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  writeFileSync(join(dir, 'consumer.ts'), `
    import { getCandles, TradingViewProvider, type Candle, type MarketDataProvider } from '@mathieuc/tradingview/data';
    import { getScreener, getHotlist, getWatchlists, type ScreenerResult, type Watchlist, TradingViewClient, type StudyValue, createProxy } from '@mathieuc/tradingview';
    const proxy = createProxy('http://127.0.0.1:3128', { tls: { rejectUnauthorized: true } });
    const candles: Promise<Candle[]> = getCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: '60', count: 10, clientOptions: proxy });
    const client = new TradingViewClient({ ...proxy });
    const chart = client.createChart();
    chart.on('update', (changes: string[]) => console.log(changes, chart.candles.at(-1)?.close));
    const row: StudyValue = { $time: 1 };
    const provider: MarketDataProvider = new TradingViewProvider();
    const scan: Promise<ScreenerResult> = getScreener({ columns: ['close'], range: [0, 10] });
    const ranked: Promise<ScreenerResult> = getHotlist({ kind: 'gainers' });
    const lists: Promise<Watchlist[]> = getWatchlists({ credentials: { session: 'fixture' } });
    void scan; void ranked; void lists; void candles; void row; void provider;
  `);
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { module: 'NodeNext', moduleResolution: 'NodeNext', target: 'ES2022', strict: true, noEmit: true, types: [], lib: ['ES2022', 'DOM'] },
    files: ['consumer.ts'],
  }));
  run('node', [tsc, '-p', 'tsconfig.json'], dir);
  console.log('types ok');
  JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
} finally {
  rmSync(dir, { recursive: true, force: true });
}
