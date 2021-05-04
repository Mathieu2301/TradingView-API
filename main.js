const WebSocket = require('ws');
const { search, getScreener, getTA } = require('./miscRequests');

let onPacket = () => null;

function parse(str) {
  const packets = str.replace(/~h~/g, '').split(/~m~[0-9]{1,}~m~/g).map((p) => {
    if (!p) return false;
    try {
      return JSON.parse(p);
    } catch (error) {
      console.log('Cant parse', p);
      return false;
    }
  }).filter((p) => p);

  packets.forEach((packet) => {
    if (packet.m === 'protocol_error') {
      return onPacket({
        type: 'error',
        syntax: packet.p[0],
      });
    }

    if (packet.m && packet.p) {
      return onPacket({
        type: packet.m,
        session: packet.p[0],
        data: packet.p[1],
      });
    }

    if (typeof packet === 'number') return onPacket({ type: 'ping', ping: packet });

    return onPacket({ type: 'info', ...packet });
  });
}

function genSession() {
  let r = '';
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 12; i += 1) r += c.charAt(Math.floor(Math.random() * c.length));
  return `qs_${r}`;
}

module.exports = () => {
  const callbacks = {
    connected: [],
    disconnected: [],
    logged: [],
    subscribed: [],
    ping: [],
    price: [],
    data: [],

    error: [],
    event: [],
  };

  function handleEvent(ev, ...data) {
    callbacks[ev].forEach((e) => e(...data));
    callbacks.event.forEach((e) => e(ev, ...data));
  }

  const ws = new WebSocket('wss://widgetdata.tradingview.com/socket.io/websocket', {
    origin: 'https://s.tradingview.com',
  });

  let logged = false;
  /** SessionID of the websocket connection */
  let sessionId = '';

  /** List of subscribed symbols */
  let subscribed = [];

  /**
   * Send a custom packet
   * @param {string} t Packet type
   * @param {string[]} p Packet data
   * @example
   * // Subscribe manualy to BTCEUR
   * send('quote_add_symbols', [sessionId, 'BTCEUR']);
  */
  function send(t, p = []) {
    if (!sessionId) return;

    const msg = JSON.stringify({ m: t, p });
    ws.send(`~m~${msg.length}~m~${msg}`);
  }

  ws.on('open', () => {
    sessionId = genSession();
    handleEvent('connected');
  });

  ws.on('close', () => {
    logged = false;
    sessionId = '';
    handleEvent('disconnected');
  });

  ws.on('message', parse);

  onPacket = (packet) => {
    if (packet.type === 'ping') {
      const pingStr = `~h~${packet.ping}`;
      ws.send(`~m~${pingStr.length}~m~${pingStr}`);
      handleEvent('ping', packet.ping);
      return;
    }

    if (packet.type === 'quote_completed' && packet.data) {
      handleEvent('subscribed', packet.data);
      return;
    }

    if (packet.type === 'qsd' && packet.data.n && packet.data.v.lp) {
      handleEvent('price', {
        symbol: packet.data.n,
        price: packet.data.v.lp,
      });

      return;
    }

    if (!logged && packet.type === 'info') {
      send('set_auth_token', ['unauthorized_user_token']);
      send('quote_create_session', [sessionId]);
      send('quote_set_fields', [sessionId, 'lp']);

      subscribed.forEach((symbol) => send('quote_add_symbols', [sessionId, symbol]));

      handleEvent('logged', packet);
      return;
    }

    if (packet.type === 'error') {
      handleEvent('error', { message: 'API error, please make sure you have the latest API version', syntax: packet.syntax });
      ws.close();
      return;
    }

    handleEvent('data', packet);
  };

  return {
    /**
     * @param {'connected' | 'disconnected' | 'logged'
     * | 'subscribed' | 'price' | 'data' | 'error' | 'ping' } ev
     * @param {(...data: object) => null} cb
     */
    on(ev, cb) {
      if (!callbacks[ev]) {
        console.log('Wrong event:', ev);
        console.log('Available events:', Object.keys(callbacks));
        return;
      }

      callbacks[ev].push(cb);
    },

    search,
    getScreener,
    getTA,
    subscribed,

    subscribe(symbol = '') {
      if (subscribed.includes(symbol)) return;
      send('quote_add_symbols', [sessionId, symbol]);
      subscribed.push(symbol);
    },

    unsubscribe(symbol = '') {
      if (!subscribed.includes(symbol)) return;
      send('quote_remove_symbols', [sessionId, symbol]);
      subscribed = subscribed.filter((s) => s !== symbol);
    },

    send,
    sessionId,
  };
};
