const https = require('https');

/**
 * @param {https.RequestOptions} options HTTPS Request options
 * @param {boolean} [raw] Get raw or JSON data
 * @param {string} [content] Request body content
 * @returns {Promise<string | object | array>} Result
 */
function request(options = {}, raw = false, content = '') {
  return new Promise((cb, err) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (raw) {
          cb(data);
          return;
        }

        try {
          data = JSON.parse(data);
        } catch (error) {
          console.log(data);
          err(new Error('Can\'t parse server response'));
          return;
        }

        cb(data);
      });
    });

    req.on('error', err);
    req.end(content);
  });
}

module.exports = request;
