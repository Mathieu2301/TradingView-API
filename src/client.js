const WebSocket = require('ws');

const misc = require('./miscRequests');
const protocol = require('./protocol');

const quoteSessionGenerator = require('./quote/session');
const chartSessionGenerator = require('./chart/session');


module.exports = class Client {
  #ws;

  #logged = false;

  get isLogged() {
    return this.#logged;
  }

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

  #handleEvent(ev, ...data) {
    this.#callbacks[ev].forEach((e) => e(...data));
    this.#callbacks.event.forEach((e) => e(ev, ...data));
  }

  #handleError(...msgs) {
    if (this.#callbacks.error.length === 0) console.error(...msgs);
    else this.#handleEvent('error', ...msgs);
  }

  onConnected(cb) {
    this.#callbacks.connected.push(cb);
  }

  onDisconnected(cb) {
    this.#callbacks.disconnected.push(cb);
  }

  onLogged(cb) {
    this.#callbacks.logged.push(cb);
  }

  onPing(cb) {
    this.#callbacks.ping.push(cb);
  }

  onData(cb) {
    this.#callbacks.data.push(cb);
  }

  onError(cb) {
    this.#callbacks.error.push(cb);
  }

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

  constructor(clientOptions = {}) {
    if (clientOptions.DEBUG) global.TW_DEBUG = clientOptions.DEBUG;

    const server = 'prodata';
    this.#ws = new WebSocket(`wss://${server}.tradingview.com/socket.io/websocket?&type=chart`, {
      origin: 'https://s.tradingview.com',
    });

    if (clientOptions.token) {
      misc.getUser(
        clientOptions.token,
        clientOptions.signature ? clientOptions.signature : '',
        clientOptions.location ? clientOptions.location : "https://tradingview.com",
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

  #clientBridge = {
    sessions: this.#sessions,
    send: (t, p) => this.send(t, p),
  };
  
  Session = {
    Quote: quoteSessionGenerator(this.#clientBridge),
    Chart: chartSessionGenerator(this.#clientBridge),
  };

  end() {
    return new Promise((cb) => {
      if (this.#ws.readyState) this.#ws.close();
      cb();
    });
  }
};
