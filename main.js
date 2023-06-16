const miscRequests = require('./src/miscRequests')
const Client = require('./src/client')
const BuiltInIndicator = require('./src/classes/BuiltInIndicator')
const PineIndicator = require('./src/classes/PineIndicator')
const PinePermManager = require('./src/classes/PinePermManager')
const { setAgent } = require('./src/proxy')

module.exports = { ...miscRequests }
module.exports.Client = Client
module.exports.BuiltInIndicator = BuiltInIndicator
module.exports.PineIndicator = PineIndicator
module.exports.PinePermManager = PinePermManager
module.exports.SetAgent = setAgent
