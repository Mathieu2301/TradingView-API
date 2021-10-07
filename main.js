const miscRequests = require('./src/miscRequests');
const Client = require('./src/client');

module.exports = {
  ...miscRequests,
  Client,
};
