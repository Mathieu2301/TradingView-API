const miscFunctions = require('./src/miscFunctions');
const miscRequests = require('./src/miscRequests');
const constants = require('./src/constants');
const types = require('./src/constants');
const Client = require('./src/client');
const BuiltInIndicator = require('./src/classes/BuiltInIndicator');
const PineIndicator = require('./src/classes/PineIndicator');
const PinePermManager = require('./src/classes/PinePermManager');

module.exports = {
  ...miscRequests,
  ...constants,
  ...types,
  ...miscFunctions,
};
module.exports.Client = Client;
module.exports.BuiltInIndicator = BuiltInIndicator;
module.exports.PineIndicator = PineIndicator;
module.exports.PinePermManager = PinePermManager;
