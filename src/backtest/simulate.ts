import { TradingViewError } from '../errors.js';
import type {
  Bar, Costs, Direction, Entry, ExitModel, ExitReason, Segment, Trade,
} from './types.js';

/**
 * Bars before `warmupBars` only warm the indicators up. The remaining bars are split
 * chronologically: in-sample `[start, splitBar)`, out-of-sample `[splitBar, end)`.
 */
export function splitSegments(barCount: number, warmupBars: number, ratio: number): { inSample: Segment; outOfSample: Segment } {
  if (!(ratio > 0 && ratio < 1)) throw new TradingViewError('INVALID_ARGUMENT', 'splitRatio must be between 0 and 1');
  const start = Math.min(Math.max(0, warmupBars), barCount);
  const splitBar = start + Math.floor((barCount - start) * ratio);
  return {
    inSample: { name: 'IS', start, end: splitBar },
    outOfSample: { name: 'OOS', start: splitBar, end: barCount },
  };
}

/** Fill price after adverse slippage. */
export function fillPrice(side: 'entry' | 'exit', direction: Direction, price: number, slippage: number): number {
  const buying = (side === 'entry') === (direction === 'long');
  return buying ? price * (1 + slippage) : price * (1 - slippage);
}

/**
 * Return on equity of one trade (100% of equity, no leverage), after slippage on both fills
 * and a fee on the notional of each side.
 */
export function tradeReturn(direction: Direction, entryFill: number, exitFill: number, fee: number): number {
  const ratio = exitFill / entryFill;
  const gross = direction === 'long' ? ratio - 1 : 1 - ratio;
  return gross - fee - fee * ratio;
}

const reachedStop = (direction: Direction, price: number, stop: number) => (direction === 'long' ? price <= stop : price >= stop);
const reachedTarget = (direction: Direction, price: number, target: number | null) => target !== null
  && (direction === 'long' ? price >= target : price <= target);

interface ExitFill { level: number; reason: ExitReason }

interface OpenTrade {
  candles: readonly Bar[];
  direction: Direction;
  entryBar: number;
  end: number;
  entryOpen: number;
  entryPrice: number;
  initialStop: number;
  stop: number;
  target: number | null;
  trailing: boolean;
  stops: number[] | undefined;
  marks: number[];
}

/** The bar opened beyond a level: the order fills at the open, the worse price for a stop. */
function gapExit(bar: Bar, direction: Direction, stop: number, target: number | null): ExitFill | null {
  if (reachedStop(direction, bar.open, stop)) return { level: bar.open, reason: 'stop_gap' };
  if (reachedTarget(direction, bar.open, target)) return { level: bar.open, reason: 'target_gap' };
  return null;
}

/** Levels touched inside the bar. The intrabar order is unknown: when both are, the stop comes first. */
function intrabarExit(bar: Bar, direction: Direction, stop: number, target: number | null, trailing: boolean): ExitFill | null {
  const long = direction === 'long';
  const hitStop = reachedStop(direction, long ? bar.low : bar.high, stop);
  const hitTarget = reachedTarget(direction, long ? bar.high : bar.low, target);
  if (hitStop && hitTarget) return { level: stop, reason: 'stop_and_target_same_bar' };
  if (hitStop) return { level: stop, reason: trailing ? 'trailing_stop' : 'stop' };
  if (hitTarget) return { level: target as number, reason: 'target' };
  return null;
}

/** Exit on bar i, if any: gap at the open (not on the entry bar), then intrabar, then segment end. */
function barExit(i: number, trade: OpenTrade): ExitFill | null {
  const { candles, direction, stop, target, entryBar, end, trailing } = trade;
  const bar = candles[i];
  return (i > entryBar ? gapExit(bar, direction, stop, target) : null)
    ?? intrabarExit(bar, direction, stop, target, trailing)
    ?? (i === end - 1 ? { level: bar.close, reason: 'segment_end' } : null);
}

