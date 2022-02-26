const request = require('../request');
const FormData = require('../FormData');

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
   * @param {string} sessionId Token from sessionid cookie
   * @param {string} pineId Indicator ID (Like: PUB;XXXXXXXXXXXXXXXXXXXXX)
   */
  constructor(sessionId, pineId) {
    if (!sessionId) throw new Error('Please provide a SessionID');
    if (!pineId) throw new Error('Please provide a PineID');
    this.pineId = pineId;
    this.sessionId = sessionId;
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
   * @returns {AuthorizationUser[]}
   */
  async getUsers(limit = 10, order = '-created') {
    const { data } = await request({
      method: 'POST',
      host: 'www.tradingview.com',
      path: `/pine_perm/list_users/?limit=${limit}&order_by=${order}`,
      headers: {
        origin: 'https://www.tradingview.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        cookie: `sessionid=${this.sessionId}`,
      },
    }, false, `pine_id=${this.pineId.replace(/;/g, '%3B')}`);

    if (!data.results) throw new Error('Wrong sessionId or pineId');

    return data.results;
  }

  /**
   * Adds an user to the authorized list
   * @param {string} username User's username
   * @param {Date} [expiration] Expiration date
   * @returns {'ok' | 'exists' | null}
   */
  async addUser(username, expiration = null) {
    const formData = new FormData();
    formData.append('pine_id', this.pineId);
    formData.append('username_recip', username);
    if (expiration && expiration instanceof Date) {
      formData.append('expiration', expiration.toString());
    }

    const { data } = await request({
      method: 'POST',
      host: 'www.tradingview.com',
      path: '/pine_perm/add/',
      headers: {
        origin: 'https://www.tradingview.com',
        'Content-Type': `multipart/form-data; boundary=${formData.boundary}`,
        cookie: `sessionid=${this.sessionId}`,
      },
    }, false, formData.toString());

    if (!data.status) throw new Error('Wrong sessionId or pineId');
    return data.status;
  }

  /**
   * Modify an authorization expiration date
   * @param {string} username User's username
   * @param {Date} [expiration] New expiration date
   * @returns {'ok' | null}
   */
  async modifyExpiration(username, expiration = null) {
    const formData = new FormData();
    formData.append('pine_id', this.pineId);
    formData.append('username_recip', username);
    if (expiration && expiration instanceof Date) {
      formData.append('expiration', expiration.toISOString());
    }

    const { data } = await request({
      method: 'POST',
      host: 'www.tradingview.com',
      path: '/pine_perm/modify_user_expiration/',
      headers: {
        origin: 'https://www.tradingview.com',
        'Content-Type': `multipart/form-data; boundary=${formData.boundary}`,
        cookie: `sessionid=${this.sessionId}`,
      },
    }, false, formData.toString());

    if (!data.status) throw new Error('Wrong sessionId or pineId');
    return data.status;
  }

  /**
   * Removes an user to the authorized list
   * @param {string} username User's username
   * @returns {'ok' | null}
   */
  async removeUser(username) {
    const formData = new FormData();
    formData.append('pine_id', this.pineId);
    formData.append('username_recip', username);

    const { data } = await request({
      method: 'POST',
      host: 'www.tradingview.com',
      path: '/pine_perm/remove/',
      headers: {
        origin: 'https://www.tradingview.com',
        'Content-Type': `multipart/form-data; boundary=${formData.boundary}`,
        cookie: `sessionid=${this.sessionId}`,
      },
    }, false, formData.toString());

    if (!data.status) throw new Error('Wrong sessionId or pineId');
    return data.status;
  }
}

module.exports = PinePermManager;
