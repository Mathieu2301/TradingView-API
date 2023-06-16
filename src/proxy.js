const { SocksProxyAgent } = require('socks-proxy-agent')
const { HttpsProxyAgent } = require('https-proxy-agent')

let proxyAgent = null

module.exports = () => proxyAgent

module.exports.setAgent = (proxy) => {
    if (proxy === '') {
        proxyAgent = null
        return
    }

    if (proxy.includes('http')) {
        proxyAgent = new HttpsProxyAgent(proxy)
        return
    }

    proxyAgent = new SocksProxyAgent(proxy.replace('socks5://', 'socks://'))
}
