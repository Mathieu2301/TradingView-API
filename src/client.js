const WebSocket = require('ws');

const misc = require('./miscRequests');
const protocol = require('./protocol');

const quoteSessionGenerator = require('./quote/session');
const chartSessionGenerator = require('./chart/session');

/**
 * @typedef {Object} Session
 * @prop {'quote' | 'chart' | 'replay'} type Session type
 * @prop {(data: {}) => null} onData When there is a data
 */

/** @typedef {Object<string, Session>} SessionList Session list */

/**
 * @callback SendPacket Send a custom packet
 * @param {string} t Packet type
 * @param {string[]} p Packet data
 * @returns {void}
*/

/**
 * @typedef {Object} ClientBridge
 * @prop {SessionList} sessions
 * @prop {SendPacket} send
 */

/**
 * @typedef { 'connected' | 'disconnected'
 *  | 'logged' | 'ping' | 'data'
 *  | 'error' | 'event'
 * } ClientEvent
 */

/** @class */
module.exports = class Client {
  #ws;

  #logged = false;

  /** If the client is logged in */
  get isLogged() {
    return this.#logged;
  }

  /** If the cient was closed */
  get isOpen() {
    return this.#ws.readyState === this.#ws.OPEN;
  }

  /** @type {SessionList} */
  #sessions = {};

  #callbacks = {
    connected: [],
    disconnected: [],
    logged: [],
    ping: [],
    data: [],

    error: [],
    event: [],
  };

  /**
   * @param {ClientEvent} ev Client event
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
   * When client is connected
   * @param {() => void} cb Callback
   * @event onConnected
   */
  onConnected(cb) {
    this.#callbacks.connected.push(cb);
  }

  /**
   * When client is disconnected
   * @param {() => void} cb Callback
   * @event onDisconnected
   */
  onDisconnected(cb) {
    this.#callbacks.disconnected.push(cb);
  }

  /**
   * @typedef {Object} SocketSession
   * @prop {string} session_id Socket session ID
   * @prop {number} timestamp Session start timestamp
   * @prop {number} timestampMs Session start milliseconds timestamp
   * @prop {string} release Release
   * @prop {string} studies_metadata_hash Studies metadata hash
   * @prop {'json' | string} protocol Used protocol
   * @prop {string} javastudies Javastudies
   * @prop {number} auth_scheme_vsn Auth scheme type
   * @prop {string} via Socket IP
   */

  /**
   * When client is logged
   * @param {(SocketSession: SocketSession) => void} cb Callback
   * @event onLogged
   */
  onLogged(cb) {
    this.#callbacks.logged.push(cb);
  }

  /**
   * When server is pinging the client
   * @param {(i: number) => void} cb Callback
   * @event onPing
   */
  onPing(cb) {
    this.#callbacks.ping.push(cb);
  }

  /**
   * When unparsed data is received
   * @param {(...{}) => void} cb Callback
   * @event onData
   */
  onData(cb) {
    this.#callbacks.data.push(cb);
  }

  /**
   * When a client error happens
   * @param {(...{}) => void} cb Callback
   * @event onError
   */
  onError(cb) {
    this.#callbacks.error.push(cb);
  }

  /**
   * When a client event happens
   * @param {(...{}) => void} cb Callback
   * @event onEvent
   */
  onEvent(cb) {
    this.#callbacks.event.push(cb);
  }

  #parsePacket(str) {
    if (!this.isOpen) return;

    protocol.parseWSPacket(str).forEach((packet) => {
      if (global.TW_DEBUG) console.log('§90§30§107 CLIENT §0 PACKET', packet);
      if (typeof packet === 'number') { // Ping
        this.#ws.send(protocol.formatWSPacket(`~h~${packet}`));
        this.#handleEvent('ping', packet);
        return;
      }

      if (packet.m === 'protocol_error') { // Error
        this.#handleError('Client critical error:', packet.p);
        this.#ws.close();
        return;
      }

      if (packet.m && packet.p) { // Normal packet
        const parsed = {
          type: packet.m,
          data: packet.p,
        };

        const session = packet.p[0];

        if (session && this.#sessions[session]) {
          this.#sessions[session].onData(parsed);
          return;
        }
      }

      if (!this.#logged) {
        this.#handleEvent('logged', packet);
        return;
      }

      this.#handleEvent('data', packet);
    });
  }

  #sendQueue = [];

  /** @type {SendPacket} Send a custom packet */
  send(t, p = []) {
    this.#sendQueue.push(protocol.formatWSPacket({ m: t, p }));
    this.sendQueue();
  }

  /** Send all waiting packets */
  sendQueue() {
    while (this.isOpen && this.#logged && this.#sendQueue.length > 0) {
      const packet = this.#sendQueue.shift();
      this.#ws.send(packet);
      if (global.TW_DEBUG) console.log('§90§30§107 > §0', packet);
    }
  }

  /**
   * @typedef {Object} ClientOptions
   * @prop {string} [token] User auth token (in 'sessionid' cookie)
   * @prop {string} [signature] User auth token signature (in 'sessionid_sign' cookie)
   * @prop {boolean} [DEBUG] Enable debug mode
   * @prop {'data' | 'prodata' | 'widgetdata'} [server] Server type
   * @prop {string} [location] Auth page location (For france: https://fr.tradingview.com/)
   */

  /**
   * Client object
   * @param {ClientOptions} clientOptions TradingView client options
   */
  constructor(clientOptions = {}) {
    if (clientOptions.DEBUG) global.TW_DEBUG = clientOptions.DEBUG;

    const server = clientOptions.server || 'data';
    this.#ws = new WebSocket(`wss://${server}.tradingview.com/socket.io/websocket?type=chart`, {
      origin: 'https://www.tradingview.com',
    });

    if (clientOptions.token) {
      misc.getUser(
        clientOptions.token,
        clientOptions.signature ? clientOptions.signature : '',
        clientOptions.location ? clientOptions.location : 'https://tradingview.com',
      ).then((user) => {
        this.#sendQueue.unshift(protocol.formatWSPacket({
          m: 'set_auth_token',
          p: [user.authToken],
        }));
        this.#logged = true;
        this.sendQueue();
      }).catch((err) => {
        this.#handleError('Credentials error:', err.message);
      });
    } else {
      this.#sendQueue.unshift(protocol.formatWSPacket({
        m: 'set_auth_token',
        p: ['unauthorized_user_token'],
      }));
      this.#logged = true;
      this.sendQueue();
    }

    this.#ws.on('open', () => {
      this.#handleEvent('connected');
      this.sendQueue();
    });

    this.#ws.on('close', () => {
      this.#logged = false;
      this.#handleEvent('disconnected');
    });

    this.#ws.on('message', (data) => this.#parsePacket(data));
  }

  /** @type {ClientBridge} */
  #clientBridge = {
    sessions: this.#sessions,
    send: (t, p) => this.send(t, p),
  };

  /** @namespace Session */
  Session = {
    Quote: quoteSessionGenerator(this.#clientBridge),
    Chart: chartSessionGenerator(this.#clientBridge),
  };

  /**
   * Close the websocket connection
   * @return {Promise<void>} When websocket is closed
   */
  end() {
    return new Promise((cb) => {
      if (this.#ws.readyState) this.#ws.close();
      cb();
    });
  }
};
