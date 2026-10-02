import { TradingViewError } from '../errors.js';
import { request, type HttpOptions } from './request.js';

export type MarketType =
  | 'stock' | 'futures' | 'forex' | 'cfd' | 'crypto' | 'index' | 'economic' | 'bond' | 'fund' | (string & {});

/** One market returned by `searchMarkets`. */
export interface MarketSearchResult {
  /** Exchange-qualified symbol, usable everywhere in this library (`BINANCE:BTCEUR`). */
  id: string;
  /** Short exchange name (`BINANCE`). */
  exchange: string;
  /** Exchange name as sent by TradingView. */
  fullExchange: string;
  symbol: string;
  description: string;
  type: string;
  currency?: string;
  country?: string;
}

export interface SearchMarketsOptions extends HttpOptions {
  /** Restricts results to a market type. */
  type?: MarketType;
  /** Pagination offset. */
  offset?: number;
  /** Restricts results to an exchange. `searchMarkets('BINANCE:BTC')` sets it too. */
  exchange?: string;
}

const ORIGIN = { origin: 'https://www.tradingview.com' };

/** Searches markets by keywords, `EXCHANGE:` prefix or `EXCHANGE:SYMBOL`. */
export async function searchMarkets(query: string, options: SearchMarketsOptions = {}): Promise<MarketSearchResult[]> {
  const parts = query.toUpperCase().split(':');
  const text = parts.length === 2 ? parts[1] : query.toUpperCase();
  const exchange = options.exchange ?? (parts.length === 2 ? parts[0] : undefined);

  const { data, status } = await request('https://symbol-search.tradingview.com/symbol_search/v3/', {
    query: {
      text, exchange, search_type: options.type ?? '', start: options.offset ?? 0,
    },
    headers: ORIGIN,
  }, options);

  if (!data || !Array.isArray(data.symbols)) {
    throw new TradingViewError('HTTP_ERROR', `Unexpected market search response (HTTP ${status})`, { details: data });
  }

  return data.symbols.map((s: any): MarketSearchResult => {
    const shortExchange = String(s.exchange ?? '').split(' ')[0];
    const symbol = String(s.symbol ?? '').replace(/<\/?em>/g, '');
    return {
      id: s.prefix ? `${s.prefix}:${symbol}` : `${shortExchange.toUpperCase()}:${symbol}`,
      exchange: shortExchange,
      fullExchange: s.exchange,
      symbol,
      description: String(s.description ?? '').replace(/<\/?em>/g, ''),
      type: s.type,
      currency: s.currency_code,
      country: s.country,
    };
  });
}

/**
 * TradingView technical ratings, from -1 (strong sell) to 1 (strong buy).
 * `All` is the summary, `MA` the moving averages and `Other` the oscillators.
 */
export interface TechnicalRating {
  Other: number;
  All: number;
  MA: number;
}

export type TechnicalAnalysisPeriod = '1' | '5' | '15' | '60' | '240' | '1D' | '1W' | '1M';

export type TechnicalAnalysis = Record<TechnicalAnalysisPeriod, TechnicalRating>;

const TA_PERIODS: TechnicalAnalysisPeriod[] = ['1', '5', '15', '60', '240', '1D', '1W', '1M'];
const TA_INDICATORS = ['Recommend.Other', 'Recommend.All', 'Recommend.MA'];

/**
 * Gets technical ratings for every period from the TradingView scanner.
 * Returns `null` when the scanner has no data for the symbol.
 *
 * Values are scaled like the historical API: `round(raw * 1000) / 500`,
 * which maps the scanner range [-1, 1] to [-2, 2].
 */
export async function getTechnicalAnalysis(symbol: string, options: HttpOptions = {}): Promise<TechnicalAnalysis | null> {
  const columns = TA_PERIODS.flatMap((period) => TA_INDICATORS.map((name) => (
    period === '1D' ? name : `${name}|${period}`
  )));

  const { data } = await request('https://scanner.tradingview.com/global/scan', {
    method: 'POST',
    json: { symbols: { tickers: [symbol] }, columns },
  }, options);

  const values: unknown[] | undefined = data?.data?.[0]?.d;
  if (!values) return null;

  const result = {} as TechnicalAnalysis;
  values.forEach((value, index) => {
    const [name, period = '1D'] = columns[index].split('|');
    const key = name.split('.').pop() as keyof TechnicalRating;
    result[period as TechnicalAnalysisPeriod] ??= {} as TechnicalRating;
    result[period as TechnicalAnalysisPeriod][key] = Math.round(Number(value) * 1000) / 500;
  });
  return result;
}
