/**
 * @typedef {string} MarketSymbol Market symbol (like: 'BTCEUR' or 'KRAKEN:BTCEUR')
 */

/**
 * @typedef {'Etc/UTC' | 'exchange'
 * | 'Pacific/Honolulu' | 'America/Juneau' | 'America/Los_Angeles'
 * | 'America/Phoenix' | 'America/Vancouver' | 'US/Mountain'
 * | 'America/El_Salvador' | 'America/Bogota' | 'America/Chicago'
 * | 'America/Lima' | 'America/Mexico_City' | 'America/Caracas'
 * | 'America/New_York' | 'America/Toronto' | 'America/Argentina/Buenos_Aires'
 * | 'America/Santiago' | 'America/Sao_Paulo' | 'Atlantic/Reykjavik'
 * | 'Europe/Dublin' | 'Africa/Lagos' | 'Europe/Lisbon' | 'Europe/London'
 * | 'Europe/Amsterdam' | 'Europe/Belgrade' | 'Europe/Berlin'
 * | 'Europe/Brussels' | 'Europe/Copenhagen' | 'Africa/Johannesburg'
 * | 'Africa/Cairo' | 'Europe/Luxembourg' | 'Europe/Madrid' | 'Europe/Malta'
 * | 'Europe/Oslo' | 'Europe/Paris' | 'Europe/Rome' | 'Europe/Stockholm'
 * | 'Europe/Warsaw' | 'Europe/Zurich' | 'Europe/Athens' | 'Asia/Bahrain'
 * | 'Europe/Helsinki' | 'Europe/Istanbul' | 'Asia/Jerusalem' | 'Asia/Kuwait'
 * | 'Europe/Moscow' | 'Asia/Qatar' | 'Europe/Riga' | 'Asia/Riyadh'
 * | 'Europe/Tallinn' | 'Europe/Vilnius' | 'Asia/Tehran' | 'Asia/Dubai'
 * | 'Asia/Muscat' | 'Asia/Ashkhabad' | 'Asia/Kolkata' | 'Asia/Almaty'
 * | 'Asia/Bangkok' | 'Asia/Jakarta' | 'Asia/Ho_Chi_Minh' | 'Asia/Chongqing'
 * | 'Asia/Hong_Kong' | 'Australia/Perth' | 'Asia/Shanghai' | 'Asia/Singapore'
 * | 'Asia/Taipei' | 'Asia/Seoul' | 'Asia/Tokyo' | 'Australia/Brisbane'
 * | 'Australia/Adelaide' | 'Australia/Sydney' | 'Pacific/Norfolk'
 * | 'Pacific/Auckland' | 'Pacific/Fakaofo' | 'Pacific/Chatham'} Timezone (Chart) timezone
 */

/**
 * @typedef {'1' | '3' | '5' | '15' | '30'
 * | '45' | '60' | '120' | '180' | '240'
 * | '1D' | '1W' | '1M' | 'D' | 'W' | 'M'} TimeFrame
 */

const fieldType = {
  INTEGER: 'integer',
  FLOAT: 'float',
  BOOLEAN: 'bool',
  TEXT: 'text',
  SOURCE: 'source',
  RESOLUTION: 'resolution',
  SESSION: 'session',
  COLOR: 'color',
  TIME: 'time',
};

const canRemoveStrategyFields = [
  'pyramiding',
  'default_qty_type',
  'default_qty_value',
  'initial_capital',
  'currency',
  'slippage',
  'commission_type',
  'commission_value',
  'use_bar_magnifier',
];

const canHideStrategyFields = [
  'pineFeatures',
  'calc_on_order_fills',
  'calc_on_every_tick',
  'backtest_fill_limits_assumption',
  'process_orders_on_close',
  'close_entries_rule',
  'margin_long',
  'margin_short',
  'risk_free_rate',
  'fill_orders_on_standard_ohlc',
  'run_mode',
  'alert_message',
  'alert_type',
  'trim_orders',
  'exclude_from_report',
  '__profile',
];

const valuesFieldResolution = [
  { value: '', label: 'Chart' },
  { value: '30S', label: '30 seconds' },
  { value: '1', label: '1 minute' },
  { value: '5', label: '5 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
  { value: '240', label: '4 hours' },
  { value: 'D', label: '1 day' },
  { value: 'W', label: '1 week' },
  { value: 'M', label: '1 month' },
];

module.exports = {
  fieldType,
  valuesFieldResolution,
  canHideStrategyFields,
  canRemoveStrategyFields,
};
