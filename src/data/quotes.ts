import type { TradingSession } from '../chart/types.js';
import { TradingViewError } from '../errors.js';
import type { QuoteData, QuoteField, QuoteFieldPreset } from '../quote/fields.js';
import type { QuoteSubscription } from '../quote/quote-session.js';
import {
  runOperation, startWatcher, validateSymbol,
  type OperationOptions, type WatchHandlers, type Watcher,
} from './operation.js';

export interface QuoteOptions extends OperationOptions {
  /** `all` (default), `price`, or a list of fields. */
  fields?: QuoteFieldPreset | readonly QuoteField[];
  /** Trading session. Default: `regular`. */
  session?: TradingSession;
}

export interface QuoteQuery extends QuoteOptions {
  symbol: string;
}

export interface QuotesQuery extends QuoteOptions {
  symbols: readonly string[];
}

function validateSymbols(symbols: unknown): string[] {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new TradingViewError('INVALID_ARGUMENT', 'symbols must be a non-empty array');
  }
  return [...new Set(symbols.map(validateSymbol))];
}

/** Gets quotes for several symbols at once, keyed by symbol. */
export function getQuotes(query: QuotesQuery | readonly string[]): Promise<Record<string, QuoteData>> {
  const options: QuotesQuery = Array.isArray(query) ? { symbols: query } : query as QuotesQuery;
  let symbols: string[];
  try {
    symbols = validateSymbols(options.symbols);
  } catch (error) {
    return Promise.reject(error);
  }

  return runOperation<Record<string, QuoteData>>(options, `getQuotes(${symbols.join(', ')})`, ({ client, resolve, reject }) => {
    const session = client.createQuoteSession({ fields: options.fields });
    const results: Record<string, QuoteData> = {};
    let pending = symbols.length;
    for (const symbol of symbols) {
      const sub = session.subscribe(symbol, { session: options.session });
      sub.on('error', reject);
      sub.once('loaded', () => {
        results[symbol] = sub.data;
        pending -= 1;
        if (pending === 0) resolve(results);
      });
    }
    return () => session.delete();
  });
}

/** Gets the current quote of a symbol (last price, change, volume...). */
export async function getQuote(query: QuoteQuery | string): Promise<QuoteData> {
  const options: QuoteQuery = typeof query === 'string' ? { symbol: query } : query;
  const symbol = validateSymbol(options.symbol);
  const quotes = await getQuotes({ ...options, symbols: [symbol] });
  return quotes[symbol];
}

export interface QuoteHandlers extends WatchHandlers {
  /** Receives the merged quote and the fields that changed. */
  onData(symbol: string, quote: QuoteData, changes: QuoteData): void;
}

export interface QuoteWatcher extends Watcher {
  /** Latest quote per symbol. */
  readonly latest: Readonly<Record<string, QuoteData>>;
}

/**
 * Streams quotes for one or more symbols. Resolves once every symbol has
 * loaded (or failed: failures go to `onError`; if every symbol fails, the
 * promise rejects). Call `stop()` when finished.
 */
export function watchQuotes(query: QuotesQuery, handlers: QuoteHandlers): Promise<QuoteWatcher> {
  let symbols: string[];
  try {
    if (typeof handlers?.onData !== 'function') throw new TradingViewError('INVALID_ARGUMENT', 'onData must be a function');
    symbols = validateSymbols(query.symbols);
  } catch (error) {
    return Promise.reject(error);
  }

  const latest: Record<string, QuoteData> = {};

  return startWatcher(query, `watchQuotes(${symbols.join(', ')})`, handlers, (ctx) => {
    const session = ctx.client.createQuoteSession({ fields: query.fields });
    const settled = new Set<string>();
    const errors: TradingViewError[] = [];
    let loaded = 0;

    const settle = (symbol: string, ok: boolean) => {
      if (settled.has(symbol)) return;
      settled.add(symbol);
      if (ok) loaded += 1;
      if (settled.size < symbols.length) return;
      if (loaded === 0) ctx.fail(errors[0]);
      else {
        for (const error of errors) ctx.warn(error);
        ctx.ready();
      }
    };

    const subscriptions: QuoteSubscription[] = symbols.map((symbol) => {
      const sub = session.subscribe(symbol, { session: query.session });
      sub.on('data', (quote, changes) => {
        latest[symbol] = quote;
        if (!ctx.isActive()) return;
        try {
          handlers.onData(symbol, quote, changes);
        } catch (error) {
          ctx.warn(new TradingViewError('CALLBACK_ERROR', 'onData callback threw', { cause: error }));
        }
      });
      sub.on('loaded', () => settle(symbol, true));
      sub.on('error', (error) => {
        if (error.code === 'DISCONNECTED') return; // Reported by the watcher itself.
        if (settled.size < symbols.length && !settled.has(symbol)) {
          errors.push(error);
          settle(symbol, false);
        } else ctx.warn(error);
      });
      return sub;
    });

    return () => {
      for (const sub of subscriptions) sub.close();
      session.delete();
    };
  }, (base) => ({
    stop: base.stop,
    closed: base.closed,
    get isActive() { return base.isActive; },
    get latest() { return { ...latest }; },
  }));
}
