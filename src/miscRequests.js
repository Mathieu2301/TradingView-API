const os = require('os');
const axios = require('axios');

const PineIndicator = require('./classes/PineIndicator');
const {
  tvDomain,
  tvFindIndicatorUrl,
  tvSignInUrl,
  tvChartTokenUrl,
} = require('./utils');

const validateStatus = (status) => status < 500;

const indicators = ['Recommend.Other', 'Recommend.All', 'Recommend.MA'];
const builtInIndicList = [];

async function fetchScanData(tickers = [], type = '', columns = []) {
  const { data } = await axios.post(`https://scanner.tradingview.com/${type}/scan`, {
      symbols: { tickers },
      columns,
    }, { validateStatus });

  return data;
}

/** @typedef {number} advice */

/**
 * @typedef {{
 *   Other: advice,
 *   All: advice,
 *   MA: advice
 * }} Period
 */

/**
 * @typedef {{
 *  '1': Period,
 *  '5': Period,
 *  '15': Period,
 *  '60': Period,
 *  '240': Period,
 *  '1D': Period,
 *  '1W': Period,
 *  '1M': Period
 * }} Periods
 */

// /**
//  * @typedef {string | 'forex' | 'crypto'
//  * | 'america' | 'australia' | 'canada' | 'egypt'
//  * | 'germany' | 'india' | 'israel' | 'italy'
//  * | 'luxembourg' | 'poland' | 'sweden' | 'turkey'
//  * | 'uk' | 'vietnam'} Screener
//  * You can use `getScreener(exchange)` function for non-forex and non-crypto markets.
//  */

