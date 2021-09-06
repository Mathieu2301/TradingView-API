const https = require('https');

/**
 * @typedef {Object} WebhookMessage Represents a Discord webhook message
 * @property {string} content
 * @property {Embed[]} [embeds]
 */

/**
 * @typedef {Object} Embed Discord Embed
 * @property {string} [title]
 * @property {string} [description]
 * @property {number} [color]
 * @property {string} [url]
 * @property {string} [timestamp]

 * @property {Object} [author]
 * @property {string} [author.name]
 * @property {string} [author.icon_url]
 * @property {string} [author.url]

 * @property {Object} [thumbnail]
 * @property {string} [thumbnail.url]

 * @property {Object} [footer]
 * @property {string} [footer.text]
 * @property {string} [footer.icon_url]
 */

/**
 * @typedef {Object} SendResult
 * @property {boolean} success
 * @property {Object} [result] If error
 * @property {string[]} [result.webhook_id]
 */

/**
 * Create an instance of Discord Webhook API
 * @param {string} token Discord Webhook token (after .../api/webhooks/)
 */

module.exports = function createInstance(token = '') {
  /**
   * Send a message
   * @name MessageSender
   * @param {WebhookMessage} message
   * @returns {Promise<SendResult>}
  */
  return (message) => new Promise((cb, err) => {
    const req = https.request({
      method: 'POST',
      hostname: 'discordapp.com',
      path: `/api/webhooks/${token}`,
      headers: {
        'Content-Type': 'application/json',
      },
      maxRedirects: 20,
    }, (res) => {
      let data = '';
      res.on('data', (d) => { data += d; });
      res.on('end', () => {
        if (!data) cb({ success: true });
        else {
          cb({
            success: false,
            result: JSON.parse(data),
          });
        }
      });
    });

    req.on('error', err);
    req.write(JSON.stringify(message));
    req.end();
  });
};
