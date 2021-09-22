const https = require('https');

const indicators = ['Recommend.Other', 'Recommend.All', 'Recommend.MA'];

function fetchScanData(tickers = [], type = '', columns = []) {
  return new Promise((cb, err) => {
    const req = https.request({
      method: 'POST',
      hostname: 'scanner.tradingview.com',
      path: `/${type}/scan`,
      headers: {
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (!data.startsWith('{')) {
          err(new Error('Wrong screener or symbol'));
          return;
        }
        try {
          cb(JSON.parse(data));
        } catch (error) {
          err(new Error('Can\'t parse server response'));
        }
      });
    });

    req.on('error', err);
    req.end(JSON.stringify({ symbols: { tickers }, columns }));
  });
}

/**
 * @typedef {number} advice
 *
 * @typedef {{ Other: advice, All: advice, MA: advice }} Period
 *
 * @typedef {{
 *  '1': Period,
 *  '5': Period,
 *  '15': Period,
 *  '60': Period,
 *  '240': Period,
 *  '1D': Period,
 *  '1W': Period,
 *  '1M': Period,
 * }} Periods
 *
 * @typedef {string | 'forex' | 'crypto'
 * | 'america' | 'australia' | 'canada' | 'egypt'
 * | 'germany' | 'india' | 'israel' | 'italy'
 * | 'luxembourg' | 'poland' | 'sweden' | 'turkey'
 * | 'uk' | 'vietnam'} screener
 * You can use `getScreener(exchange)` function for non-forex and non-crypto markets.
 */

