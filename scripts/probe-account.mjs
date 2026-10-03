/** Opt-in read-only diagnostics. Never print account tokens, script IDs or names. */
import { Buffer } from 'node:buffer';
import { getUser, getPrivateIndicators, getIndicatorData } from '../dist/index.js';

const positiveArgument = (name, fallback) => {
  const raw = process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3);
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('Invalid probe argument');
  return value;
};

async function main() {
  const maxScripts = positiveArgument('max-scripts', 10);
  const timeoutMs = positiveArgument('timeout-ms', 30_000);
  if (!process.env.SESSION) throw new Error('SESSION is required');
  const credentials = { session: process.env.SESSION, signature: process.env.SIGNATURE };
  const options = { signal: AbortSignal.timeout(timeoutMs) };
  const user = await getUser(credentials, options);
  let planClaim = null;
  try {
    const claims = JSON.parse(Buffer.from(user.authToken.split('.')[1], 'base64url').toString());
    if (typeof claims.plan === 'string') planClaim = claims.plan;
  } catch { /* The account token is not guaranteed to remain a JWT. */ }
  console.log(JSON.stringify({ event: 'account', authenticated: true, planClaim }));
  const scripts = await getPrivateIndicators(credentials, { signal: AbortSignal.timeout(timeoutMs) });
  let failures = 0;
  const selected = scripts.slice(0, maxScripts);
  console.log(JSON.stringify({ event: 'selection', available: scripts.length, selected: selected.length }));
  for (const [index, script] of selected.entries()) {
    const classification = script.id.startsWith('USER;') ? 'user' : script.id.startsWith('PUB;') ? 'published' : 'other';
    try {
      const result = await getIndicatorData({
        symbol: 'BINANCE:BTCUSDT', timeframe: '1D', count: 100,
        indicator: script.id, credentials, timeoutMs, signal: AbortSignal.timeout(timeoutMs),
      });
      console.log(JSON.stringify({
        event: 'script', index, classification, ok: true,
        candles: result.candles.length, values: result.values.length,
        trades: result.strategyReport.trades?.length ?? 0,
        reportPresent: Object.keys(result.strategyReport.performance ?? {}).length > 0,
      }));
    } catch (error) {
      failures += 1;
      console.log(JSON.stringify({ event: 'script', index, classification, ok: false, code: error?.code ?? 'ERROR' }));
    }
  }
  console.log(JSON.stringify({ event: 'summary', checked: selected.length, failures, remaining: scripts.length - selected.length }));
  if (failures || selected.length === 0) process.exitCode = 1;
}

main().catch((error) => {
  // Do not log message/details: upstream failures may carry private script payloads.
  console.error(JSON.stringify({ event: 'failure', code: error?.code ?? 'CONFIG_OR_NETWORK_ERROR' }));
  process.exitCode = 1;
});
