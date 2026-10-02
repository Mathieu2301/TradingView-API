import type { Timeframe } from './types.js';

/**
 * Approximate duration of one bar in seconds, or `undefined` for
 * resolutions that are not time-based (ticks, ranges...).
 * Months count as 30 days.
 */
export function timeframeSeconds(timeframe: Timeframe): number | undefined {
  const match = /^(\d*)([SDWM]?)$/i.exec(String(timeframe).trim());
  if (!match) return undefined;
  const [, amountText, unitText] = match;
  const amount = amountText ? Number(amountText) : 1;
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  switch (unitText.toUpperCase()) {
    case '': return amountText ? amount * 60 : undefined;
    case 'S': return amount;
    case 'D': return amount * 86_400;
    case 'W': return amount * 604_800;
    case 'M': return amount * 2_592_000;
    default: return undefined;
  }
}
