const https = require('https');

const indicators = ['Recommend.Other', 'Recommend.All', 'Recommend.MA'];

function fetchScanData(tickers = [], type = '', columns = []) {
  return new Promise((cb, err) => {
    const req = https.request({
      method: 'POST',
      hostname: 'scanner.tradingview.com',
      path: `/${type}/scan`,
      headers: {
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (!data.startsWith('{')) {
          err(new Error('Wrong screener'));
          return;
        }
        try {
          cb(JSON.parse(data));
        } catch (error) {
          err(new Error('Can\'t parse server response'));
        }
      });
    });

    req.on('error', err);
    req.end(JSON.stringify({ symbols: { tickers }, columns }));
  });
}

/**
 * @typedef {'STRONG_SELL' | 'SELL' | 'NEUTRAL' | 'BUY' | 'STRONG_BUY'} advice
 *
 * @typedef {{
 *  '1': { Other: advice, All: advice, MA: advice },
 *  '5': { Other: advice, All: advice, MA: advice },
 *  '15': { Other: advice, All: advice, MA: advice },
 *  '60': { Other: advice, All: advice, MA: advice },
 *  '240': { Other: advice, All: advice, MA: advice },
 *  '1D': { Other: advice, All: advice, MA: advice },
 *  '1W': { Other: advice, All: advice, MA: advice },
 *  '1M': { Other: advice, All: advice, MA: advice },
 * }} Periods
 *
 * @typedef {string | 'forex' | 'crypto'
 * | 'america' | 'australia' | 'canada' | 'egypt'
 * | 'germany' | 'india' | 'israel' | 'italy'
 * | 'luxembourg' | 'poland' | 'sweden' | 'turkey'
 * | 'uk' | 'vietnam'} screener
 */

module.exports = {
  /**
   * @param {string} exchange Example: BINANCE, EURONEXT, NASDAQ
   * @returns {screener}
  */
  getScreener(exchange) {
    const e = exchange.toUpperCase();
    if (['NASDAQ', 'NYSE', 'NYSE ARCA', 'OTC'].includes(e)) return 'america';
    if (['ASX'].includes(e)) return 'australia';
    if (['TSX', 'TSXV', 'CSE', 'NEO'].includes(e)) return 'canada';
    if (['EGX'].includes(e)) return 'egypt';
    if (['FWB', 'SWB', 'XETR'].includes(e)) return 'germany';
    if (['BSE', 'NSE'].includes(e)) return 'india';
    if (['TASE'].includes(e)) return 'israel';
    if (['MIL', 'MILSEDEX'].includes(e)) return 'italy';
    if (['LUXSE'].includes(e)) return 'luxembourg';
    if (['NEWCONNECT'].includes(e)) return 'poland';
    if (['NGM'].includes(e)) return 'sweden';
    if (['BIST'].includes(e)) return 'turkey';
    if (['LSE', 'LSIN'].includes(e)) return 'uk';
    if (['HNX'].includes(e)) return 'vietnam';
    return exchange.toLowerCase();
  },

  /** Get technical analysis
   * @param {screener} screener
   * @param {string} symbol You can use `getScreener(exchange)` function
   * @returns {Promise<Periods>} results
   */
  async getTA(screener, symbol) {
    const advice = {};

    const cols = ['1', '5', '15', '60', '240', '1D', '1W', '1M']
      .map((t) => indicators.map((i) => (t !== '1D' ? `${i}|${t}` : i)))
      .flat();

    const rs = await fetchScanData([symbol], screener, cols);
    if (!rs.data || !rs.data[0]) return false;

    rs.data[0].d.forEach((val, i) => {
      const [name, period] = cols[i].split('|');
      const pName = period || '1D';
      if (!advice[pName]) advice[pName] = {};
      advice[pName][name.split('.').pop()] = Math.round(val * 1000) / 500;
    });

    return advice;
  },

  /**
   * @typedef {{
   *  id: string,
   *  exchange: string,
   *  fullExchange: string,
   *  symbol: string,
   *  description: string,
   *  type: string,
   * }} SearchResult
   */

  /**
   * @param {string} search Search a symbol
   * @param {'stock' | 'futures' | 'forex' | 'cfd' | 'crypto' | 'index' | 'economic'} filter
   * @returns {Promise<SearchResult[]>} Search results
   */
  async search(search, filter = '') {
    return new Promise((cb, err) => {
      https.get({
        host: 'symbol-search.tradingview.com',
        path: `/symbol_search/?text=${search.replace(/ /g, '%20')}&type=${filter}`,
        origin: 'https://www.tradingview.com',
      }, (res) => {
        let rs = '';
        res.on('data', (d) => { rs += d; });
        res.on('end', () => {
          try {
            rs = JSON.parse(rs);
          } catch (e) {
            err(new Error('Can\'t parse server response'));
            return;
          }
          cb(rs.map((s) => ({
            id: `${s.exchange.split(' ')[0]}:${s.symbol}`,
            exchange: s.exchange.split(' ')[0],
            fullExchange: s.exchange,
            symbol: s.symbol,
            description: s.description,
            type: s.type,
          })));
        });
        res.on('error', err);
      });
    });
  },
};
