const { genSessionID } = require('../utils');

const studyConstructor = require('./study');

/** @typedef {Object<string, Function[]>} StudyListeners */

/**
 * @typedef {Object} ChartSessionBridge
 * @prop {string} sessionID
 * @prop {StudyListeners} studyListeners
 * @prop {import('../client').SendPacket} send
*/

/**
 * @typedef {'seriesLoaded' | 'symbolLoaded' | 'update' | 'error'} ChartEvent
 */

/**
 * @typedef {Object} PricePeriod
 * @prop {number} time Period timestamp
 * @prop {number} open Period open value
 * @prop {number} close Period close value
 * @prop {number} max Period max value
 * @prop {number} min Period min value
 * @prop {number} change Period change absolute value
 */

/**
 * @typedef {Object} Subsession
 * @prop {string} id Subsession ID (ex: 'regular')
 * @prop {string} description Subsession description (ex: 'Regular')
 * @prop {string} privat If private
 * @prop {string} session Session (ex: '24x7')
 * @prop {string} session-display Session display (ex: '24x7')
 *
 * @typedef {Object} MarketInfos
 * @prop {string} series_id            Used series (ex: 'sds_sym_1')
 * @prop {string} base_currency        Base currency (ex: 'BTC')
 * @prop {string} base_currency_id     Base currency ID (ex: 'XTVCBTC')
 * @prop {string} name                 Market short name (ex: 'BTCEUR')
 * @prop {string} full_name            Market full name (ex: 'COINBASE:BTCEUR')
 * @prop {string} pro_name             Market pro name (ex: 'COINBASE:BTCEUR')
 * @prop {string} description          Market symbol description (ex: 'BTC/EUR')
 * @prop {string} short_description    Market symbol short description (ex: 'BTC/EUR')
 * @prop {string} exchange             Market exchange (ex: 'COINBASE')
 * @prop {string} listed_exchange      Market exchange (ex: 'COINBASE')
 * @prop {string} provider_id          Values provider ID (ex: 'coinbase')
 * @prop {string} currency_id          Used currency ID (ex: 'EUR')
 * @prop {string} currency_code        Used currency code (ex: 'EUR')
 * @prop {string} variable_tick_size   Variable tick size
 * @prop {number} pricescale           Price scale
 * @prop {number} pointvalue           Point value
 * @prop {string} session              Session (ex: '24x7')
 * @prop {string} session_display      Session display (ex: '24x7')
 * @prop {string} type                 Market type (ex: 'crypto')
 * @prop {boolean} has_intraday        If intraday values are available
 * @prop {boolean} fractional          If market is fractional
 * @prop {boolean} is_tradable         If the market is curently tradable
 * @prop {number} minmov               Minimum move value
 * @prop {number} minmove2             Minimum move value 2
 * @prop {string} timezone             Used timezone
 * @prop {boolean} is_replayable       If the replay mode is available
 * @prop {boolean} has_adjustment      If the adjustment mode is enabled ????
 * @prop {boolean} has_extended_hours  Has extended hours
 * @prop {string} bar_source           Bar source
 * @prop {string} bar_transform        Bar transform
 * @prop {boolean} bar_fillgaps        Bar fill gaps
 * @prop {string} allowed_adjustment   Allowed adjustment (ex: 'none')
 * @prop {string} subsession_id        Subsession ID (ex: 'regular')
 * @prop {string} pro_perm             Pro permission (ex: '')
 * @prop {[]} base_name                Base name (ex: ['COINBASE:BTCEUR'])
 * @prop {[]} legs                     Legs (ex: ['COINBASE:BTCEUR'])
 * @prop {Subsession[]} subsessions    Sub sessions
 * @prop {[]} typespecs                Typespecs (ex: [])
 * @prop {[]} resolutions              Resolutions (ex: [])
 * @prop {[]} aliases                  Aliases (ex: [])
 * @prop {[]} alternatives             Alternatives (ex: [])
 */

/**
 * @param {import('../client').ClientBridge} client
 */
