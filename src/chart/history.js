const { genSessionID } = require('../utils');
const { parseCompressed } = require('../protocol');
const { getInputs, parseTrades } = require('./study');

/**
 * @param {import('../client').ClientBridge} client
 */
module.exports = (client) => class HistorySession {
    #historySessionID = genSessionID('hs');

    /** Parent client */
    #client = client;

    #callbacks = {
      historyLoaded: [],

      event: [],
      error: [],
    };

    /** @type {StrategyReport} */
    #strategyReport = {
      trades: [],
      history: {},
      performance: {},
    };

    /** @return {StrategyReport} Get the strategy report if available */
    get strategyReport() {
      return this.#strategyReport;
    }

    /**
     * @param {ChartEvent} ev Client event
     * @param {...{}} data Packet data
     */
    #handleEvent(ev, ...data) {
      this.#callbacks[ev].forEach((e) => e(...data));
      this.#callbacks.event.forEach((e) => e(ev, ...data));
    }

    #handleError(...msgs) {
      if (this.#callbacks.error.length === 0) console.error(...msgs);
      else this.#handleEvent('error', ...msgs);
    }

    constructor() {
      this.#client.sessions[this.#historySessionID] = {
        type: 'history',
        onData: async (packet) => {
          if (global.TW_DEBUG) console.log('§90§30§106 HISTORY SESSION §0 DATA', packet);

          if (packet.type === 'request_data') {
            const data = packet.data[2];
            if (data.ns && data.ns.d) {
              const parsed = JSON.parse(data.ns.d);
              const changes = await this.updateReport(parsed);
              this.#handleEvent('historyLoaded', changes);
            }
          }

          if (packet.type === 'request_error') {
            const [, name, description] = packet.data;
            this.#handleError('Critical error:', name, description);
          }
        },
      };

      this.#client.send('history_create_session', [this.#historySessionID]);
    }

    async updateReport(parsed) {
      const changes = [];
      const updateStrategyReport = (report) => {
        if (report.currency) {
          this.#strategyReport.currency = report.currency;
          changes.push('report.currency');
        }

        if (report.settings) {
          this.#strategyReport.settings = report.settings;
          changes.push('report.settings');
        }

        if (report.performance) {
          this.#strategyReport.performance = report.performance;
          changes.push('report.perf');
        }

        if (report.trades) {
          this.#strategyReport.trades = parseTrades(report.trades);
          changes.push('report.trades');
        }

        if (report.equity) {
          this.#strategyReport.history = {
            buyHold: report.buyHold,
            buyHoldPercent: report.buyHoldPercent,
            drawDown: report.drawDown,
            drawDownPercent: report.drawDownPercent,
            equity: report.equity,
            equityPercent: report.equityPercent,
          };
          changes.push('report.history');
        }
      };

      if (parsed.dataCompressed) {
        updateStrategyReport((await parseCompressed(parsed.dataCompressed)).report);
      }

      if (parsed.data && parsed.data.report) updateStrategyReport(parsed.data.report);

      return changes;
    }

    /**
   * Sets the history market
   * @param {string} symbol Market symbol
   * @param {number} from Deep backtest starting point (Timestamp)
   * @param {number} to Deep backtest ending point (Timestamp)
   * @param {PineIndicator} indicatorOptions Indicator options
   * @param {Object} chartOptions Chart options
   * @param {import('../types').TimeFrame} [options.timeframe] Chart period timeframe
   * @param {'splits' | 'dividends'} [chartOptions.adjustment] Market adjustment
   * @param {'regular' | 'extended'} [chartOptions.session] Chart session
   * @param {'EUR' | 'USD' | string} [chartOptions.currency] Chart currency
   */
    requestHistoryData(symbol, from, to, indicatorOptions, chartOptions) {
      const symbolInit = {
        symbol: symbol || 'BTCEUR',
        adjustment: chartOptions.adjustment || 'splits',
      };

      if (chartOptions.session) symbolInit.session = chartOptions.session;
      if (chartOptions.currency) symbolInit['currency-id'] = chartOptions.currency;

      this.#client.send('request_history_data', [
        this.#historySessionID,
        0, // what is this?
        `=${JSON.stringify(symbolInit)}`,
        chartOptions.timeframe,
        0, // what is this?
        { from_to: { from, to } },
        'StrategyScript@tv-scripting-101!',
        getInputs(indicatorOptions),
        [], // what is this?
      ]);
    }

    /**
   * When a deep backtest history is loaded
   * @param {() => void} cb
   * @event
   */
    onHistoryLoaded(cb) {
      this.#callbacks.historyLoaded.push(cb);
    }

    /**
   * When deep backtest history error happens
   * @param {(...any) => void} cb Callback
   * @event
   */
    onError(cb) {
      this.#callbacks.error.push(cb);
    }

  /** @type {HistorySessionBridge} */
  #historySession = {
    sessionID: this.#historySessionID,
    send: (t, p) => this.#client.send(t, p),
  };

  /** Delete the chart session */
  delete() {
    this.#client.send('history_delete_session', [this.#historySessionID]);
    delete this.#client.sessions[this.#historySessionID];
  }
};
