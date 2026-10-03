import { TradingViewError } from '../errors.js';
import { request, type Credentials, type HttpOptions } from './request.js';
import { getScreener, type ScreenerQuery, type ScreenerResult } from './screener.js';

export interface Watchlist {
  id: number;
  name: string;
  /** Ordered upstream entries, including any section markers. */
  symbols: string[];
  /** Additional upstream metadata, preserved without coercion. */
  [key: string]: unknown;
}

export interface WatchlistOptions extends HttpOptions {
  credentials: Credentials;
}

/** Reads all watchlists belonging to the authenticated account. Never modifies them. */
export async function getWatchlists(options: WatchlistOptions): Promise<Watchlist[]> {
  if (!options?.credentials?.session) {
    throw new TradingViewError('INVALID_ARGUMENT', 'getWatchlists requires account credentials');
  }
  const { data, status } = await request('https://www.tradingview.com/api/v1/symbols_list/all/', {
    credentials: options.credentials,
    headers: { origin: 'https://www.tradingview.com' },
    redirect: 'manual',
  }, options);
  if (status === 401 || status === 403 || (status >= 300 && status < 400)) {
    throw new TradingViewError('AUTH_ERROR', `Watchlist access rejected (HTTP ${status})`);
  }
  if (status < 200 || status >= 300 || !Array.isArray(data)
    || data.some((list: any) => !list || !Number.isSafeInteger(list.id) || typeof list.name !== 'string'
      || !Array.isArray(list.symbols) || list.symbols.some((symbol: unknown) => typeof symbol !== 'string'))) {
    throw new TradingViewError('HTTP_ERROR', `Unexpected watchlist response (HTTP ${status})`);
  }
  return data;
}

export type HotlistKind = 'gainers' | 'losers' | 'mostActive' | 'volumeGainers';
export interface HotlistQuery extends Omit<ScreenerQuery, 'columns' | 'sort'> {
  kind: HotlistKind;
  columns?: string[];
}

/** Scanner-ranked lists, not a promise of parity with the TradingView UI hotlist widget. */
export async function getHotlist(query: HotlistQuery, options: HttpOptions = {}): Promise<ScreenerResult> {
  const rankings = {
    gainers: { sortBy: 'change', sortOrder: 'desc' },
    losers: { sortBy: 'change', sortOrder: 'asc' },
    mostActive: { sortBy: 'volume', sortOrder: 'desc' },
    volumeGainers: { sortBy: 'relative_volume_10d_calc', sortOrder: 'desc' },
  } as const;
  if (!Object.hasOwn(rankings, query.kind)) {
    throw new TradingViewError('INVALID_ARGUMENT', 'Unknown hotlist kind');
  }
  return getScreener({
    ...query,
    market: query.market ?? 'america',
    columns: query.columns ?? ['name', 'close', 'change', 'volume', 'relative_volume_10d_calc'],
    filter: query.filter ?? [{ left: 'type', operation: 'equal', right: 'stock' }],
    sort: rankings[query.kind],
  }, options);
}
