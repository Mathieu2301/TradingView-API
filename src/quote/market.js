/**
 * @typedef { 'loaded' | 'data' | 'error' } MarketEvent
 */

/**
 * @param {import('./session').QuoteSessionBridge} quoteSession
 */
module.exports = (quoteSession) => class QuoteMarket {
  #symbolList = quoteSession.symbols;

  #symbol;

  #symbolListenerID = 0;

  #callbacks = {
    loaded: [],
    data: [],

    event: [],
    error: [],
  };

  #lastData = {};

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

    if (!this.#symbolList[symbol]) {
      this.#symbolList[symbol] = [];
      quoteSession.send('quote_add_symbols', [
        quoteSession.sessionID,
        symbol,
      ]);
    }
    this.#symbolListenerID = this.#symbolList[symbol].length;

    this.#symbolList[symbol][this.#symbolListenerID] = (packet) => {
      console.log('[MARKET] DATA', packet);

      if (packet.type === 'qsd' && packet.data.s === 'ok') {
        this.#lastData = {
          ...this.#lastData,
          ...packet.data.v,
        };
        this.#handleEvent('data', this.#lastData);
        return;
      }

      if (packet.type === 'qsd' && packet.data.s === 'error') {
        this.#handleError('Market error', packet.data);
        return;
      }

      if (packet.type === 'quote_completed') {
        this.#handleEvent('loaded');
        return;
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
    if (this.#symbolList[this.#symbol].length <= 1) {
      quoteSession.send('quote_remove_symbols', [
        quoteSession.sessionID,
        this.#symbol,
      ]);
    }
    delete this.#symbolList[this.#symbol][this.#symbolListenerID];
  }
};
