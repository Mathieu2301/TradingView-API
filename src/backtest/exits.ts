import { TradingViewError } from '../errors.js';
import { cachedAtr } from './indicators.js';
import type { Direction, ExitModel } from './types.js';

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const offset = (direction: Direction, price: number, distance: number) => (direction === 'long' ? price + distance : price - distance);

function positive(name: string, value: unknown): number {
  if (!isNumber(value) || value <= 0) throw new TradingViewError('INVALID_ARGUMENT', `${name} must be a positive number`);
  return value;
}

export interface FixedExitOptions {
  /** Stop distance from the entry bar open, as a fraction (0.02 = 2%). */
  stopPct: number;
  /** Target at this multiple of the stop distance; null for a stop only. */
  targetR: number | null;
}

/** Fixed stop at `stopPct` from the entry bar open, target at `targetR` times that distance. */
export function fixedExit({ stopPct, targetR }: FixedExitOptions): ExitModel {
  positive('stopPct', stopPct);
  if (targetR !== null) positive('targetR', targetR);
  return {
    id: targetR === null ? `fixed_stop${stopPct * 100}%` : `fixed_${targetR}R`,
    label: `Fixed ${(stopPct * 100).toFixed(1)}% stop, ${targetR === null ? 'no target' : `${targetR}:1 target`}`,
    levels({ direction, entryOpen }) {
      const d = entryOpen * stopPct;
      return { stop: offset(direction, entryOpen, -d), target: targetR === null ? null : offset(direction, entryOpen, targetR * d) };
    },
  };
}

export interface AtrExitOptions {
  /** Stop at `mult` x ATR of the signal bar. */
  mult: number;
  /** Target at this multiple of the stop distance; null for a stop only. */
  targetR: number | null;
  /** ATR length (Wilder). Default 14. */
  length?: number;
}

/** Stop at `mult` x ATR of the signal bar (last closed bar before entry), target at `targetR` R. */
export function atrExit({ mult, targetR, length = 14 }: AtrExitOptions): ExitModel {
  positive('mult', mult);
  positive('length', length);
  if (targetR !== null) positive('targetR', targetR);
  return {
    id: `atr${mult}_${targetR === null ? 'stop' : `${targetR}R`}`,
    label: `ATR(${length}) x${mult} stop, ${targetR === null ? 'no target' : `${targetR}R target`}`,
    warmupBars: length - 1,
    levels({ direction, entryOpen, signalBar, candles }) {
      const d = mult * cachedAtr(candles, length)[signalBar];
      if (!isNumber(d) || d <= 0) return null;
      return { stop: offset(direction, entryOpen, -d), target: targetR === null ? null : offset(direction, entryOpen, targetR * d) };
    },
  };
}

export interface AtrTrailingExitOptions {
  /** Distance from the close, in ATR. */
  mult: number;
  /** ATR length (Wilder). Default 14. */
  length?: number;
}

/**
 * ATR trailing stop, no target. Initial stop at `mult` x ATR of the signal bar, then, after
 * each CLOSED bar, ratcheted to close -/+ `mult` x ATR of that bar; the new stop applies from
 * the next bar.
 */
export function atrTrailingExit({ mult, length = 14 }: AtrTrailingExitOptions): ExitModel {
  positive('mult', mult);
  positive('length', length);
  return {
    id: `trail_atr${mult}`,
    label: `ATR(${length}) x${mult} trailing stop`,
    warmupBars: length - 1,
    levels({ direction, entryOpen, signalBar, candles }) {
      const d = mult * cachedAtr(candles, length)[signalBar];
      if (!isNumber(d) || d <= 0) return null;
      return { stop: offset(direction, entryOpen, -d), target: null };
    },
    trail(stop, bar, { direction, candles }) {
      const candidate = offset(direction, candles[bar].close, -mult * cachedAtr(candles, length)[bar]);
      if (!isNumber(candidate)) return stop;
      return direction === 'long' ? Math.max(stop, candidate) : Math.min(stop, candidate);
    },
  };
}

export interface DefaultExitOptions {
  /** Stop distance of the two fixed exits. Default 0.02. */
  stopPct?: number;
  /** ATR exit stop multiplier. Default 1.5. */
  atrStopMult?: number;
  /** ATR exit target in R. Default 2. */
  atrTargetR?: number;
  /** ATR trailing stop multiplier. Default 3. */
  trailAtrMult?: number;
  /** ATR length. Default 14. */
  atrLength?: number;
}

/**
 * The four reference exits: fixed 2% stop with 1.5:1 and 2:1 targets, 1.5 x ATR stop with a
 * 2R target, and a 3 x ATR trailing stop.
 */
export function defaultExits(options: DefaultExitOptions = {}): ExitModel[] {
  const { stopPct = 0.02, atrStopMult = 1.5, atrTargetR = 2, trailAtrMult = 3, atrLength = 14 } = options;
  return [
    fixedExit({ stopPct, targetR: 1.5 }),
    fixedExit({ stopPct, targetR: 2 }),
    atrExit({ mult: atrStopMult, targetR: atrTargetR, length: atrLength }),
    atrTrailingExit({ mult: trailAtrMult, length: atrLength }),
  ];
}
