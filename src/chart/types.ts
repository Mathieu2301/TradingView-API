/**
 * Exchange-qualified symbol such as `BINANCE:BTCEUR` or `NASDAQ:AAPL`.
 * A bare ticker (`BTCEUR`) lets TradingView pick an exchange.
 */
export type MarketSymbol = string;

/**
 * Bar resolution: minutes (`1`, `5`, `60`, `240`), seconds (`1S`), or
 * days/weeks/months (`D`, `1D`, `W`, `M`...). Custom values such as `20`
 * or `1S` need an account with access to them.
 */
export type Timeframe =
  | '1S' | '5S' | '10S' | '15S' | '30S'
  | '1' | '3' | '5' | '15' | '30' | '45'
  | '60' | '120' | '180' | '240'
  | '1D' | '1W' | '1M' | 'D' | 'W' | 'M' | '3M' | '6M' | '12M'
  | (string & {});

/** Chart timezone. `exchange` uses the exchange timezone. Any IANA name TradingView supports is accepted. */
export type Timezone =
  | 'Etc/UTC' | 'exchange'
  | 'Pacific/Honolulu' | 'America/Juneau' | 'America/Los_Angeles'
  | 'America/Phoenix' | 'America/Vancouver' | 'US/Mountain'
  | 'America/El_Salvador' | 'America/Bogota' | 'America/Chicago'
  | 'America/Lima' | 'America/Mexico_City' | 'America/Caracas'
  | 'America/New_York' | 'America/Toronto' | 'America/Argentina/Buenos_Aires'
  | 'America/Santiago' | 'America/Sao_Paulo' | 'Atlantic/Reykjavik'
  | 'Europe/Dublin' | 'Africa/Lagos' | 'Europe/Lisbon' | 'Europe/London'
  | 'Europe/Amsterdam' | 'Europe/Belgrade' | 'Europe/Berlin'
  | 'Europe/Brussels' | 'Europe/Copenhagen' | 'Africa/Johannesburg'
  | 'Africa/Cairo' | 'Europe/Luxembourg' | 'Europe/Madrid' | 'Europe/Malta'
  | 'Europe/Oslo' | 'Europe/Paris' | 'Europe/Rome' | 'Europe/Stockholm'
  | 'Europe/Warsaw' | 'Europe/Zurich' | 'Europe/Athens' | 'Asia/Bahrain'
  | 'Europe/Helsinki' | 'Europe/Istanbul' | 'Asia/Jerusalem' | 'Asia/Kuwait'
  | 'Europe/Moscow' | 'Asia/Qatar' | 'Europe/Riga' | 'Asia/Riyadh'
  | 'Europe/Tallinn' | 'Europe/Vilnius' | 'Asia/Tehran' | 'Asia/Dubai'
  | 'Asia/Muscat' | 'Asia/Ashkhabad' | 'Asia/Kolkata' | 'Asia/Almaty'
  | 'Asia/Bangkok' | 'Asia/Jakarta' | 'Asia/Ho_Chi_Minh' | 'Asia/Chongqing'
  | 'Asia/Hong_Kong' | 'Australia/Perth' | 'Asia/Shanghai' | 'Asia/Singapore'
  | 'Asia/Taipei' | 'Asia/Seoul' | 'Asia/Tokyo' | 'Australia/Brisbane'
  | 'Australia/Adelaide' | 'Australia/Sydney' | 'Pacific/Norfolk'
  | 'Pacific/Auckland' | 'Pacific/Fakaofo' | 'Pacific/Chatham'
  | (string & {});

/** Custom bar types computed by TradingView. */
export type ChartType = 'HeikinAshi' | 'Renko' | 'LineBreak' | 'Kagi' | 'PointAndFigure' | 'Range';

/** Server study used for each chart type. */
export const CHART_TYPE_STUDIES: Record<ChartType, string> = {
  HeikinAshi: 'BarSetHeikenAshi@tv-basicstudies-60!',
  Renko: 'BarSetRenko@tv-prostudies-40!',
  LineBreak: 'BarSetPriceBreak@tv-prostudies-34!',
  Kagi: 'BarSetKagi@tv-prostudies-34!',
  PointAndFigure: 'BarSetPnF@tv-prostudies-34!',
  Range: 'BarSetRange@tv-basicstudies-72!',
};

/** Inputs for custom chart types. */
export interface ChartTypeInputs {
  /** Renko/Kagi/PointAndFigure ATR length. */
  atrLength?: number;
  /** Renko/LineBreak/Kagi source. */
  source?: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';
  /** Renko/Kagi/PointAndFigure style. */
  style?: 'ATR' | (string & {});
  /** Renko/PointAndFigure box size. */
  boxSize?: number;
  /** Kagi/PointAndFigure reversal amount. */
  reversalAmount?: number;
  /** Renko/PointAndFigure sources. */
  sources?: 'Close' | (string & {});
  /** Renko wicks. */
  wicks?: boolean;
  /** LineBreak number of lines. */
  lb?: number;
  /** PointAndFigure one-step-back building. */
  oneStepBackBuilding?: boolean;
  /** Range phantom bars. */
  phantomBars?: boolean;
  /** Range size. */
  range?: number;
  [input: string]: unknown;
}

/** Price adjustment. */
export type Adjustment = 'splits' | 'dividends' | 'none' | (string & {});

/** Trading session. */
export type TradingSession = 'regular' | 'extended' | (string & {});

/** One bar. `time` is the bar open time as a Unix timestamp in seconds. */
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Subsession {
  id: string;
  description: string;
  private: boolean;
  session: string;
  'session-correction': string;
  'session-display': string;
}

/** Symbol metadata from `symbol_resolved`. Fields vary by market; unknown ones are kept. */
export interface SymbolInfo {
  /** Series ID used by this chart (`ser_1`). */
  series_id: string;
  name: string;
  full_name: string;
  pro_name: string;
  description: string;
  short_description: string;
  exchange: string;
  listed_exchange: string;
  provider_id: string;
  base_currency?: string;
  base_currency_id?: string;
  currency_id: string;
  currency_code: string;
  type: string;
  timezone: string;
  session: string;
  session_display?: string;
  subsession_id?: string;
  subsessions?: Subsession[];
  pricescale: number;
  pointvalue?: number;
  minmov: number;
  minmove2?: number;
  fractional: boolean;
  has_intraday: boolean;
  has_adjustment?: boolean;
  has_extended_hours?: boolean;
  is_tradable: boolean;
  is_replayable?: boolean;
  allowed_adjustment?: string;
  variable_tick_size?: string;
  pro_perm?: string;
  typespecs?: string[];
  resolutions?: string[];
  aliases?: string[];
  alternatives?: string[];
  [key: string]: unknown;
}
