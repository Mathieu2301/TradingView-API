const TradingView = require('../main')

/*
  Test Proxy
*/

if (!process.argv[2]) throw Error('Please specify your \'sessionid\' cookie')
if (!process.argv[3]) throw Error('Please specify proxy')

TradingView.SetAgent(process.argv[3])

TradingView.getPrivateIndicators(process.argv[2]).then((indicList) => {
    indicList.forEach(async (indic) => {
        console.log('Loading indicator', indic.name, '...')
    })
})
