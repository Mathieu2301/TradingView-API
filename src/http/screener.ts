import { TradingViewError } from '../errors.js';
import { request, type AuthHttpOptions } from './request.js';

export interface ScreenerFilter {
  left: string;
  operation: string;
  right?: unknown;
}

export interface ScreenerQuery {
  /** Scanner universe, e.g. america, crypto, forex or global. */
  market?: string;
  /** Exact scanner field names, including optional timeframe suffixes. */
  columns: string[];
  filter?: ScreenerFilter[];
  sort?: { sortBy: string; sortOrder: 'asc' | 'desc' };
  /** Zero-based, end-exclusive page range. Defaults to [0, 50]. */
  range?: [number, number];
  /** Optional exchange-qualified symbols. */
  symbols?: string[];
}

export interface ScreenerRow {
  symbol: string;
  /** Values retain upstream types and nulls; keys match requested columns. */
  values: Record<string, unknown>;
}

export interface ScreenerResult {
  totalCount: number;
  rows: ScreenerRow[];
}

/** One scanner page. This does not subscribe to live prices or grant exchange entitlements. */
export async function getScreener(query: ScreenerQuery, options: AuthHttpOptions = {}): Promise<ScreenerResult> {
  const market = query.market ?? 'global';
  const range = query.range ?? [0, 50];
  if (!/^[a-z][a-z0-9_-]*$/i.test(market)
    || !Array.isArray(query.columns) || !query.columns.length
    || query.columns.some((column) => typeof column !== 'string' || !column.trim())
    || new Set(query.columns).size !== query.columns.length
    || range.length !== 2 || !range.every(Number.isSafeInteger) || range[0] < 0 || range[1] <= range[0]) {
    throw new TradingViewError('INVALID_ARGUMENT', 'Invalid screener market, columns or page range');
  }
  const { data, status } = await request(`https://scanner.tradingview.com/${market}/scan`, {
    method: 'POST',
    credentials: options.credentials,
    headers: { origin: 'https://www.tradingview.com' },
    json: {
      columns: query.columns, range, filter: query.filter ?? [], sort: query.sort,
      symbols: query.symbols === undefined ? undefined : { tickers: query.symbols },
    },
  }, options);
  if (status < 200 || status >= 300 || !data || !Number.isSafeInteger(data.totalCount)
    || data.totalCount < 0 || !Array.isArray(data.data)
    || data.data.some((row: any) => !row || typeof row.s !== 'string'
      || !Array.isArray(row.d) || row.d.length !== query.columns.length)) {
    throw new TradingViewError('HTTP_ERROR', `Unexpected screener response (HTTP ${status})`);
  }
  return {
    totalCount: data.totalCount,
    rows: data.data.map((row: { s: string; d: unknown[] }) => ({
      symbol: row.s,
      values: Object.fromEntries(query.columns.map((column, index) => [column, row.d[index]])),
    })),
  };
}