module.exports = {
  // /**
  //  * Get a screener from an exchange
  //  * @function getScreener
  //  * @param {string} exchange Example: BINANCE, EURONEXT, NASDAQ
  //  * @returns {Screener}
  // */
  // getScreener(exchange) {
  //   const e = exchange.toUpperCase();
  //   if (['NASDAQ', 'NYSE', 'NYSE ARCA', 'OTC'].includes(e)) return 'america';
  //   if (['ASX'].includes(e)) return 'australia';
  //   if (['TSX', 'TSXV', 'CSE', 'NEO'].includes(e)) return 'canada';
  //   if (['EGX'].includes(e)) return 'egypt';
  //   if (['FWB', 'SWB', 'XETR'].includes(e)) return 'germany';
  //   if (['BSE', 'NSE'].includes(e)) return 'india';
  //   if (['TASE'].includes(e)) return 'israel';
  //   if (['MIL', 'MILSEDEX'].includes(e)) return 'italy';
  //   if (['LUXSE'].includes(e)) return 'luxembourg';
  //   if (['NEWCONNECT'].includes(e)) return 'poland';
  //   if (['NGM'].includes(e)) return 'sweden';
  //   if (['BIST'].includes(e)) return 'turkey';
  //   if (['LSE', 'LSIN'].includes(e)) return 'uk';
  //   if (['HNX'].includes(e)) return 'vietnam';
  //   return 'global';
  // },

  /**
   * Get technical analysis
   * @function getTA
   * @param {Screener} screener Market screener
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
   * @typedef {Object} SearchMarketResult
   * @prop {string} id Market full symbol
   * @prop {string} exchange Market exchange name
   * @prop {string} fullExchange Market exchange full name
   * @prop {Screener | 'forex' | 'crypto'} screener Market screener
   * @prop {string} symbol Market symbol
   * @prop {string} description Market name
   * @prop {string} type Market type
   * @prop {() => Promise<Periods>} getTA Get market technical analysis
   */

  /**
   * Find a symbol
   * @function searchMarket
   * @param {string} search Keywords
   * @param {'stock'
   *  | 'futures' | 'forex' | 'cfd'
   *  | 'crypto' | 'index' | 'economic'
   * } [filter] Caterogy filter
   * @returns {Promise<SearchMarketResult[]>} Search results
   */
  async searchMarket(search, filter = '') {
    const { data } = await axios.get(
      `https://symbol-search.tradingview.com/symbol_search/?text=${search.replace(/ /g, '%20')}&type=${filter}`,
      {
        validateStatus,
        headers: {
          origin: tvDomain,
        },
      },
    );

    return data.map((s) => {
      const exchange = s.exchange.split(' ')[0];
      const id = `${exchange}:${s.symbol}`;

      // const screener = (['forex', 'crypto'].includes(s.type)
      //   ? s.type
      //   : this.getScreener(exchange)
      // );
      const screener = 'global';

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
    });
  },

  /**
   * @typedef {Object} SearchIndicatorResult
   * @prop {string} id Script ID
   * @prop {string} version Script version
   * @prop {string} name Script complete name
   * @prop {{ id: number, username: string }} author Author user ID
   * @prop {string} image Image ID https://tradingview.com/i/${image}
   * @prop {string | ''} source Script source (if available)
   * @prop {'study' | 'strategy'} type Script type (study / strategy)
   * @prop {'open_source' | 'closed_source' | 'invite_only'
   *  | 'private' | 'other'} access Script access type
   * @prop {() => Promise<PineIndicator>} get Get the full indicator informations
   */

  /**
   * Find an indicator
   * @function searchIndicator
   * @param {string} search Keywords
   * @returns {Promise<SearchIndicatorResult[]>} Search results
   */
  async searchIndicator(search = '') {
    if (!builtInIndicList.length) {
      await Promise.all(['standard', 'candlestick', 'fundamental'].map(async (type) => {
          const { data } = await axios.get(
            `https://pine-facade.tradingview.com/pine-facade/list/?filter=${type}`,
            { validateStatus },
          );
          builtInIndicList.push(...data);
        }));
    }

    const { data } = await axios.get(
      `${tvFindIndicatorUrl}?search=${search.replace(/ /g, '%20')}`,
      { validateStatus },
    );

    function norm(str = '') {
      return str.toUpperCase().replace(/[^A-Z]/g, '');
    }

    return [
      ...builtInIndicList.filter((i) => (
            norm(i.scriptName).includes(norm(search))
        || norm(i.extra.shortDescription).includes(norm(search))
        )).map((ind) => ({
          id: ind.scriptIdPart,
          version: ind.version,
          name: ind.scriptName,
          author: {
            id: ind.userId,
            username: '@TRADINGVIEW@',
          },
          image: '',
          access: 'closed_source',
          source: '',
          type: (ind.extra && ind.extra.kind) ? ind.extra.kind : 'study',
          get() {
            return module.exports.getIndicator(ind.scriptIdPart, ind.version);
          },
        })),

      ...data.results.map((ind) => ({
        id: ind.scriptIdPart,
        version: ind.version,
        name: ind.scriptName,
        author: {
          id: ind.author.id,
          username: ind.author.username,
        },
        image: ind.imageUrl,
        access: ['open_source', 'closed_source', 'invite_only'][ind.access - 1] || 'other',
        source: ind.scriptSource,
        type: (ind.extra && ind.extra.kind) ? ind.extra.kind : 'study',
        get() {
          return module.exports.getIndicator(ind.scriptIdPart, ind.version);
        },
      })),
    ];
  },

  /**
   * Get an indicator
   * @function getIndicator
   * @param {string} id Indicator ID (Like: PUB;XXXXXXXXXXXXXXXXXXXXX)
   * @param {'last' | string} [version] Wanted version of the indicator
   * @returns {Promise<PineIndicator>} Indicator
   */
  async getIndicator(id, version = 'last') {
    const indicID = id.replace(/ |%/g, '%25');

    const { data } = await axios.get(
      `https://pine-facade.tradingview.com/pine-facade/translate/${indicID}/${version}`,
      { validateStatus },
    );

    if (!data.success || !data.result.metaInfo || !data.result.metaInfo.inputs) {
      throw new Error(`Inexistent or unsupported indicator: "${data.reason}"`);
    }

    const inputs = {};

    data.result.metaInfo.inputs.forEach((input) => {
      if (['text', 'pineId', 'pineVersion'].includes(input.id)) return;

      const inlineName = input.name.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '');

      inputs[input.id] = {
        name: input.name,
        inline: input.inline || inlineName,
        internalID: input.internalID || inlineName,
        tooltip: input.tooltip,

        type: input.type,
        value: input.defval,
        isHidden: !!input.isHidden,
        isFake: !!input.isFake,
      };

      if (input.options) inputs[input.id].options = input.options;
    });

    const plots = {};

    Object.keys(data.result.metaInfo.styles).forEach((plotId) => {
      const plotTitle = data
        .result
        .metaInfo
        .styles[plotId]
        .title
        .replace(/ /g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '');

      const titles = Object.values(plots);

      if (titles.includes(plotTitle)) {
        let i = 2;
        while (titles.includes(`${plotTitle}_${i}`)) i += 1;
        plots[plotId] = `${plotTitle}_${i}`;
      } else plots[plotId] = plotTitle;
    });

    data.result.metaInfo.plots.forEach((plot) => {
      if (!plot.target) return;
      plots[plot.id] = `${plots[plot.target] ?? plot.target}_${plot.type}`;
    });

    return new PineIndicator({
      pineId: data.result.metaInfo.scriptIdPart || indicID,
      pineVersion: data.result.metaInfo.pine.version || version,
      description: data.result.metaInfo.description,
      shortDescription: data.result.metaInfo.shortDescription,
      inputs,
      plots,
      script: data.result.ilTemplate,
    });
  },

  /**
   * @typedef {Object} User Instance of User
   * @prop {number} id User ID
   * @prop {string} username User username
   * @prop {string} firstName User first name
   * @prop {string} lastName User last name
   * @prop {number} reputation User reputation
   * @prop {number} following Number of following accounts
   * @prop {number} followers Number of followers
   * @prop {Object} notifications User's notifications
   * @prop {number} notifications.user User notifications
   * @prop {number} notifications.following Notification from following accounts
   * @prop {string} session User session
   * @prop {string} sessionHash User session hash
   * @prop {string} signature User session signature
   * @prop {string} privateChannel User private channel
   * @prop {string} authToken User auth token
   * @prop {Date} joinDate Account creation date
   */

  /**
   * Get user and sessionid from username/email and password
   * @function loginUser
   * @param {string} username User username/email
   * @param {string} password User password
   * @param {boolean} [remember] Remember the session (default: false)
   * @param {string} [UA] Custom UserAgent
   * @returns {Promise<User>} Token
   */
  async loginUser(username, password, remember = true, UA = 'TWAPI/3.0') {
    const { data, headers } = await axios.post(
      tvSignInUrl,
      `username=${username}&password=${password}${remember ? '&remember=on' : ''}`,
      {
        validateStatus,
        headers: {
          referer: tvDomain,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-agent': `${UA} (${os.version()}; ${os.platform()}; ${os.arch()})`,
        },
      },
    );

    const cookies = headers['set-cookie'];

    if (data.error) throw new Error(data.error);

    const sessionCookie = cookies.find((c) => c.includes('sessionid='));
    const session = (sessionCookie.match(/sessionid=(.*?);/) ?? [])[1];

    const signCookie = cookies.find((c) => c.includes('sessionid_sign='));
    const signature = (signCookie.match(/sessionid_sign=(.*?);/) ?? [])[1];

    return {
      id: data.user.id,
      username: data.user.username,
      firstName: data.user.first_name,
      lastName: data.user.last_name,
      reputation: data.user.reputation,
      following: data.user.following,
      followers: data.user.followers,
      notifications: data.user.notification_count,
      session,
      signature,
      sessionHash: data.user.session_hash,
      privateChannel: data.user.private_channel,
      authToken: data.user.auth_token,
      joinDate: new Date(data.user.date_joined),
    };
  },

  /**
   * Get user from 'sessionid' cookie
   * @function getUser
   * @param {string} session User 'sessionid' cookie
   * @param {string} [signature] User 'sessionid_sign' cookie
   * @param {string} [location] Auth page location (For france: https://fr.tradingview.com/)
   * @returns {Promise<User>} Token
   */
  async getUser(session, signature = '', location = tvDomain) {
    const { data } = await axios.get(location, {
      validateStatus,
      headers: {
        cookie: `sessionid=${session}${signature ? `;sessionid_sign=${signature};` : ''}`,
      },
    });

    if (data.includes('auth_token')) {
      return {
        id: /"id":([0-9]{1,10}),/.exec(data)?.[1],
        username: /"username":"(.*?)"/.exec(data)?.[1],
        firstName: /"first_name":"(.*?)"/.exec(data)?.[1],
        lastName: /"last_name":"(.*?)"/.exec(data)?.[1],
        reputation: parseFloat(/"reputation":(.*?),/.exec(data)?.[1] || 0),
        following: parseFloat(/,"following":([0-9]*?),/.exec(data)?.[1] || 0),
        followers: parseFloat(/,"followers":([0-9]*?),/.exec(data)?.[1] || 0),
        notifications: {
          following: parseFloat(/"notification_count":\{"following":([0-9]*),/.exec(data)?.[1] || 0),
          user: parseFloat(/"notification_count":\{"following":[0-9]*,"user":([0-9]*)/.exec(data)?.[1] || 0),
        },
        session,
        signature,
        sessionHash: /"session_hash":"(.*?)"/.exec(data)?.[1],
        privateChannel: /"private_channel":"(.*?)"/.exec(data)?.[1],
        authToken: /"auth_token":"(.*?)"/.exec(data)?.[1],
        joinDate: new Date(/"date_joined":"(.*?)"/.exec(data)?.[1] || 0),
      };
    }

    throw new Error('Wrong or expired sessionid/signature');
  },

  /**
   * Get user's private indicators from a 'sessionid' cookie
   * @function getPrivateIndicators
   * @param {string} session User 'sessionid' cookie
   * @param {string} [signature] User 'sessionid_sign' cookie
   * @returns {Promise<SearchIndicatorResult[]>} Search results
   */
  async getPrivateIndicators(session, signature = '') {
    const { data } = await axios.get('https://pine-facade.tradingview.com/pine-facade/list?filter=saved', {
        validateStatus,
        headers: {
          cookie: `sessionid=${session}${signature ? `;sessionid_sign=${signature};` : ''}`,
        },
      });

    return data.map((ind) => ({
      id: ind.scriptIdPart,
      version: ind.version,
      name: ind.scriptName,
      author: {
        id: -1,
        username: '@ME@',
      },
      image: ind.imageUrl,
      access: 'private',
      source: ind.scriptSource,
      type: (ind.extra && ind.extra.kind) ? ind.extra.kind : 'study',
      get() {
        return module.exports.getIndicator(ind.scriptIdPart, ind.version);
      },
    }));
  },

  /**
   * User credentials
   * @typedef {Object} UserCredentials
   * @prop {number} id User ID
   * @prop {string} session User session ('sessionid' cookie)
   * @prop {string} [signature] User session signature ('sessionid_sign' cookie)
   */

  /**
   * Get a chart token from a layout ID and the user credentials if the layout is not public
   * @function getChartToken
   * @param {string} layout The layout ID found in the layout URL (Like: 'XXXXXXXX')
   * @param {UserCredentials} [credentials] User credentials (id + session + [signature])
   * @returns {Promise<string>} Token
   */
  async getChartToken(layout, credentials = {}) {
    const { id, session, signature } = (
      credentials.id && credentials.session
        ? credentials
        : { id: -1, session: null, signature: null }
    );

    const { data } = await axios.get(
      `${tvChartTokenUrl}?image_url=${layout}&user_id=${id}`,
      {
        validateStatus,
        headers: {
          cookie: session
            ? `sessionid=${session}${signature ? `;sessionid_sign=${signature};` : ''}`
            : '',
        },
      },
    );

    if (!data.token) throw new Error('Wrong layout or credentials');

    return data.token;
  },

  /**
   * @typedef {Object} DrawingPoint Drawing poitn
   * @prop {number} time_t Point X time position
   * @prop {number} price Point Y price position
   * @prop {number} offset Point offset
   */

  /**
   * @typedef {Object} Drawing
   * @prop {string} id Drawing ID (Like: 'XXXXXX')
   * @prop {string} symbol Layout market symbol (Like: 'BINANCE:BUCEUR')
   * @prop {string} ownerSource Owner user ID (Like: 'XXXXXX')
   * @prop {string} serverUpdateTime Drawing last update timestamp
   * @prop {string} currencyId Currency ID (Like: 'EUR')
   * @prop {any} unitId Unit ID
   * @prop {string} type Drawing type
   * @prop {DrawingPoint[]} points List of drawing points
   * @prop {number} zorder Drawing Z order
   * @prop {string} linkKey Drawing link key
   * @prop {Object} state Drawing state
   */

  /**
   * Get a chart token from a layout ID and the user credentials if the layout is not public
   * @function getDrawings
   * @param {string} layout The layout ID found in the layout URL (Like: 'XXXXXXXX')
   * @param {string | ''} [symbol] Market filter (Like: 'BINANCE:BTCEUR')
   * @param {UserCredentials} [credentials] User credentials (id + session + [signature])
   * @param {number} [chartID] Chart ID
   * @returns {Promise<Drawing[]>} Drawings
   */
  async getDrawings(layout, symbol = '', credentials = {}, chartID = '_shared') {
    const chartToken = await module.exports.getChartToken(layout, credentials);

    const { data } = await axios.get(
      `https://charts-storage.tradingview.com/charts-storage/get/layout/${
        layout
      }/sources?chart_id=${
        chartID
      }&jwt=${
        chartToken
      }${
        (symbol ? `&symbol=${symbol}` : '')
      }`,
      { validateStatus },
    );

    if (!data.payload) throw new Error('Wrong layout, user credentials, or chart id.');

    return Object.values(data.payload.sources || {}).map((drawing) => ({
      ...drawing, ...drawing.state,
    }));
  },
};
