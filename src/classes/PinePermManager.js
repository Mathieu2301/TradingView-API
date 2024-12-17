const axios = require('axios');
const { genAuthCookies } = require('../utils');

/**
 * @typedef {Object} AuthorizationUser
 * @prop {id} id User id
 * @prop {string} username User's username
 * @prop {string} userpic User's profile picture URL
 * @prop {string} expiration Authorization expiration date
 * @prop {string} created Authorization creation date
 */

/** @class */
class PinePermManager {
  sessionId;

  pineId;

  /**
   * Creates a PinePermManager instance
   * @param {string} sessionId Token from `sessionid` cookie
   * @param {string} signature Signature cookie
   * @param {string} pineId Indicator ID (Like: PUB;XXXXXXXXXXXXXXXXXXXXX)
   */
  constructor(sessionId, signature, pineId) {
    if (!sessionId) throw new Error('Please provide a SessionID');
    if (!signature) throw new Error('Please provide a Signature');
    if (!pineId) throw new Error('Please provide a PineID');
    this.sessionId = sessionId;
    this.signature = signature;
    this.pineId = pineId;
  }

  /**
   * Get list of authorized users
   * @param {number} limit Fetching limit
   * @param {'user__username'
   * | '-user__username'
   * | 'created' | 'created'
   * | 'expiration,user__username'
   * | '-expiration,user__username'
   * } order Fetching order
   * @returns {Promise<AuthorizationUser[]>}
   */
  async getUsers(limit = 10, order = '-created') {
    try {
      const { data } = await axios.post(
        `https://www.tradingview.com/pine_perm/list_users/?limit=${limit}&order_by=${order}`,
        `pine_id=${this.pineId.replace(/;/g, '%3B')}`,
        {
          headers: {
            origin: 'https://www.tradingview.com',
            'Content-Type': 'application/x-www-form-urlencoded',
            cookie: genAuthCookies(this.sessionId, this.signature),
          },
        },
      );

      return data.results;
    } catch (e) {
      throw new Error(e.response.data.detail || 'Wrong credentials or pineId');
    }
  }

  /**
   * Adds an user to the authorized list
   * @param {string} username User's username
   * @param {Date} [expiration] Expiration date
   * @returns {Promise<'ok' | 'exists' | null>}
   */
  async addUser(username, expiration = null) {
    try {
      const { data } = await axios.post(
        'https://www.tradingview.com/pine_perm/add/',
        `pine_id=${
          this.pineId.replace(/;/g, '%3B')
        }&username_recip=${
          username
        }${
          expiration && expiration instanceof Date
            ? `&expiration=${expiration.toISOString()}`
            : ''
        }`,
        {
          headers: {
            origin: 'https://www.tradingview.com',
            'Content-Type': 'application/x-www-form-urlencoded',
            cookie: genAuthCookies(this.sessionId, this.signature),
          },
        },
      );

      return data.status;
    } catch (e) {
      throw new Error(e.response.data.detail || 'Wrong credentials or pineId');
    }
  }

  /**
   * Modify an authorization expiration date
   * @param {string} username User's username
   * @param {Date} [expiration] New expiration date
   * @returns {Promise<'ok' | null>}
   */
  async modifyExpiration(username, expiration = null) {
    try {
      const { data } = await axios.post(
        'https://www.tradingview.com/pine_perm/modify_user_expiration/',
        `pine_id=${
          this.pineId.replace(/;/g, '%3B')
        }&username_recip=${
          username
        }${
          expiration && expiration instanceof Date
            ? `&expiration=${expiration.toISOString()}`
            : ''
        }`,
        {
          headers: {
            origin: 'https://www.tradingview.com',
            'Content-Type': 'application/x-www-form-urlencoded',
            cookie: genAuthCookies(this.sessionId, this.signature),
          },
        },
      );

      return data.status;
    } catch (e) {
      throw new Error(e.response.data.detail || 'Wrong credentials or pineId');
    }
  }

  /**
   * Removes an user to the authorized list
   * @param {string} username User's username
   * @returns {Promise<'ok' | null>}
   */
  async removeUser(username) {
    try {
      const { data } = await axios.post(
        'https://www.tradingview.com/pine_perm/remove/',
        `pine_id=${this.pineId.replace(/;/g, '%3B')}&username_recip=${username}`,
        {
          headers: {
            origin: 'https://www.tradingview.com',
            'Content-Type': 'application/x-www-form-urlencoded',
            cookie: genAuthCookies(this.sessionId, this.signature),
          },
        },
      );

      return data.status;
    } catch (e) {
      throw new Error(e.response.data.detail || 'Wrong credentials or pineId');
    }
  }
}

module.exports = PinePermManager;
