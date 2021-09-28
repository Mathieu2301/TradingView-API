const WebSocket = require('ws');
const JSZip = require('jszip');

const {
  search, getScreener, getTA, getIndicator,
  getUser, getChartToken, getDrawings, searchIndicator,
} = require('./miscRequests');

let onPacket = () => null;

function parse(str) {
  const packets = str.replace(/~h~/g, '').split(/~m~[0-9]{1,}~m~/g).map((p) => {
    if (!p) return false;
    try {
      return JSON.parse(p);
    } catch (error) {
      console.warn('Cant parse', p);
      return false;
    }
  }).filter((p) => p);

  packets.forEach((packet) => {
    if (packet.m === 'protocol_error') {
      return onPacket({
        type: 'error',
        syntax: packet.p[0],
      });
    }

    if (packet.m && packet.p) {
      return onPacket({
        type: packet.m,
        session: packet.p[0],
        data: packet.p[1],
      });
    }

    if (typeof packet === 'number') return onPacket({ type: 'ping', ping: packet });

    return onPacket({ type: 'info', ...packet });
  });
}

function genSession() {
  let r = '';
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 12; i += 1) r += c.charAt(Math.floor(Math.random() * c.length));
  return `qs_${r}`;
}

module.exports = (autoInit = true) => {
  const callbacks = {
    connected: [],
    disconnected: [],
    logged: [],
    subscribed: [],
    ping: [],
    price: [],
    data: [],

    error: [],
    event: [],
  };

  const chartEventNames = [
    'du', 'timescale_update',
    'series_loading', 'series_completed', 'series_error',
    'symbol_resolved', 'symbol_error',
    'study_loading', 'study_error',
  ];
  const chartCBs = {};

  function handleEvent(ev, ...data) {
    callbacks[ev].forEach((e) => e(...data));
    callbacks.event.forEach((e) => e(ev, ...data));
  }

  function handleError(...msgs) {
    if (callbacks.error.length === 0) console.error(...msgs);
    else handleEvent('error', ...msgs);
  }

  const ws = new WebSocket('wss://widgetdata.tradingview.com/socket.io/websocket', {
    origin: 'https://s.tradingview.com',
  });

  let logged = false;
  /** ID of the quote session */
  let sessionId = '';

  /** List of subscribed symbols */
  let subscribed = [];

  /** Websockets status */
  let isEnded = false;

  /**
   * Send a custom packet
   * @param {string} t Packet type
   * @param {string[]} p Packet data
   * @example
   * // Subscribe manualy to BTCEUR
   * send('quote_add_symbols', [sessionId, 'BTCEUR']);
  */
  function send(t, p = []) {
    if (!sessionId) return;

    const msg = JSON.stringify({ m: t, p });
    ws.send(`~m~${msg.length}~m~${msg}`);
  }

  ws.on('open', () => {
    sessionId = genSession();
    handleEvent('connected');
  });

  ws.on('close', () => {
    logged = false;
    sessionId = '';
    handleEvent('disconnected');
  });

  ws.on('message', parse);

  onPacket = (packet) => {
    if (packet.type === 'ping') {
      const pingStr = `~h~${packet.ping}`;
      ws.send(`~m~${pingStr.length}~m~${pingStr}`);
      handleEvent('ping', packet.ping);
      return;
    }

    if (packet.type === 'quote_completed' && packet.data) {
      handleEvent('subscribed', packet.data);
      return;
    }

    if (packet.type === 'qsd' && packet.data.n && packet.data.v.lp) {
      handleEvent('price', {
        symbol: packet.data.n,
        price: packet.data.v.lp,
      });

      return;
    }

    if (chartEventNames.includes(packet.type) && chartCBs[packet.session]) {
      chartCBs[packet.session](packet);
      return;
    }

    if (!logged && packet.type === 'info') {
      if (autoInit) {
        send('set_auth_token', ['unauthorized_user_token']);
        send('quote_create_session', [sessionId]);
        send('quote_set_fields', [sessionId, 'lp']);

        subscribed.forEach((symbol) => send('quote_add_symbols', [sessionId, symbol]));
      }

      handleEvent('logged', packet);
      return;
    }

    if (packet.type === 'error') {
      handleError(`Market API critical error: ${packet.syntax}`);
      ws.close();
      return;
    }

    handleEvent('data', packet);
  };

  return {
    /** Event listener
     * @param { 'connected' | 'disconnected' | 'logged'
     * | 'subscribed' | 'price' | 'data' | 'error' | 'ping' } event Event
     * @param {(...data: object) => null} cb Callback
     */
    on(event, cb) {
      if (!callbacks[event]) {
        console.log('Wrong event:', event);
        console.log('Available events:', Object.keys(callbacks));
        return;
      }

      callbacks[event].push(cb);
    },

    /**
     * Close the websocket connection
     * @return {Promise<void>} When websocket is closed
     */
    end() {
      return new Promise((cb) => {
        isEnded = true;
        ws.close();
        cb();
      });
    },

    search,
    getScreener,
    getTA,
    subscribed,
    searchIndicator,
    getUser,
    getChartToken,
    getDrawings,

    /**
     * Unsubscribe to a market
     * @param {string} symbol Market symbol (Example: BTCEUR or COINBASE:BTCEUR)
     */
    subscribe(symbol) {
      if (subscribed.includes(symbol)) return;
      send('quote_add_symbols', [sessionId, symbol]);
      subscribed.push(symbol);
    },

    /**
     * Unsubscribe from a market
     * @param {string} symbol Market symbol (Example: BTCEUR or COINBASE:BTCEUR)
     */
    unsubscribe(symbol) {
      if (!subscribed.includes(symbol)) return;
      send('quote_remove_symbols', [sessionId, symbol]);
      subscribed = subscribed.filter((s) => s !== symbol);
    },

    /**
     * @typedef {Object} IndicatorInfos Indicator infos
     * @property {string} id ID of the indicator (Like: XXX;XXXXXXXXXXXXXXXXXXXXX)
     * @property {string} [name] Name of the indicator
     * @property {'last' | string} [version] Wanted version of the indicator
     * @property {(string | number | boolean | null)[]} [settings] Indicator settings value
     * @property {'study' | 'strategy'} [type] Script type
     *
     * @typedef {Object} ChartInfos
     * @property {string} [session] User 'sessionid' cookie
     * @property {string} symbol Market symbol (Example: BTCEUR or COINBASE:BTCEUR)
     * @property { '1' | '3' | '5' | '15' | '30' | '45'
     *  | '60' | '120' | '180' | '240'
     *  | '1D' | '1W' | '1M'
     * } [period] Period
     * @property {number} [range] Number of loaded periods
     * @property {string} [timezone] Timezone in 'Europe/Paris' format
     * @property {IndicatorInfos[]} [indicators] List of indicators
     */

    /**
     * @typedef {Object} Period List of prices / indicator values
     * @property {number} $time
     * @property {{
     *  time: number, open: number, close: number,
     *  max: number, min: number, change: number,
     * }} $prices
     */

    /**
     * Init a chart instance
     * @param {ChartInfos} chart
     * @param {{(prices: Period[], strategies: Object<string, StrategyReport>): null}} onUpdate
     */
    async initChart(chart, onUpdate) {
      const chartSession = genSession();
      const periods = [];

      /**
       * @typedef {Object} RelAbsValue Relative and Absolute values
       * @property {number} v Absolute value
       * @property {number} p Relative value
       */

      /**
       * @typedef {Object} TradeReport Trade report

       * @property {Object} entry Trade entry
       * @property {string} entry.name Trade name
       * @property {'long' | 'short'} entry.type Entry type (long/short)
       * @property {number} entry.value Entry price value
       * @property {number} entry.time Entry timestamp

       * @property {Object} exit Trade exit
       * @property {'' | string} exit.name Trade name ('' if false exit)
       * @property {number} exit.value Exit price value
       * @property {number} exit.time Exit timestamp

       * @property {number} quantity Trade quantity
       * @property {RelAbsValue} profit Trade profit
       * @property {RelAbsValue} cumulative Trade cummulative profit
       * @property {RelAbsValue} runup Trade run-up
       * @property {RelAbsValue} drawdown Trade drawdown
       */

      /**
       * @typedef {Object} PerfReport
       * @property {number} avgBarsInTrade Average bars in trade
       * @property {number} avgBarsInWinTrade Average bars in winning trade
       * @property {number} avgBarsInLossTrade Average bars in losing trade
       * @property {number} avgTrade Average trade gain
       * @property {number} avgTradePercent Average trade performace
       * @property {number} avgLosTrade Average losing trade gain
       * @property {number} avgLosTradePercent Average losing trade performace
       * @property {number} avgWinTrade Average winning trade gain
       * @property {number} avgWinTradePercent Average winning trade performace
       * @property {number} commissionPaid Commission paid
       * @property {number} grossLoss Gross loss value
       * @property {number} grossLossPercent Gross loss percent
       * @property {number} grossProfit Gross profit
       * @property {number} grossProfitPercent Gross profit percent
       * @property {number} largestLosTrade Largest losing trade gain
       * @property {number} largestLosTradePercent Largent losing trade performance
       * @property {number} largestWinTrade Largest winning trade gain
       * @property {number} largestWinTradePercent Largest winning trade performance
       * @property {number} marginCalls Margin calls
       * @property {number} maxContractsHeld Max Contracts Held
       * @property {number} netProfit Net profit
       * @property {number} netProfitPercent Net performance
       * @property {number} numberOfLosingTrades Number of losing trades
       * @property {number} numberOfWiningTrades Number of winning trades
       * @property {number} percentProfitable Strategy winrate
       * @property {number} profitFactor Profit factor
       * @property {number} ratioAvgWinAvgLoss Ratio Average Win / Average Loss
       * @property {number} totalOpenTrades Total open trades
       * @property {number} totalTrades Total trades
      */

      /**
       * @typedef {Object} StrategyReport
       * @property {'EUR' | 'USD' | 'JPY' | '' | 'CHF'} currency Selected currency
       * @property {TradeReport[]} trades Trade list
       * @property {Object} history History Chart value
       * @property {number[]} history.buyHold Buy hold values
       * @property {number[]} history.buyHoldPercent Buy hold percent values
       * @property {number[]} history.drawDown Drawdown values
       * @property {number[]} history.drawDownPercent Drawdown percent values
       * @property {number[]} history.equity Equity values
       * @property {number[]} history.equityPercent Equity percent values
       * @property {Object} performance Strategy performance
       * @property {PerfReport} performance.all Strategy long/short performances
       * @property {PerfReport} performance.long Strategy long performances
       * @property {PerfReport} performance.short Strategy short performances
       * @property {number} performance.buyHoldReturn Strategy Buy & Hold Return
       * @property {number} performance.buyHoldReturnPercent Strategy Buy & Hold Return percent
       * @property {number} performance.maxDrawDown Strategy max drawdown
       * @property {number} performance.maxDrawDownPercent Strategy max drawdown percent
       * @property {number} performance.openPL Strategy Open P&L (Profit And Loss)
       * @property {number} performance.openPLPercent Strategy Open P&L (Profit And Loss) percent
       * @property {number} performance.sharpeRatio Strategy Sharpe Ratio
       * @property {number} performance.sortinoRatio Strategy Sortino Ratio
       */

      /** @type {Object<string, StrategyReport>} Strategies */
      const strategies = {};

      const indicators = await Promise.all(
        (chart.indicators || []).map((i) => getIndicator(i.id, i.version, i.settings, i.type)),
      );

      async function updatePeriods(packet) {
        const newData = packet.data;

        await Promise.all(Object.keys(newData).map(async (type) => {
          const std = chart.indicators[parseInt(type, 10)] || {};

          if (newData[type].ns && newData[type].ns.d) {
            const stratData = JSON.parse(newData[type].ns.d);

            if (stratData.dataCompressed) {
              const zip = new JSZip();
              const data = JSON.parse(
                await (
                  await zip.loadAsync(stratData.dataCompressed, { base64: true })
                ).file('').async('text'),
              );

              strategies[std.name || type] = {
                currency: data.report.currency,

                trades: data.report.trades.map((t) => ({
                  entry: {
                    name: t.e.c,
                    type: (t.e.tp[0] === 's' ? 'short' : 'long'),
                    value: t.e.p,
                    time: t.e.tm,
                  },
                  exit: {
                    name: t.x.c,
                    value: t.x.p,
                    time: t.x.tm,
                  },
                  quantity: t.q,
                  profit: t.tp,
                  cumulative: t.cp,
                  runup: t.rn,
                  drawdown: t.dd,
                })),

                history: {
                  buyHold: data.report.buyHold,
                  buyHoldPercent: data.report.buyHoldPercent,
                  drawDown: data.report.drawDown,
                  drawDownPercent: data.report.drawDownPercent,
                  equity: data.report.equity,
                  equityPercent: data.report.equityPercent,
                },

                performance: data.report.performance,
              };
              return;
            }

            if (stratData.data && stratData.data.report && stratData.data.report.performance) {
              if (!strategies[std.name || type]) strategies[std.name || type] = { performance: {} };
              strategies[std.name || type].performance = stratData.data.report.performance;
              return;
            }

            return;
          }

          (newData[type].s || newData[type].st || []).forEach((p) => {
            if (!periods[p.i]) periods[p.i] = {};

            if (newData[type].s) {
              [periods[p.i].$time] = p.v;

              periods[p.i][type] = {
                open: p.v[1],
                close: p.v[4],
                max: p.v[2],
                min: p.v[3],
                change: Math.round(p.v[5] * 100) / 100,
              };
            }

            if (newData[type].st) {
              const period = {};
              const indicator = indicators[parseInt(type, 10)];

              p.v.forEach((val, i) => {
                if (i === 0) return;
                if (indicator.plots[`plot_${i - 1}`] && !period[indicator.plots[`plot_${i - 1}`]]) {
                  period[indicator.plots[`plot_${i - 1}`]] = val;
                } else period[`_plot_${i - 1}`] = val;
              });
              periods[p.i][chart.indicators[parseInt(type, 10)].name || `st${type}`] = period;
            }
          });
        }));
      }

      chartCBs[chartSession] = async (packet) => {
        if (isEnded) return;

        if (['timescale_update', 'du'].includes(packet.type)) {
          await updatePeriods(packet);
          if (!isEnded) onUpdate([...periods].reverse(), strategies);
          return;
        }

        if (packet.type.endsWith('_error')) {
          handleError(`Error on '${chart.symbol}' (${chartSession}) chart: "${packet.type}":`, packet);
        }
      };

      if (chart.session) send('set_auth_token', [(await getUser(chart.session)).authToken]);
      send('chart_create_session', [chartSession, '']);
      if (chart.timezone) send('switch_timezone', [chartSession, chart.timezone]);
      send('resolve_symbol', [chartSession, 'sds_sym_1', `={"symbol":"${chart.symbol || 'BTCEUR'}","adjustment":"splits"}`]);
      send('create_series', [chartSession, '$prices', 's1', 'sds_sym_1', (chart.period || '240'), (chart.range || 100), '']);

      indicators.forEach(async (indicator, i) => {
        const pineInfos = {
          pineId: indicator.pineId,
          pineVersion: indicator.pineVersion,
          text: indicator.script,
        };

        Object.keys(indicator.inputs).forEach((inputID, inp) => {
          const input = indicator.inputs[inputID];
          if (input.type === 'bool' && typeof input.value !== 'boolean') handleError(`Input '${input.name}' (${inp}) must be a boolean !`);
          if (input.type === 'integer' && typeof input.value !== 'number') handleError(`Input '${input.name}' (${inp}) must be a number !`);
          if (input.type === 'float' && typeof input.value !== 'number') handleError(`Input '${input.name}' (${inp}) must be a number !`);
          if (input.type === 'text' && typeof input.value !== 'string') handleError(`Input '${input.name}' (${inp}) must be a string !`);
          if (input.options && !input.options.includes(input.value)) {
            handleError(`Input '${input.name}' (${inp}) must be one of these values:`, input.options);
          }

          pineInfos[inputID] = {
            v: input.value,
            f: input.isFake,
            t: input.type,
          };
        });

        send('create_study', [chartSession, `${i}`, 'st1', '$prices', indicator.typeID, pineInfos]);
      });
    },

    send,
    sessionId,
  };
};
