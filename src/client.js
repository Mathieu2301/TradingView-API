const WebSocket = require('ws');

const misc = require('./miscRequests');

const quoteSessionGenerator = require('./quote/session');
const chartSessionGenerator = require('./quote/session');

/**
 * @typedef {Object} Session
 * @prop {'quote' | 'chart' | 'replay'} type Session type
 * @prop {(data: {}) => null} onData When there is a data
 */

/** @typedef {Object<string, Session>} SessionList Session list */

/**
 * @typedef {(t: string, p: []) => null} SendPacket Send a custom packet
 * @param {string} t Packet type
 * @param {string[]} p Packet data
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

module.exports = class Client {
  #ws;

  #logged = false;

  /** If the client is logged in */
  get logged() {
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
   * @event
   */
  onConnected(cb) {
    this.#callbacks.connected.push(cb);
  }

  /**
   * When client is disconnected
   * @param {() => void} cb Callback
   * @event
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

   * When client is logged
   * @param {(SocketSession: SocketSession) => void} cb Callback
   * @event
   */
  onLogged(cb) {
    this.#callbacks.logged.push(cb);
  }

  /**
   * When server is pinging the client
   * @param {(i: number) => void} cb Callback
   * @event
   */
  onPing(cb) {
    this.#callbacks.ping.push(cb);
  }

  /**
   * When unparsed data is received
   * @param {(...{}) => void} cb Callback
   * @event
   */
  onData(cb) {
    this.#callbacks.data.push(cb);
  }

  /**
   * When a client error happens
   * @param {(...{}) => void} cb Callback
   * @event
   */
  onError(cb) {
    this.#callbacks.error.push(cb);
  }

  /**
   * When a client event happens
   * @param {(...{}) => void} cb Callback
   * @event
   */
  onEvent(cb) {
    this.#callbacks.event.push(cb);
  }

  #parsePacket(str) {
    if (!this.isOpen) return;

    str.replace(/~h~/g, '').split(/~m~[0-9]{1,}~m~/g)
      .map((p) => {
        if (!p) return false;
        try {
          return JSON.parse(p);
        } catch (error) {
          console.warn('Cant parse', p);
          return false;
        }
      })
      .filter((p) => p)
      .forEach((packet) => {
        console.log('[CLIENT] PACKET', packet);
        if (typeof packet === 'number') { // Ping
          const pingStr = `~h~${packet}`;
          this.#ws.send(`~m~${pingStr.length}~m~${pingStr}`);
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
            session: packet.p[0],
            data: packet.p[1],
          };

          if (parsed.session && this.#sessions[parsed.session]) {
            this.#sessions[parsed.session].onData(parsed);
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
    const msg = JSON.stringify({ m: t, p });
    this.#sendQueue.push(`~m~${msg.length}~m~${msg}`);
    this.sendQueue();
  }

  /** Send all waiting packets */
  sendQueue() {
    while (this.isOpen && this.#sendQueue.length > 0) {
      const packet = this.#sendQueue.shift();
      this.#ws.send(packet);
    }
  }

  /**
   * @typedef {Object} ClientOptions
   * @prop {string} [token] User auth token (in 'sessionid' cookie)
   */

  /** Client object
   * @param {ClientOptions} clientOptions TradingView client options
   */
  constructor(clientOptions = {}) {
    this.#ws = new WebSocket('wss://widgetdata.tradingview.com/socket.io/websocket', {
      origin: 'https://s.tradingview.com',
    });

    if (clientOptions.token) {
      misc.getUser(clientOptions.token).then((user) => {
        this.send('set_auth_token', [user.authToken]);
      });
    } else this.send('set_auth_token', ['unauthorized_user_token']);

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
      this.#ws.close();
      cb();
    });
  }
};
