import type { Credentials } from '../../src/index.js';

/** Live tests only run with TV_LIVE=1 (`npm run test:live`). */
export const LIVE = process.env.TV_LIVE === '1';

/** Authenticated live tests also need SESSION and SIGNATURE cookies. */
export const credentials: Credentials | undefined = process.env.SESSION && process.env.SIGNATURE
  ? { session: process.env.SESSION, signature: process.env.SIGNATURE }
  : undefined;

export const wait = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** Smallest gap between consecutive candle times. */
export function minGap(times: number[]): number {
  let gap = Infinity;
  for (let i = 1; i < times.length; i += 1) gap = Math.min(gap, times[i] - times[i - 1]);
  return gap;
}
