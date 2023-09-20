const TV_DOMAIN = 'https://www.tradingview.com';
const TV_SIGN_IN_PATH = '/accounts/signin';
const TV_FIND_INDICATOR_PATH = '/pubscripts-suggest-json/';
const TV_CHART_TOKEN_PATH = '/chart-token/';
const TV_LIST_USERS_PATH = '/pine_perm/list_users/';
const TV_ADD_USER_PATH = '/pine_perm/add/';
const TV_MODIFY_USER_PATH = '/pine_perm/modify_user_expiration/';
const TV_REMOVE_USER_PATH = '/pine_perm/remove';

module.exports = {
  tvDomain: TV_DOMAIN,
  tvSignInUrl: TV_DOMAIN + TV_SIGN_IN_PATH,
  tvFindIndicatorUrl: TV_DOMAIN + TV_FIND_INDICATOR_PATH,
  tvChartTokenUrl: TV_DOMAIN + TV_CHART_TOKEN_PATH,
  tvListUsersUrl: TV_DOMAIN + TV_LIST_USERS_PATH,
  tvAddUserUrl: TV_DOMAIN + TV_ADD_USER_PATH,
  tvModifyUserUrl: TV_DOMAIN + TV_MODIFY_USER_PATH,
  tvRemoveUserUrl: TV_DOMAIN + TV_REMOVE_USER_PATH,
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
};
