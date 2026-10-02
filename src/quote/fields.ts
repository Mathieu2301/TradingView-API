/** Quote fields TradingView can stream. Other field names are accepted too. */
export type QuoteField =
  | 'base-currency-logoid' | 'ch' | 'chp' | 'currency-logoid' | 'provider_id'
  | 'currency_code' | 'current_session' | 'description'
  | 'exchange' | 'format' | 'fractional' | 'is_tradable'
  | 'language' | 'local_description' | 'logoid' | 'lp'
  | 'lp_time' | 'minmov' | 'minmove2' | 'original_name'
  | 'pricescale' | 'pro_name' | 'short_name' | 'type'
  | 'update_mode' | 'volume' | 'ask' | 'bid' | 'fundamentals'
  | 'high_price' | 'low_price' | 'open_price' | 'prev_close_price'
  | 'rch' | 'rchp' | 'rtc' | 'rtc_time' | 'status' | 'industry'
  | 'basic_eps_net_income' | 'beta_1_year' | 'market_cap_basic'
  | 'earnings_per_share_basic_ttm' | 'price_earnings_ttm'
  | 'sector' | 'dividends_yield' | 'timezone' | 'country_code'
  | (string & {});

/** `all` requests every known field, `price` only the last price (`lp`). */
export type QuoteFieldPreset = 'all' | 'price';

export const ALL_QUOTE_FIELDS: readonly QuoteField[] = [
  'base-currency-logoid', 'ch', 'chp', 'currency-logoid',
  'currency_code', 'current_session', 'description',
  'exchange', 'format', 'fractional', 'is_tradable',
  'language', 'local_description', 'logoid', 'lp',
  'lp_time', 'minmov', 'minmove2', 'original_name',
  'pricescale', 'pro_name', 'short_name', 'type',
  'update_mode', 'volume', 'ask', 'bid', 'fundamentals',
  'high_price', 'low_price', 'open_price', 'prev_close_price',
  'rch', 'rchp', 'rtc', 'rtc_time', 'status', 'industry',
  'basic_eps_net_income', 'beta_1_year', 'market_cap_basic',
  'earnings_per_share_basic_ttm', 'price_earnings_ttm',
  'sector', 'dividends_yield', 'timezone', 'country_code',
  'provider_id',
];

/** Resolves a preset or explicit list into field names. */
export function resolveQuoteFields(fields: QuoteFieldPreset | readonly QuoteField[] = 'all'): QuoteField[] {
  if (Array.isArray(fields)) return fields.length ? [...fields] : [...ALL_QUOTE_FIELDS];
  return fields === 'price' ? ['lp'] : [...ALL_QUOTE_FIELDS];
}

/**
 * Latest quote values. Only requested fields that TradingView sent are
 * present; numbers are raw server values.
 */
export interface QuoteData {
  /** Last price. */
  lp?: number;
  /** Time of the last price (Unix seconds). */
  lp_time?: number;
  /** Change since previous close. */
  ch?: number;
  /** Change since previous close, in percent. */
  chp?: number;
  bid?: number;
  ask?: number;
  volume?: number;
  open_price?: number;
  high_price?: number;
  low_price?: number;
  prev_close_price?: number;
  description?: string;
  short_name?: string;
  pro_name?: string;
  exchange?: string;
  currency_code?: string;
  type?: string;
  [field: string]: unknown;
}