module.exports = {
  /**
   * @param {string} exchange Example: BINANCE, EURONEXT, NASDAQ
   * @returns {screener}
  */
  getScreener(exchange) {
    const e = exchange.toUpperCase();
    if (['NASDAQ', 'NYSE', 'NYSE ARCA', 'OTC'].includes(e)) return 'america';
    if (['ASX'].includes(e)) return 'australia';
    if (['TSX', 'TSXV', 'CSE', 'NEO'].includes(e)) return 'canada';
    if (['EGX'].includes(e)) return 'egypt';
    if (['FWB', 'SWB', 'XETR'].includes(e)) return 'germany';
    if (['BSE', 'NSE'].includes(e)) return 'india';
    if (['TASE'].includes(e)) return 'israel';
    if (['MIL', 'MILSEDEX'].includes(e)) return 'italy';
    if (['LUXSE'].includes(e)) return 'luxembourg';
    if (['NEWCONNECT'].includes(e)) return 'poland';
    if (['NGM'].includes(e)) return 'sweden';
    if (['BIST'].includes(e)) return 'turkey';
    if (['LSE', 'LSIN'].includes(e)) return 'uk';
    if (['HNX'].includes(e)) return 'vietnam';
    return exchange.toLowerCase();
  },

  /**
   * Get technical analysis
   * @param {screener} screener
   * @param {string} id Full market id (Example: COINBASE:BTCEUR)
   * @returns {Promise<Periods>} results
   */
  async getTA(screener, id) {
    const advice = {};

    const cols = ['1', '5', '15', '60', '240', '1D', '1W', '1M']
      .map((t) => indicators.map((i) => (t !== '1D' ? `${i}|${t}` : i)))
      .flat();

    const rs = await fetchScanData([id], screener, cols);
    if (!rs.data || !rs.data[0]) return false;

    rs.data[0].d.forEach((val, i) => {
      const [name, period] = cols[i].split('|');
      const pName = period || '1D';
      if (!advice[pName]) advice[pName] = {};
      advice[pName][name.split('.').pop()] = Math.round(val * 1000) / 500;
    });

    return advice;
  },

  /**
   * @typedef {Object} SearchResult
   * @property {string} id
   * @property {string} exchange
   * @property {string} fullExchange
   * @property {string} screener
   * @property {string} symbol
   * @property {string} description
   * @property {string} type
   * @property {() => Promise<Periods>} getTA
   */

  /**
   * Find a symbol
   * @param {string} search Keywords
   * @param {'stock' | 'futures' | 'forex' | 'cfd' | 'crypto' | 'index' | 'economic'} [filter]
   * @returns {Promise<SearchResult[]>} Search results
   */
  async search(search, filter = '') {
    return new Promise((cb, err) => {
      https.get({
        host: 'symbol-search.tradingview.com',
        path: `/symbol_search/?text=${search.replace(/ /g, '%20')}&type=${filter}`,
        origin: 'https://www.tradingview.com',
      }, (res) => {
        let rs = '';
        res.on('data', (d) => { rs += d; });
        res.on('end', () => {
          try {
            rs = JSON.parse(rs);
          } catch (e) {
            err(new Error('Can\'t parse server response'));
            return;
          }

          cb(rs.map((s) => {
            const exchange = s.exchange.split(' ')[0];
            const id = `${exchange}:${s.symbol}`;

            const screener = (['forex', 'crypto'].includes(s.type)
              ? s.type
              : this.getScreener(exchange)
            );

            return {
              id,
              exchange,
              fullExchange: s.exchange,
              screener,
              symbol: s.symbol,
              description: s.description,
              type: s.type,
              getTA: () => this.getTA(screener, id),
            };
          }));
        });

        res.on('error', err);
      });
    });
  },

  /**
   * @typedef {Object} indicatorInput
   * @property {string} name
   * @property {string} inline Inline name
   * @property { 'text' | 'source' | 'integer' | 'float' | 'resolution' | 'bool' } type
   * @property {string | number | boolean} value
   * @property {string | number | boolean} defVal
   * @property {boolean} hidden
   * @property {boolean} isFake
   * @property {string[]} [options]
   */

  /**
   * @typedef {Object} Indicator
   * @property {string} pineId Indicator ID
   * @property {string} pineVersion Indicator version
   * @property {string} description Indicator description
   * @property {string} shortDescription Indicator short description
   * @property {Object<string, indicatorInput>} inputs Indicator inputs
   * @property {Object<string, string>} plots Indicator plots
   * @property {string} script Indicator script
   */

  /**
   * Get an indicator
   * @param {string} id Indicator ID (Like: PUB;XXXXXXXXXXXXXXXXXXXXX)
   * @param {string} version Wanted version of the indicator
   * @returns {Promise<Indicator>} Indicator
   */
  async getIndicator(id, version, settings = []) {
    return new Promise((cb, err) => {
      https.get(`https://pine-facade.tradingview.com/pine-facade/translate/${id}/${version}`, (res) => {
        let rs = '';
        res.on('data', (d) => { rs += d; });
        res.on('end', () => {
          try {
            rs = JSON.parse(rs);
          } catch (e) {
            err(new Error('Inexistent or unsupported indicator'));
            return;
          }

          if (!rs.success || !rs.result.metaInfo || !rs.result.metaInfo.inputs) {
            err(new Error('Inexistent or unsupported indicator'));
            return;
          }

          const inputs = {};

          rs.result.metaInfo.inputs.forEach((input) => {
            if (['text', 'pineId', 'pineVersion'].includes(input.id)) return;
            const inline = input.inline || input.name.replace(/ /g, '_').replace(/[^a-zA-Z0-9]/g, '');

            const i = parseInt(input.id.replace(/[^0-9]/g, ''), 10);

            inputs[input.id] = {
              name: input.name,
              type: input.type,
              value: settings[i] ?? input.defval,
              defVal: input.defval,
              hidden: !!input.isHidden,
              isFake: !!input.isFake,
              inline,
            };

            if (input.options) inputs[input.id].options = input.options;
          });

          const plots = {};

          Object.keys(rs.result.metaInfo.styles).forEach((plotId) => {
            plots[plotId] = rs.result.metaInfo.styles[plotId].title.replace(/ /g, '_').replace(/[^a-zA-Z0-9]/g, '');
          });

          cb({
            pineId: id,
            pineVersion: version,
            description: rs.result.metaInfo.description,
            shortDescription: rs.result.metaInfo.shortDescription,
            inputs,
            plots,
            script: rs.result.ilTemplate,
          });
        });

        res.on('error', err);
      });
    });
  },

  /**
   * @typedef {Object} User Instance of User
   * @property {number} id User ID
   * @property {string} username User username
   * @property {string} firstName User first name
   * @property {string} lastName User last name
   * @property {number} reputation User reputation
   * @property {number} following Number of following accounts
   * @property {number} followers Number of followers
   * @property {Object} notifications User's notifications
   * @property {number} notifications.user User notifications
   * @property {number} notifications.following Notification from following accounts
   * @property {string} session User session
   * @property {string} sessionHash User session hash
   * @property {string} privateChannel User private channel
   * @property {string} authToken User auth token
   * @property {Date} joinDate Account creation date
   */

  /**
   * Get a token for an user from a 'sessionid' cookie
   * @param {string} session User 'sessionid' cookie
   * @param {string} [location] Auth page location (For france: https://fr.tradingview.com/)
   * @returns {Promise<User>} Token
   */
  async getUser(session, location = 'https://www.tradingview.com/') {
    return new Promise((cb, err) => {
      https.get(location, {
        headers: { cookie: `sessionid=${session}` },
      }, (res) => {
        let rs = '';
        res.on('data', (d) => { rs += d; });
        res.on('end', async () => {
          if (res.headers.location && location !== res.headers.location) {
            cb(await module.exports.getUser(session, res.headers.location));
            return;
          }
          if (rs.includes('auth_token')) {
            cb({
              id: /"id":([0-9]{1,10}),/.exec(rs)[1],
              username: /"username":"(.*?)"/.exec(rs)[1],
              firstName: /"first_name":"(.*?)"/.exec(rs)[1],
              lastName: /"last_name":"(.*?)"/.exec(rs)[1],
              reputation: parseFloat(/"reputation":(.*?),/.exec(rs)[1] || 0),
              following: parseFloat(/,"following":([0-9]*?),/.exec(rs)[1] || 0),
              followers: parseFloat(/,"followers":([0-9]*?),/.exec(rs)[1] || 0),
              notifications: {
                following: parseFloat(/"notification_count":\{"following":([0-9]*),/.exec(rs)[1] || 0),
                user: parseFloat(/"notification_count":\{"following":[0-9]*,"user":([0-9]*)/.exec(rs)[1] || 0),
              },
              session,
              sessionHash: /"session_hash":"(.*?)"/.exec(rs)[1],
              privateChannel: /"private_channel":"(.*?)"/.exec(rs)[1],
              authToken: /"auth_token":"(.*?)"/.exec(rs)[1],
              joinDate: new Date(/"date_joined":"(.*?)"/.exec(rs)[1] || 0),
            });
          } else err(new Error('Wrong or expired sessionid'));
        });

        res.on('error', err);
      }).end();
    });
  },

  /**
   * User credentials
   * @typedef {Object} UserCredentials
   * @property {number} id User ID
   * @property {string} session User session ('sessionid' cookie)
   */

  /**
   * Get a chart token from a layout ID and the user credentials if the layout is not public
   * @param {string} layout The layout ID found in the layout URL (Like: 'XXXXXXXX')
   * @param {UserCredentials} [credentials] User credentials (id + session)
   * @returns {Promise<string>} Token
   */
  async getChartToken(layout, credentials = {}) {
    return new Promise((cb, err) => {
      const creds = credentials.id && credentials.session;
      const userID = creds ? credentials.id : -1;
      const session = creds ? credentials.session : null;

      https.get(`https://www.tradingview.com/chart-token/?image_url=${layout}&user_id=${userID}`, {
        headers: { cookie: session ? `sessionid=${session}` : '' },
      }, (res) => {
        let rs = '';
        res.on('data', (d) => { rs += d; });
        res.on('end', async () => {
          rs = JSON.parse(rs);

          if (rs.token) cb(rs.token);
          else err(new Error('Wrong layout or credentials'));
        });

        res.on('error', err);
      }).end();
    });
  },

  /**
   * @typedef {Object} DrawingPoint
   * @property {number} time_t Point X time position
   * @property {number} price Point Y price position
   * @property {number} offset Point offset
   */

  /**
   * @typedef {Object} Drawing
   * @property {string} id Drawing ID (Like: 'XXXXXX')
   * @property {string} symbol Layout market symbol (Like: 'BINANCE:BUCEUR')
   * @property {string} ownerSource Owner user ID (Like: 'XXXXXX')
   * @property {string} serverUpdateTime Drawing last update timestamp
   * @property {string} currencyId Currency ID (Like: 'EUR')
   * @property {any} unitId Unit ID
   * @property {string} type Drawing type
   * @property {DrawingPoint[]} points List of drawing points
   * @property {number} zorder Drawing Z order
   * @property {string} linkKey Drawing link key
   * @property {Object} state Drawing state
   */

  /**
   * Get a chart token from a layout ID and the user credentials if the layout is not public
   * @param {string} layout The layout ID found in the layout URL (Like: 'XXXXXXXX')
   * @param {string | ''} [symbol] Market filter (Like: 'BINANCE:BTCEUR')
   * @param {UserCredentials} [credentials] User credentials (id + session)
   * @param {number} [chartID = 1] Chart ID
   * @returns {Promise<Drawing[]>} Drawings
   */
  async getDrawings(layout, symbol = '', credentials = {}, chartID = 1) {
    const chartToken = await module.exports.getChartToken(layout, credentials);

    return new Promise((cb, err) => {
      const creds = credentials.id && credentials.session;
      const session = creds ? credentials.session : null;

      const url = `https://charts-storage.tradingview.com/charts-storage/layout/${
        layout}/sources?chart_id=${chartID}&jwt=${chartToken}${symbol ? `&symbol=${symbol}` : ''}`;

      https.get(url, {
        headers: { cookie: session ? `sessionid=${session}` : '' },
      }, (res) => {
        let rs = '';
        res.on('data', (d) => { rs += d; });
        res.on('end', async () => {
          rs = JSON.parse(rs);

          if (rs.payload) {
            cb(Object.values(rs.payload.sources || {}).map((drawing) => ({
              ...drawing, ...drawing.state,
            })));
          } else err(new Error('Wrong layout, user credentials, or chart id.'));
        });

        res.on('error', err);
      }).end();
    });
  },
};