function closedTrade(entry: Entry, trade: OpenTrade, i: number, { level, reason }: ExitFill, costs: Costs): Trade {
  const exitPrice = fillPrice('exit', entry.direction, level, costs.slippage);
  return {
    ...entry,
    exitBar: i,
    entryOpen: trade.entryOpen,
    entryPrice: trade.entryPrice,
    initialStop: trade.initialStop,
    target: trade.target,
    exitLevel: level,
    exitPrice,
    reason,
    return: tradeReturn(entry.direction, trade.entryPrice, exitPrice, costs.fee),
    marks: trade.marks,
    ...(trade.stops ? { stops: trade.stops } : {}),
  };
}

interface SimContext { candles: readonly Bar[]; costs: Costs; end: number; trace: boolean }

function openTrade(entry: Entry, exit: ExitModel, { candles, costs, end, trace }: SimContext): OpenTrade | null {
  const { direction, entryBar } = entry;
  const entryOpen = candles[entryBar].open;
  const levels = exit.levels({ direction, entryOpen, signalBar: entry.signalBar, candles });
  if (!levels || !Number.isFinite(levels.stop)) return null;
  return {
    candles, direction, entryBar, end, entryOpen,
    entryPrice: fillPrice('entry', direction, entryOpen, costs.slippage),
    initialStop: levels.stop,
    stop: levels.stop,
    target: levels.target,
    trailing: Boolean(exit.trail),
    stops: trace ? [] : undefined,
    marks: [],
  };
}

function runTrade(entry: Entry, exit: ExitModel, context: SimContext): Trade | null {
  const { candles, costs } = context;
  const trade = openTrade(entry, exit, context);
  if (!trade) return null;
  const { direction } = trade;
  for (let i = trade.entryBar; i < trade.end; i++) {
    trade.stops?.push(trade.stop);
    const exitFill = barExit(i, trade);
    if (exitFill) return closedTrade(entry, trade, i, exitFill, costs);
    // Still open at the close: mark to market as if closed there (with exit costs).
    const markPrice = fillPrice('exit', direction, candles[i].close, costs.slippage);
    trade.marks.push(tradeReturn(direction, trade.entryPrice, markPrice, costs.fee));
    if (exit.trail) trade.stop = exit.trail(trade.stop, i, { direction, candles });
  }
  return null; // Only reached when the entry bar is outside the segment
}

export interface SimulateInput {
  candles: readonly Bar[];
  /** Sorted by `entryBar`. */
  entries: readonly Entry[];
  exit: ExitModel;
  costs: Costs;
  segment: Segment;
  maxTrades?: number;
  /** Record the stop in force on every bar of each trade. */
  trace?: boolean;
}

export interface SimulateResult {
  trades: Trade[];
  /** Entries skipped because a position was already open. */
  skippedInPosition: number;
  /** Entries whose signal bar or entry bar is outside the segment. */
  outsideSegment: number;
  /** Entries for which the exit returned no levels (ATR not defined yet...). */
  invalidLevels: number;
}

/**
 * Simulates entries inside one segment, one position at a time, 100% of equity, no leverage.
 * An entry is taken only if its signal bar and entry bar are inside the segment and the
 * previous trade exited on an earlier bar. A trade still open on the last bar of the segment
 * is closed at that bar's close (`segment_end`), so no position crosses a segment boundary.
 */
export function simulate({
  candles, entries, exit, costs, segment, maxTrades = Infinity, trace = false,
}: SimulateInput): SimulateResult {
  const context: SimContext = { candles, costs, end: segment.end, trace };
  const trades: Trade[] = [];
  let freeFrom = segment.start;
  let skippedInPosition = 0;
  let outsideSegment = 0;
  let invalidLevels = 0;
  for (const entry of entries) {
    if (trades.length >= maxTrades) break;
    if (entry.signalBar < segment.start || entry.entryBar >= segment.end) {
      outsideSegment++;
      continue;
    }
    if (entry.entryBar < freeFrom) {
      skippedInPosition++;
      continue;
    }
    const trade = runTrade(entry, exit, context);
    if (!trade) {
      invalidLevels++;
      continue;
    }
    trades.push(trade);
    freeFrom = trade.exitBar + 1;
  }
  return { trades, skippedInPosition, outsideSegment, invalidLevels };
}
