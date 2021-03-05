const WebSocket = require('ws');
const https = require('https');

function parse(str) {
  const data = JSON.parse(str.split('~').pop());

  if (data.m === 'protocol_error') return {
    type: 'error',
    syntax: data.p[0],
  }

  if (data.m && data.p) return {
    type: data.m,
    session: data.p[0],
    data: data.p[1],
  }

  if (typeof data === 'number') return { type: 'ping', ping: data }

  return { type: 'info', ...data }
}

function genSession() {
  let r = '';
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 12; i++) r += c.charAt(Math.floor(Math.random() * c.length));
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

  let ws = new WebSocket('wss://widgetdata.tradingview.com/socket.io/websocket?from=embed-widget%2Fmini-symbol-overview%2F&date=2021_03_04-12_35', {
    origin: 'https://s.tradingview.com',
  });

  function send(m = '', p = []) {
    if (!session) return;

    const msg = JSON.stringify({ m, p });
    ws.send(`~m~${msg.length}~m~${msg}`);
  }

  let logged = false;
  let session = '';

  ws.on('open', () => {
    session = genSession();
    handleEvent('connected');
  });

  ws.on('close', () => {
    logged = false;
    session = '';
    handleEvent('disconnected');
  });

  ws.on('message', (str) => {
    const data = parse(str);

    if (data.type === 'ping') {
      const pingStr = `~h~${data.ping}`;
      ws.send(`~m~${pingStr.length}~m~${pingStr}`);
      handleEvent('ping', data.ping);
      return;
    }

    if (data.type === 'quote_completed' && data.data) {
      handleEvent('subscribed', data.data);
      return;
    }

    if (data.type === 'qsd' && data.data.n && data.data.v.lp) {
      handleEvent('price', {
        symbol: data.data.n,
        price: data.data.v.lp,
      });

      return;
    }

    if (!logged && data.type === 'info') {
      send('set_auth_token', ['unauthorized_user_token']);
      send('quote_create_session', [session]);
      send('quote_set_fields', [session, 'lp']);
      
      handleEvent('logged', data);
      return;
    }

    if (data.type === 'error') {
      handleEvent('error', { message: 'API error, please make sure you have the latest API version', syntax: data.syntax });
      return;
    }

    handleEvent('data', data);
  });

  function handleEvent(ev, ...data) {
    callbacks[ev].forEach((e) => e(...data));
    callbacks.event.forEach((e) => e(ev, ...data));
  }

  return {
    on(ev, cb) {
      if (!callbacks[ev]) {
        console.log('Wrong event:', ev);
        console.log('Available events:', Object.keys(callbacks));
        return;
      }

      callbacks[ev].push(cb);
    },

    async search(search, filter = '') {
      return new Promise((cb, err) => {
        https.get({
          host: 'symbol-search.tradingview.com',
          path: `/symbol_search/?text=${search.replace(/ /g, '%20')}&type=${filter}`,
          origin: 'https://www.tradingview.com',
        }, (res) => {
          let rs = '';
          res.on('data', (d) => rs += d);
          res.on('end', () => {
            try {
              rs = JSON.parse(rs);
            } catch (e) {
              err(new Error('Can\'t parse server response'));
              return;
            }
            cb(rs.map((s) => ({
              id: `${s.exchange}:${s.symbol}`,
              symbol: s.symbol,
              description: s.description,
              type: s.type,
            })));
          });
          res.on('error', (e) => {
            err(e);
            return;
          });
        })
      });
    },

    subscribed: [],

    subscribe(symbol = '') {
      if (this.subscribed.includes(symbol)) return;
      send('quote_add_symbols', [session, symbol]);
      this.subscribed.push(symbol);
    },

    unsubscribe(symbol = '') {
      if (!this.subscribed.includes(symbol)) return;
      send('quote_remove_symbols', [session, symbol]);
      this.subscribed = this.subscribed.filter((s) => s !== symbol);
    },

    send,
  }
}
