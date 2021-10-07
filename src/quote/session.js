const { genSessionID } = require('../utils');

const quoteMarketConstructor = require('./market');

/** @typedef {Object<string, Function[]>} SymbolList */

/**
 * @typedef {Object} QuoteSessionBridge
 * @prop {string} sessionID
 * @prop {SymbolList} symbols
 * @prop {import('../client').SendPacket} send
*/

/**
 * @typedef {'base-currency-logoid'
 * | 'ch' | 'chp' | 'currency-logoid' | 'provider_id'
 * | 'currency_code' | 'current_session' | 'description'
 * | 'exchange' | 'format' | 'fractional' | 'is_tradable'
 * | 'language' | 'local_description' | 'logoid' | 'lp'
 * | 'lp_time' | 'minmov' | 'minmove2' | 'original_name'
 * | 'pricescale' | 'pro_name' | 'short_name' | 'type'
 * | 'update_mode' | 'volume' | 'ask' | 'bid' | 'fundamentals'
 * | 'high_price' | 'low_price' | 'open_price' | 'prev_close_price'
 * | 'rch' | 'rchp' | 'rtc' | 'rtc_time' | 'status' | 'industry'
 * | 'basic_eps_net_income' | 'beta_1_year' | 'market_cap_basic'
 * | 'earnings_per_share_basic_ttm' | 'price_earnings_ttm'
 * | 'sector' | 'dividends_yield' | 'timezone' | 'country_code'
 * } quoteField Quote data field
 */

/** @param {'all' | 'price'} fieldsType */
function getQuoteFields(fieldsType) {
  if (fieldsType === 'price') {
    return ['lp'];
  }

  return [
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
}

/**
 * @typedef {Object} quoteSessionOptions Quote Session options
 * @prop {'all' | 'price'} [fields] Asked quote fields
 * @prop {quoteField[]} [customFields] List of asked quote fields
 */

/**
 * @param {import('../client').ClientBridge} client
 */
module.exports = (client) => class QuoteSession {
  #sessionID = genSessionID('qs');

  #client = client;

  /** @type {SymbolList} */
  #symbols = {};

  /**
   * @param {quoteSessionOptions} options Quote settings options
   */
  constructor(options) {
    this.#client.sessions[this.#sessionID] = {
      type: 'quote',
      onData: (packet) => {
        console.log('[QUOTE SESSION] DATA', packet);

        if (packet.type === 'quote_completed' && this.#symbols[packet.data]) {
          this.#symbols[packet.data].forEach((h) => h(packet));
        }

        if (packet.type === 'qsd' && this.#symbols[packet.data.n]) {
          this.#symbols[packet.data.n].forEach((h) => h(packet));
        }
      },
    };

    const fields = (options.customFields && options.customFields.length > 0
      ? options.customFields
      : getQuoteFields(options.fields)
    );

    this.#client.send('quote_create_session', [this.#sessionID]);
    this.#client.send('quote_set_fields', [this.#sessionID, ...fields]);
  }

  /** @type {QuoteSessionBridge} */
  #quoteSession = {
    sessionID: this.#sessionID,
    symbols: this.#symbols,
    send: (t, p) => this.#client.send(t, p),
  };

  /** @constructor */
  Market = quoteMarketConstructor(this.#quoteSession);

  /** Delete the quote session */
  delete() {
    this.#quoteSession.send('quote_delete_session', [
      this.#quoteSession.sessionID,
    ]);
  }
};
