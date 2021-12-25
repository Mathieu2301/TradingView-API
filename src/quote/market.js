/**
 * @typedef {'loaded' | 'data' | 'error'} MarketEvent
 */

/**
 * @param {import('./session').QuoteSessionBridge} quoteSession
 */
module.exports = (quoteSession) => class QuoteMarket {
  #symbolListeners = quoteSession.symbolListeners;

  #symbol;

  #symbolListenerID = 0;

  #lastData = {};

  #callbacks = {
    loaded: [],
    data: [],

    event: [],
    error: [],
  };

  /**
   * @param {MarketEvent} ev Client event
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

  /**
   * @param {string} symbol Market symbol (like: 'BTCEUR' or 'KRAKEN:BTCEUR')
   */
  constructor(symbol) {
    this.#symbol = symbol;

    if (!this.#symbolListeners[symbol]) {
      this.#symbolListeners[symbol] = [];
      quoteSession.send('quote_add_symbols', [
        quoteSession.sessionID,
        symbol,
      ]);
    }
    this.#symbolListenerID = this.#symbolListeners[symbol].length;

    this.#symbolListeners[symbol][this.#symbolListenerID] = (packet) => {
      if (global.TW_DEBUG) console.log('§90§30§105 MARKET §0 DATA', packet);

      if (packet.type === 'qsd' && packet.data[1].s === 'ok') {
        this.#lastData = {
          ...this.#lastData,
          ...packet.data[1].v,
        };
        this.#handleEvent('data', this.#lastData);
        return;
      }

      if (packet.type === 'quote_completed') {
        this.#handleEvent('loaded');
        return;
      }

      if (packet.type === 'qsd' && packet.data[1].s === 'error') {
        this.#handleError('Market error', packet.data);
      }
    };
  }

  /**
   * When quote market is loaded
   * @param {() => void} cb Callback
   * @event
   */
  onLoaded(cb) {
    this.#callbacks.loaded.push(cb);
  }

  /**
   * When quote data is received
   * @param {(data: {}) => void} cb Callback
   * @event
   */
  onData(cb) {
    this.#callbacks.data.push(cb);
  }

  /**
   * When quote event happens
   * @param {(...any) => void} cb Callback
   * @event
   */
  onEvent(cb) {
    this.#callbacks.event.push(cb);
  }

  /**
   * When quote error happens
   * @param {(...any) => void} cb Callback
   * @event
   */
  onError(cb) {
    this.#callbacks.error.push(cb);
  }

  /** Close this listener */
  close() {
    if (this.#symbolListeners[this.#symbol].length <= 1) {
      quoteSession.send('quote_remove_symbols', [
        quoteSession.sessionID,
        this.#symbol,
      ]);
    }
    delete this.#symbolListeners[this.#symbol][this.#symbolListenerID];
  }
};
