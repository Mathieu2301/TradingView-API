module.exports = {
  /**
   * Generates a session id
   * @function genSessionID
   * @param {String} type Session type
   * @returns {string}
   */
  genSessionID(type = 'xs') {
    let r = '';
    const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 12; i += 1) r += c.charAt(Math.floor(Math.random() * c.length));
    return `${type}_${r}`;
  },

  genAuthCookies(sessionId = '', signature = '') {
    if (!sessionId) return '';
    if (!signature) return `sessionid=${sessionId}`;
    return `sessionid=${sessionId};sessionid_sign=${signature}`;
  },
};