module.exports = (client) => class ChartSession {
  #sessionID = genSessionID('cs');

  /** Parent client */
  #client = client;

  /** @type {StudyListeners} */
  #studyListeners = {};

  /**
   * Table of periods values indexed by timestamp
   * @type {Object<number, PricePeriod[]>}
   */
  #periods = {};

  /** @return {PricePeriod[]} List of periods values */
  get periods() {
    return Object.values(this.#periods).sort((a, b) => b.time - a.time);
  }

  #callbacks = {
    seriesLoaded: [],
    symbolLoaded: [],
    update: [],

    event: [],
    error: [],
  };

  /**
   * @param {ChartEvent} ev Client event
   * @param {...{}} data Packet data
   */
  #handleEvent(ev, ...data) {
    this.#callbacks[ev].forEach((e) => e(...data));
    this.#callbacks.event.forEach((e) => e(ev, ...data));
  }

  #handleError(...msgs) {
    if (this.#callbacks.error.length === 0) console.error(...msgs);
    else this.#handleEvent('error', ...msgs);
  }

  constructor() {
    this.#client.sessions[this.#sessionID] = {
      type: 'chart',
      onData: (packet) => {
        console.log('§90§30§106 CHART SESSION §0 DATA', packet);

        if (typeof packet.data[1] === 'string' && this.#studyListeners[packet.data[1]]) {
          this.#studyListeners[packet.data[1]](packet);
          return;
        }

        if (packet.type === 'symbol_resolved') {
          this.#handleEvent('symbolLoaded', {
            series_id: packet.data[1],
            ...packet.data[2],
          });
          return;
        }

        if (['timescale_update', 'du'].includes(packet.type)) {
          Object.keys(packet.data[1]).forEach((k) => {
            if (k === '$prices') {
              const periods = packet.data[1].$prices;
              if (!periods || !periods.s) return;

              periods.s.forEach((p) => {
                this.#periods[p.v[0]] = {
                  time: p.v[0],
                  open: p.v[1],
                  close: p.v[4],
                  max: p.v[2],
                  min: p.v[3],
                  change: Math.round(p.v[5] * 100) / 100,
                };
              });

              return;
            }

            if (this.#studyListeners[k]) this.#studyListeners[k](packet);
          });

          this.#handleEvent('update');
          return;
        }

        if (packet.type === 'symbol_error') {
          this.#handleError(`(${packet.data[1]}) Symbol error:`, packet.data[2]);
          return;
        }

        if (packet.type === 'series_error') {
          this.#handleError('Series error:', packet.data);
          return;
        }

        if (packet.type === 'critical_error') {
          const [, name, description] = packet.data;
          this.#handleError('Critical error:', name, description);
        }
      },
    };

    this.#client.send('chart_create_session', [this.#sessionID]);
  }

  #series = []

  /**
   * @param {import('../types').TimeFrame} timeframe Chart period timeframe
   * @param {number} [range] Number of loaded periods/candles (Default: 100)
   * @param {string} [ID] Series ID (Default: 'sds_sym_1')
   */
  setSeries(timeframe = '240', range = 100, ID = 'sds_sym_1') {
    this.#periods = {};
    this.#client.send(`${this.#series.includes(ID) ? 'modify' : 'create'}_series`, [
      this.#sessionID,
      '$prices',
      's1',
      ID,
      timeframe,
      !this.#series.includes(ID) ? range : '',
    ]);

    if (!this.#series.includes(ID)) this.#series.push(ID);
  }

  /**
   * Set the chart market
   * @param {string} symbol Market symbol
   * @param {Object} [options] Market options
   * @param {'splits' | 'dividends'} [options.adjustment] Market adjustment
   * @param {string} [options.series] Series ID (Default: 'sds_sym_1')
   */
  setMarket(symbol, options = {}) {
    this.#periods = {};

    this.#client.send('resolve_symbol', [
      this.#sessionID,
      options.series || 'sds_sym_1',
      `={"symbol":"${symbol || 'BTCEUR'}","adjustment":"${options.adjustment || 'splits'}","session":"regular"}`,
    ]);
  }

  /**
   * Set the chart timezone
   * @param {import('../types').Timezone} timezone New timezone
   */
  setTimezone(timezone) {
    this.#periods = {};
    this.#client.send('switch_timezone', [this.#sessionID, timezone]);
  }

  /**
   * Fetch x additional previous periods/candles values
   * @param {number} number Number of additional periods/candles you want to fetch
   */
  fetchMore(number = 1) {
    this.#client.send('request_more_data', [this.#sessionID, '$prices', number]);
  }

  /**
   * When a symbol is loaded
   * @param {(marketInfos: MarketInfos) => void} cb
   * @event
   */
  onSymbolLoaded(cb) {
    this.#callbacks.symbolLoaded.push(cb);
  }

  /**
   * When a chart update happens
   * @param {() => void} cb
   * @event
   */
  onUpdate(cb) {
    this.#callbacks.update.push(cb);
  }

  /**
   * When chart error happens
   * @param {(...any) => void} cb Callback
   * @event
   */
  onError(cb) {
    this.#callbacks.error.push(cb);
  }

  /** @type {ChartSessionBridge} */
  #chartSession = {
    sessionID: this.#sessionID,
    studyListeners: this.#studyListeners,
    send: (t, p) => this.#client.send(t, p),
  };

  Study = studyConstructor(this.#chartSession);

  /** Delete the chart session */
  delete() {
    this.#client.send('quote_delete_session', [this.#sessionID]);
    delete this.#client.sessions[this.#sessionID];
  }
};
