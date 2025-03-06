const os = require('os');
const axios = require('axios');
const zlib = require('zlib');

const PineIndicator = require('./classes/PineIndicator');
const { genAuthCookies, toTitleCase } = require('./utils');
const { createLayoutContentBlob } = require('./layout/contentBlob');

const validateStatus = (status) => status < 500;

const indicators = ['Recommend.Other', 'Recommend.All', 'Recommend.MA'];
const builtInIndicList = [];

async function fetchScanData(tickers = [], columns = []) {
  const { data } = await axios.post('https://scanner.tradingview.com/global/scan', {
    symbols: { tickers }, columns,
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

module.exports = {
  /**
     * Get technical analysis
     * @function getTA
     * @param {string} id Full market id (Example: COINBASE:BTCEUR)
     * @returns {Promise<Periods>} results
     */
  async getTA(id) {
    const advice = {};

    const cols = ['1', '5', '15', '60', '240', '1D', '1W', '1M']
      .map((t) => indicators.map((i) => (t !== '1D' ? `${i}|${t}` : i)))
      .flat();

    const rs = await fetchScanData([id], cols);
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
     * @prop {string} symbol Market symbol
     * @prop {string} description Market name
     * @prop {string} type Market type
     * @prop {() => Promise<Periods>} getTA Get market technical analysis
     */

  /**
     * Find a symbol (deprecated)
     * @function searchMarket
     * @param {string} search Keywords
     * @param {'stock'
     *  | 'futures' | 'forex' | 'cfd'
     *  | 'crypto' | 'index' | 'economic'
     * } [filter] Caterogy filter
     * @returns {Promise<SearchMarketResult[]>} Search results
     * @deprecated Use searchMarketV3 instead
     */
  async searchMarket(search, filter = '') {
    const { data } = await axios.get('https://symbol-search.tradingview.com/symbol_search', {
      params: {
        text: search.replace(/ /g, '%20'), type: filter,
      },
      headers: {
        origin: 'https://www.tradingview.com',
      },
      validateStatus,
    });

    return data.map((s) => {
      const exchange = s.exchange.split(' ')[0];
      const id = `${exchange}:${s.symbol}`;

      return {
        id,
        exchange,
        fullExchange: s.exchange,
        symbol: s.symbol,
        description: s.description,
        type: s.type,
        getTA: () => this.getTA(id),
      };
    });
  },

  /**
     * Find a symbol
     * @function searchMarketV3
     * @param {string} search Keywords
     * @param {'stock'
     *  | 'futures' | 'forex' | 'cfd'
     *  | 'crypto' | 'index' | 'economic'
     * } [filter] Caterogy filter
     * @returns {Promise<SearchMarketResult[]>} Search results
     */
  async searchMarketV3(search, filter = '') {
    const splittedSearch = search.toUpperCase().replace(/ /g, '+').split(':');

    const request = await axios.get('https://symbol-search.tradingview.com/symbol_search/v3', {
      params: {
        exchange: (splittedSearch.length === 2 ? splittedSearch[0] : undefined),
        text: splittedSearch.pop(),
        search_type: filter,
      },
      headers: {
        origin: 'https://www.tradingview.com',
      },
      validateStatus,
    });

    const { data } = request;

    return data.symbols.map((s) => {
      const exchange = s.exchange.split(' ')[0];
      const id = `${exchange.toUpperCase()}:${s.symbol}`;

      return {
        id,
        exchange,
        fullExchange: s.exchange,
        symbol: s.symbol,
        description: s.description,
        type: s.type,
        getTA: () => this.getTA(id),
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
        const { data } = await axios.get('https://pine-facade.tradingview.com/pine-facade/list', {
          params: {
            filter: type,
          },
          validateStatus,
        });
        builtInIndicList.push(...data);
      }));
    }

    const { data } = await axios.get('https://www.tradingview.com/pubscripts-suggest-json', {
      params: {
        search: search.replace(/ /g, '%20'),
      },
      validateStatus,
    });

    function norm(str = '') {
      return str.toUpperCase().replace(/[^A-Z]/g, '');
    }

    // eslint-disable-next-line max-len
    return [...builtInIndicList.filter((i) => (norm(i.scriptName).includes(norm(search)) || norm(i.extra.shortDescription).includes(norm(search)))).map((ind) => ({
      id: ind.scriptIdPart,
      version: ind.version,
      name: ind.scriptName,
      author: {
        id: ind.userId, username: '@TRADINGVIEW@',
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
        id: ind.author.id, username: ind.author.username,
      },
      image: ind.imageUrl,
      access: ['open_source', 'closed_source', 'invite_only'][ind.access - 1] || 'other',
      source: ind.scriptSource,
      type: (ind.extra && ind.extra.kind) ? ind.extra.kind : 'study',
      get() {
        return module.exports.getIndicator(ind.scriptIdPart, ind.version);
      },
    }))];
  },

  /**
     * Get an indicator
     * @function getIndicator
     * @param {string} id Indicator ID (Like: PUB;XXXXXXXXXXXXXXXXXXXXX)
     * @param {'last' | string} [version] Wanted version of the indicator
     * @param {string} [session] User 'sessionid' cookie
     * @param {string} [signature] User 'sessionid_sign' cookie
     * @returns {Promise<PineIndicator>} Indicator
     */
  async getIndicator(id, version = 'last', session = '', signature = '') {
    const indicID = id.replace(/ |%/g, '%25');

    const { data } = await axios.get(`https://pine-facade.tradingview.com/pine-facade/translate/${indicID}/${version}`, {
      headers: {
        cookie: genAuthCookies(session, signature),
      },
      validateStatus,
    });

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
      const plotTitle = data.result.metaInfo.styles[plotId]
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
     * Get a raw indicator
     * @function getRawIndicator
     * @param {string} id Indicator ID (Like: PUB;XXXXXXXXXXXXXXXXXXXXX)
     * @param {'last' | string} [version] Wanted version of the indicator
     * @param {string} [session] User 'sessionid' cookie
     * @param {string} [signature] User 'sessionid_sign' cookie
     * @returns {Promise<RawPineIndicator>} RawPineIndicator
     */
  async getRawIndicator(id, version = 'last', session = '', signature = '') {
    const indicID = id.replace(/ |%/g, '%25');

    const { data } = await axios.get(`https://pine-facade.tradingview.com/pine-facade/translate/${indicID}/${version}`, {
      headers: {
        cookie: genAuthCookies(session, signature),
      },
      validateStatus,
    });

    if (!data.success || !data.result.metaInfo || !data.result.metaInfo.inputs) {
      throw new Error(`Non-existent or unsupported indicator: '${id}' '${data.reason}'`);
    }

    const indicator = {
      ...data?.result,

      get inputValues() {
        return this.metaInfo.defaults.inputs;
      },

      get inputs() {
        return this.metaInfo.inputs;
      },

      setInputValue(inputKey, value) {
        this.metaInfo.defaults.inputs[inputKey] = value;
      },
    };

    return indicator;
  },

  /**
     * Load a personal/custom indicator
     * @function getPersonalIndicator
     * @param {string} id Indicator ID (Like: USER;XXXXXXXXXXXXXXXXXXXXX)
     * @param {string} session User 'sessionid' cookie
     * @param {string} [signature] User 'sessionid_sign' cookie
     * @returns {Promise<PineIndicator>} Indicator
     */
  async getPersonalIndicator(id, session, signature) {
    const indicID = id.replace(/ |%/g, '%25').replace(';', '%3B');

    const { data } = await axios.get(`https://pine-facade.tradingview.com/pine-facade/translate/${indicID}/last`, {
      validateStatus,
      headers: {
        cookie: `sessionid=${session}${signature ? `;sessionid_sign=${signature};` : ''}`,
      },
    });

    if (data === 'The user requesting information on the script is not allowed to do so') throw new Error('User does not have access to this script.');

    if (!data.success || !data.result.metaInfo || !data.result.metaInfo.inputs) throw new Error(`Non-existent or unsupported indicator: '${id}' '${data.reason}'`);

    const inputs = {};

    data.result.metaInfo.inputs.forEach((input) => {
      if (['text', 'pineId', 'pineVersion'].includes(input.id)) return;

      const inlineName = input.name
        .replace(/ /g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '');

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
      const plotTitle = data.result.metaInfo.styles[plotId].title
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
      pineVersion: data.result.metaInfo.pine.version,
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
     * @prop {boolean} has_active_email Whether the user has an active email
     * @prop {Date} date_joined Account creation date
     * @prop {string} userpic User profile picture URL
     * @prop {string} userpic_mid Medium-sized profile picture URL
     * @prop {string} userpic_big Large-sized profile picture URL
     * @prop {string} status User status
     * @prop {boolean} must_change_password Whether the user must change their password
     * @prop {boolean} must_change_tfa Whether the user must enable two-factor authentication
     * @prop {string} private_channel User private channel
     * @prop {string} session_hash User session hash
     * @prop {boolean} notification_popup Whether notifications pop up
     * @prop {boolean} notification_sound Whether notification sounds are enabled
     * @prop {Object} notification_count User's notifications
     * @prop {number} notification_count.user User notifications
     * @prop {number} notification_count.following Notifications from following accounts
     * @prop {number} reputation User reputation
     * @prop {number} max_user_language_reputation Maximum reputation in a language
     * @prop {boolean} profile_data_filled Whether the profile is fully filled out
     * @prop {boolean} is_corporation_user Whether the user is a corporation
     * @prop {any} active_broker Active broker information (nullable)
     * @prop {Array<any>} ignore_list List of ignored users
     * @prop {boolean} is_active_partner Whether the user is an active partner
     * @prop {boolean} is_broker Whether the user is a broker
     * @prop {any} broker_plan User's broker plan (nullable)
     * @prop {Array<any>} badges User's badges
     * @prop {Object} permissions User's permissions
     * @prop {boolean} is_symphony Whether the user is a Symphony member
     * @prop {boolean} is_staff Whether the user is a staff member
     * @prop {boolean} is_superuser Whether the user is a superuser
     * @prop {boolean} is_moderator Whether the user is a moderator
     * @prop {string} last_locale Last used locale
     * @prop {boolean} social_registration Whether the user registered via social login
     * @prop {boolean} has_phone Whether the user has a phone number linked
     * @prop {string|null} sms_email SMS email (nullable)
     * @prop {boolean} is_non_pro_confirmed Whether the user is confirmed as non-pro
     * @prop {boolean} do_not_track Whether the user has opted out of tracking
     * @prop {boolean} is_pro Whether the user has a Pro plan
     * @prop {boolean} is_expert Whether the user is an expert
     * @prop {boolean} is_trial Whether the user is on a trial plan
     * @prop {boolean} is_lite_plan Whether the user is on a Lite plan
     * @prop {boolean|null} pro_being_cancelled Whether the Pro plan is being canceled (nullable)
     * @prop {number} pro_plan_days_left Days left on the Pro plan
     * @prop {string} pro_plan_original_name Original name of the Pro plan
     * @prop {string} pro_plan Current Pro plan type
     * @prop {string} pro_plan_billing_cycle Billing cycle of the Pro plan
     * @prop {number|null} trial_days_left Days left on the trial (nullable)
     * @prop {string} trial_days_left_text Text representation of trial days left
     * @prop {Object} available_offers Available offers for the user
     * @prop {boolean} had_pro Whether the user had a Pro plan before
     * @prop {string} declared_status User's declared status (e.g., "non_pro")
     * @prop {string|null} declared_status_timestamp Timestamp of declared status update (nullable)
     * @prop {string|null} market_profile_updated_timestamp Timestamp of last market profile update
     * @prop {boolean} force_to_complete_data Whether the user is forced to complete their profile
     * @prop {boolean} force_to_upgrade Whether the user is forced to upgrade their plan
     * @prop {boolean} is_support_available Whether customer support is available for the user
     * @prop {boolean} disallow_adding_to_private_chats user is restricted from private chats
     * @prop {string} picture_url User's profile picture URL
     */

  /**
     * @typedef {Object} TwoFactorTypes Instance of User
     * @prop {string} name 2fa detail message
     * @prop {number} code_ttl 2fa dtaill code
     */

  /**
     * @typedef {Object} TwoFactorInfoMessage Instance of User
     * @prop {string} detail 2fa detail message
     * @prop {string} code 2fa dtaill code
     * @prop {TwoFactorTypes[]} two_factor_types List of drawing points
     */

  /**
     * @typedef {Object} LoginResponse Instance of User
     * @prop {string} session User session
     * @prop {string} signature User session signature
     * @prop {User} [User] User Object
     * @prop {TwoFactorInfoMessage} [two_factor_info] User Object
     * @prop {TwoFactorTypes[]} two_factor_types 2fa info messages
     */

  /**
     * Get user and sessionid from username/email and password
     * @function loginUser
     * @param {string} username User username/email
     * @param {string} password User password
     * @param {boolean} [remember] Remember the session (default: false)
     * @param {string} [UA] Custom UserAgent
     * @returns {Promise<LoginResponse>} Login response
     */
  async loginUser(username, password, remember = true, UA = 'TWAPI/3.0') {
    const {
      data, headers,
    } = await axios.post('https://www.tradingview.com/accounts/signin/', `username=${username}&password=${password}${remember ? '&remember=on' : ''}`, {
      headers: {
        referer: 'https://www.tradingview.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-agent': `${UA} (${os.version()}; ${os.platform()}; ${os.arch()})`,
      },
      validateStatus,
    });

    const cookies = headers['set-cookie'];

    const sessionCookie = cookies?.find((c) => c.includes('sessionid='));
    const session = (sessionCookie?.match(/sessionid=(.*?);/) ?? [])[1];

    const signCookie = cookies?.find((c) => c.includes('sessionid_sign='));
    const signature = (signCookie?.match(/sessionid_sign=(.*?);/) ?? [])[1];

    if (data.error) {
      if (data.error.includes('2FA_required')) {
        return {
          session,
          signature,
          two_factor_info: {
            ...data,
          },
        };
      }

      throw new Error(data.error);
    }

    if (data.code?.includes('2FA_challenge_not_generated')) {
      return {
        two_factor_info: {
          ...data,
        },
      };
    }

    return {
      ...data,
      session,
      signature,
    };
  },

  /**
     * Get user and sessionid from username/email and password
     * @function twoFactorAuth
     * @param {string} code User username/email
     * @param {string} session sission id
     * @param {boolean} signature session sign
     * @param {string} [twoFaType] 2fa type: "sms" | "totp"
     * @param {string} [UA] Custom UserAgent
     * @returns {Promise<LoginResponse>} Login response
     */
  async twoFactorAuth(code, session, signature, twoFaType = 'sms', UA = 'TWAPI/3.0') {
    const type = twoFaType === 'sms' ? 'sms' : 'totp';

    const { data, headers } = await axios.post(
      `https://www.tradingview.com/accounts/two-factor/signin/${type}/`,
      `code=${code}`,
      {
        validateStatus,
        headers: {
          referer: 'https://www.tradingview.com',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-agent': `${UA} (${os.version()}; ${os.platform()}; ${os.arch()})`,
          cookie: `sessionid=${session}${
            signature ? `;sessionid_sign=${signature};` : ''
          }`,
        },
      },
    );

    if (data.code) {
      return {
        two_factor_info: {
          ...data,
        },
      };
    }

    const cookies = headers['set-cookie'];

    const sessionCookie = cookies.find((c) => c.includes('sessionid='));

    const signCookie = cookies.find((c) => c.includes('sessionid_sign='));

    return {
      session: (sessionCookie.match(/sessionid=(.*?);/) ?? [])[1],
      signature: (signCookie.match(/sessionid_sign=(.*?);/) ?? [])[1],
      ...data,
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
  async getUser(session, signature = '', location = 'https://www.tradingview.com/') {
    const { data } = await axios.get(location, {
      headers: {
        cookie: genAuthCookies(session, signature),
      },
      validateStatus,
    });

    if (data.includes('auth_token')) {
      return {
        session,
        signature,

        id: Number(/"id":([0-9]{1,10}),/.exec(data)?.[1]),
        username: /"username":"(.*?)"/.exec(data)?.[1],
        first_name: /"first_name":"(.*?)"/.exec(data)?.[1],
        last_name: /"last_name":"(.*?)"/.exec(data)?.[1],
        reputation: parseFloat(/"reputation":(.*?),/.exec(data)?.[1] || 0),
        following: parseFloat(/"following":([0-9]*?),/.exec(data)?.[1] || 0),
        followers: parseFloat(/"followers":([0-9]*?),/.exec(data)?.[1] || 0),
        notification_count: {
          user: parseFloat(/"notification_count":\{"following":[0-9]*,"user":([0-9]*)/.exec(data)?.[1] ?? 0),
          following: parseFloat(/"notification_count":\{"following":([0-9]*),/.exec(data)?.[1] ?? 0),
        },
        session_hash: /"session_hash":"(.*?)"/.exec(data)?.[1],
        private_channel: /"private_channel":"(.*?)"/.exec(data)?.[1],
        auth_token: /"auth_token":"(.*?)"/.exec(data)?.[1],
        joinDate: new Date(/"date_joined":"(.*?)"/.exec(data)?.[1] || 0),
        has_active_email: !!/"has_active_email":\s*(true|false)/.exec(data)?.[1],
        userpic: /"userpic":"(.*?)"/.exec(data)?.[1],
        userpic_mid: /"userpic_mid":"(.*?)"/.exec(data)?.[1],
        userpic_big: /"userpic_big":"(.*?)"/.exec(data)?.[1],
        status: /"status":"(.*?)"/.exec(data)?.[1],
        must_change_password: !!/"must_change_password":\s*(true|false)/.exec(data)?.[1],
        must_change_tfa: !!/"must_change_tfa":\s*(true|false)/.exec(data)?.[1],
        notification_popup: !!/"notification_popup":\s*(true|false)/.exec(data)?.[1],
        notification_sound: !!/"notification_sound":\s*(true|false)/.exec(data)?.[1],
        max_user_language_reputation: parseFloat(/"max_user_language_reputation":([0-9]*?),/.exec(data)?.[1] || 0),
        profile_data_filled: !!/"profile_data_filled":\s*(true|false)/.exec(data)?.[1],
        is_corporation_user: !!/"is_corporation_user":\s*(true|false)/.exec(data)?.[1],
        active_broker: /"active_broker":"(.*?)"/.exec(data)?.[1],
        ignore_list: /"ignore_list":"(.*?)"/.exec(data)?.[1],
        is_active_partner: !!/"is_active_partner":\s*(true|false)/.exec(data)?.[1],
        is_broker: !!/"is_broker":\s*(true|false)/.exec(data)?.[1],
        broker_plan: /"broker_plan":"(.*?)"/.exec(data)?.[1],
        badges: /"badges":"(.*?)"/.exec(data)?.[1],
        permissions: /"permissions":"(.*?)"/.exec(data)?.[1],
        is_symphony: !!/"is_symphony":\s*(true|false)/.exec(data)?.[1],
        is_staff: !!/"is_staff":\s*(true|false)/.exec(data)?.[1],
        is_superuser: !!/"is_superuser":\s*(true|false)/.exec(data)?.[1],
        is_moderator: !!/"is_moderator":\s*(true|false)/.exec(data)?.[1],
        last_locale: /"last_locale":"(.*?)"/.exec(data)?.[1],
        social_registration: !!/"social_registration":\s*(true|false)/.exec(data)?.[1],
        has_phone: !!/"has_phone":\s*(true|false)/.exec(data)?.[1],
        sms_email: /"sms_email":"(.*?)"/.exec(data)?.[1],
        is_non_pro_confirmed: !!/"is_non_pro_confirmed":\s*(true|false)/.exec(data)?.[1],
        do_not_track: !!/"do_not_track":\s*(true|false)/.exec(data)?.[1],
        is_pro: !!/"is_pro":\s*(true|false)/.exec(data)?.[1],
        is_expert: !!/"is_expert":\s*(true|false)/.exec(data)?.[1],
        is_trial: !!/"is_trial":\s*(true|false)/.exec(data)?.[1],
        is_lite_plan: !!/"is_lite_plan":\s*(true|false)/.exec(data)?.[1],
        pro_being_cancelled: !!/"pro_being_cancelled":\s*(true|false)/.exec(data)?.[1],
        pro_plan_days_left: parseFloat(/"pro_plan_days_left":([0-9]*?),/.exec(data)?.[1] || 0),
        pro_plan_original_name: /"pro_plan_original_name":"(.*?)"/.exec(data)?.[1],
        pro_plan: /"pro_plan":"(.*?)"/.exec(data)?.[1],
        pro_plan_billing_cycle: /"pro_plan_billing_cycle":"(.*?)"/.exec(data)?.[1],
        trial_days_left: parseFloat(/"trial_days_left":([0-9]*?),/.exec(data)?.[1] || 0),
        trial_days_left_text: /"trial_days_left_text":"(.*?)"/.exec(data)?.[1],
        available_offers: /"available_offers":"(.*?)"/.exec(data)?.[1],
        had_pro: !!/"had_pro":\s*(true|false)/.exec(data)?.[1],
        declared_status: /"declared_status":"(.*?)"/.exec(data)?.[1],
        declared_status_timestamp: !!/"declared_status_timestamp":\s*(true|false)/.exec(data)?.[1],
        market_profile_updated_timestamp: /"market_profile_updated_timestamp":"(.*?)"/.exec(data)?.[1],
        force_to_complete_data: !!/"force_to_complete_data":\s*(true|false)/.exec(data)?.[1],
        force_to_upgrade: !!/"force_to_upgrade":\s*(true|false)/.exec(data)?.[1],
        is_support_available: !!/"is_support_available":\s*(true|false)/.exec(data)?.[1],
        disallow_adding_to_private_chats: !!/"disallow_adding_to_private_chats":\s*(true|false)/.exec(data)?.[1],
        picture_url: /"picture_url":"(.*?)"/.exec(data)?.[1],
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
    const { data } = await axios.get('https://pine-facade.tradingview.com/pine-facade/list', {
      headers: {
        cookie: genAuthCookies(session, signature),
      },
      params: {
        filter: 'saved',
      },
      validateStatus,
    });

    return data.map((ind) => ({
      id: ind.scriptIdPart,
      version: ind.version,
      name: ind.scriptName,
      author: {
        id: -1, username: '@ME@',
      },
      image: ind.imageUrl,
      access: 'private',
      source: ind.scriptSource,
      type: (ind.extra && ind.extra.kind) ? ind.extra.kind : 'study',
      get() {
        return module.exports.getIndicator(ind.scriptIdPart, ind.version, session, signature);
      },
    }));
  },

  /**
     * Get user's invite only scripts from a 'sessionid' cookie
     * @function getInviteOnlyScripts
     * @param {string} session User 'sessionid' cookie
     * @param {string} [signature] User 'sessionid_sign' cookie
     * @returns {Promise<Data[]>} invite only scripts
     */
  async getInviteOnlyScripts(session, signature = '') {
    const { data: prefetch } = await axios.get('https://www.tradingview.com/pine_perm/list_scripts', {
      validateStatus,
      headers: {
        cookie: `sessionid=${session}${signature ? `;sessionid_sign=${signature};` : ''}`,
      },
    });

    const requestBody = {
      scriptIdPart: prefetch, show_hidden: false,
    };

    // Manually construct the form-urlencoded string
    const formData = Object.keys(requestBody)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(requestBody[key])}`)
      .join('&');

    const { data } = await axios.post('https://www.tradingview.com/pubscripts-get/', formData, {
      validateStatus,
      headers: {
        referer: 'https://www.tradingview.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        cookie: `sessionid=${session}${signature ? `;sessionid_sign=${signature};` : ''}`,
      },
    });

    return data;
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
    const { id, session, signature } = (credentials.id && credentials.session ? credentials : {
      id: -1, session: null, signature: null,
    });

    const { data } = await axios.get('https://www.tradingview.com/chart-token', {
      headers: {
        cookie: genAuthCookies(session, signature),
      },
      params: {
        image_url: layout, user_id: id,
      },
      validateStatus,
    });

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

    const { data } = await axios.get(`https://charts-storage.tradingview.com/charts-storage/get/layout/${layout}/sources`, {
      params: {
        chart_id: chartID, jwt: chartToken, symbol,
      },
      validateStatus,
    });

    if (!data.payload) throw new Error('Wrong layout, user credentials, or chart id.');

    return Object.values(data.payload.sources || {}).map((drawing) => ({
      ...drawing, ...drawing.state,
    }));
  },

  /**
     * Fetch user's layouts
     * @function fetchLayouts
     * @param {string} session User 'sessionid' cookie
     * @param {string} [signature] User 'sessionid_sign' cookie
     * @returns {Promise<Layout[]>} Layouts
     */
  async fetchLayouts(session, signature = '') {
    try {
      const { data: layouts } = await axios.get('https://www.tradingview.com/my-charts/', {
        headers: {
          cookie: genAuthCookies(session, signature), Origin: 'https://www.tradingview.com',
        },
        validateStatus,
      });
      return layouts || [];
    } catch (e) {
      console.error(e);
      throw new Error(`Failed to getLayouts, reason: ${e}`);
    }
  },

  /**
     * Fetch layout by nameOrIdOrUrl
     * @function fetchLayouts
     * @param {string|number} nameOrIdOrUrl Layout name, id or short url
     * @param {string} session User 'sessionid' cookie
     * @param {string} [signature] User 'sessionid_sign' cookie
     * @returns {Promise<Layout>} Layout
     */
  async fetchLayout(nameOrIdOrUrl, session, signature) {
    const layouts = await module.exports.fetchLayouts(session, signature);

    const layout = layouts.find((l) => [l.name, l.id, l.image_url].includes(nameOrIdOrUrl));
    if (!layout) throw new Error(`Unable to find Layout '${nameOrIdOrUrl}'.`);

    return layout;
  },

  /**
     * Create a new layout
     * @function createLayout
     * @param {string} name Layout name
     * @param {string} session User 'sessionid' cookie
     * @param {string} [signature] User 'sessionid_sign' cookie
     * @returns {Promise<Layout>} Layouts
     */
  async createBlankLayout(name, session, signature = '') {
    try {
      await axios.post('https://www.tradingview.com/charts/', { name }, {
        headers: {
          cookie: genAuthCookies(session, signature),
          Origin: 'https://www.tradingview.com',
        },
        validateStatus,
      });
    } catch (e) {
      console.error(e);
      throw new Error(`Failed to create layout: '${name}' reason: ${e}`);
    }

    const layouts = await module.exports.fetchLayouts(session, signature);

    const layout = layouts.find((l) => l.name === name);
    if (!layout) throw new Error(`Unable to find Layout '${name}'.`);

    return layout;
  },

  /**
     * Fetch layout content
     * @function fetchLayoutContent
     * @param {string} chartShortUrl Chart short url
     * @param {string} session User 'sessionid' cookie
     * @param {string} [signature] User 'sessionid_sign' cookie
     * @returns {Promise<any>} Layout content
     */
  async fetchLayoutContent(chartShortUrl, session, signature) {
    const { data: html } = await axios.get(`https://www.tradingview.com/chart/${chartShortUrl}`, {
      headers: {
        cookie: genAuthCookies(session, signature),
      },
    });
    const match = html.match(/initData\.content\s*=\s*(\{.*?\});/s);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error(e);
        throw new Error('Failed to to parse \'initData.content\' data.');
      }
    } else throw new Error('Failed to find \'content\' property on \'initData\' object.');
  },

  /**
     * Replaces an existing layout
     * @function replaceLayout
     * @param {Layout} layout Layout
     * @param {string} symbol symbol
     * @param {string} interval interval
     * @param {string} studyId studyId
     * @param {string} indicatorId indicatorId
     * @param {Record<string, any>} indicatorValues indicatorValues
     * @param {string} session User 'sessionid' cookie
     * @param {string} [signature] User 'sessionid_sign' cookie
     * @returns {Promise<string>} Layout URL
     */
  async replaceLayout(layout, symbol, interval, studyId, indicatorId, indicatorValues, session, signature) {
    const formData = new FormData();
    formData.append('id', layout.id);
    formData.append('name', layout.name);
    formData.append('description', layout.name);
    formData.append('symbol_type', 'swap'); // TODO is this needed to change?
    formData.append('symbol', symbol);
    formData.append('legs', JSON.stringify([{ symbol, pro_symbol: symbol }]));
    formData.append('charts_symbols', JSON.stringify({ 1: { symbol } }));
    formData.append('resolution', interval);

    const [broker, coin] = symbol.split(':');
    formData.append('exchange', toTitleCase(broker));
    formData.append('listed_exchange', broker);
    formData.append('short_name', coin);

    formData.append('is_realtime', '1');
    // formData.append('savingToken', '0.7257906314572806');  //TODO is this needed?

    const rawIndicator = await module.exports.getRawIndicator(indicatorId, 'last', session, signature);
    Object.entries(indicatorValues).forEach(([key, value]) => rawIndicator.setInputValue(key, value));

    const contentBlob = createLayoutContentBlob(layout.name, symbol, interval, studyId, rawIndicator);
    const gzipData = zlib.gzipSync(JSON.stringify(contentBlob));
    formData.append('content', new Blob([gzipData], { type: 'application/gzip' }), 'blob.gz');

    try {
      await axios.post('https://www.tradingview.com/savechart/', formData, {
        headers: {
          cookie: genAuthCookies(session, signature),
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          DNT: '1',
          Origin: 'https://www.tradingview.com',
        },
        validateStatus,
      });
    } catch (e) {
      console.error(e);
      throw new Error(`Failed to save layout: ${layout.id} /${layout.image_url}/`);
    }

    return layout.image_url;
  },

  /**
     * Creates a new layout and populates it with the provided indicator setup
     * @function createLayout
     * @param {string} name name
     * @param {string} symbol symbol
     * @param {string} interval interval
     * @param {string} studyId studyId
     * @param {string} indicatorId indicatorId
     * @param {Record<string, any>} indicatorValues indicatorValues
     * @param {string} session User 'sessionid' cookie
     * @param {string} [signature] User 'sessionid_sign' cookie
     * @returns {Promise<string>} Layout Short URL
     */
  async createLayout(name, symbol, interval, studyId, indicatorId, indicatorValues, session, signature) {
    const layout = await module.exports.createBlankLayout(name, session, signature);
    const layoutShortUrl = await module.exports.replaceLayout(layout, symbol, interval, studyId, indicatorId, indicatorValues, session, signature);
    return layoutShortUrl;
  },

  /**
     * Creates a new layout and populates it with the provided indicator setup
     * @function createLayout
     * @param {string|string[]} chartShortUrl chartShortUrls
     * @param {string} session User 'sessionid' cookie
     * @param {string} [signature] User 'sessionid_sign' cookie
     * @returns {Promise<string>} Layout URL
     */
  async deleteLayout(chartShortUrl, session, signature) {
    try {
      await axios.post('https://www.tradingview.com/api/v1/charts/delete/', {
        uid: Array.isArray(chartShortUrl) ? chartShortUrl : [chartShortUrl],
      }, {
        headers: {
          cookie: genAuthCookies(session, signature),
          Origin: 'https://www.tradingview.com',
        },
        validateStatus,
      });
    } catch (e) {
      console.error(e);
      throw new Error(`Failed to delete layout(s): ${chartShortUrl}\nReason: ${e}`);
    }
  },

  /**
     * Delete multiple layouts
     * @function deleteLayouts
     * @param {string[]} chartShortUrls chartShortUrls
     * @param {string} session User 'sessionid' cookie
     * @param {string} [signature] User 'sessionid_sign' cookie
     * @returns {Promise<string>} Layout URL
     */
  async deleteLayouts(chartShortUrls, session, signature) {
    return module.exports.deleteLayout(chartShortUrls, session, signature);
  },
};
