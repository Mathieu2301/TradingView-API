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

function parseSignal(v) {
  if (v >= -1 && v < -0.5) return 'STRONG_SELL';
  if (v >= -0.5 && v < 0) return 'SELL';
  if (v > 0 && v <= 0.5) return 'BUY';
  if (v > 0.5 && v <= 1) return 'STRONG_BUY';
  return 'NEUTRAL';
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
 */

module.exports = {
  /** Get technical analysis
   * @param {'stock' | 'futures' | 'forex' | 'cfd' | 'crypto' | 'index' | 'economic'} type
   * @param {string} symbol Example: BINANCE:BTCEUR
   * @returns {Promise<Periods>} results
   */
  async getTA(type, symbol) {
    const advice = {};

    const cols = ['1', '5', '15', '60', '240', '1D', '1W', '1M']
      .map((t) => indicators.map((i) => (t !== '1D' ? `${i}|${t}` : i)))
      .flat();

    const rs = await fetchScanData([symbol], type, cols);
    if (!rs.data || !rs.data[0]) return false;

    rs.data[0].d.forEach((val, i) => {
      const [name, period] = cols[i].split('|');
      const pName = period || '1D';
      if (!advice[pName]) advice[pName] = {};
      advice[pName][name.split('.').pop()] = parseSignal(val);
    });

    return advice;
  },

  /**
   * @typedef {{
   *  id: string,
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
            id: `${s.exchange}:${s.symbol}`,
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
