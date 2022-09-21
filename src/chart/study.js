const { genSessionID } = require('../utils');
const { parseCompressed } = require('../protocol');
const graphicParser = require('./graphicParser');

const PineIndicator = require('../classes/PineIndicator');
const BuiltInIndicator = require('../classes/BuiltInIndicator');

/**
 * Get pine inputs
 * @param {PineIndicator | BuiltInIndicator} options
 */
function getInputs(options) {
  if (options instanceof PineIndicator) {
    const pineInputs = { text: options.script };

    if (options.pineId) pineInputs.pineId = options.pineId;
    if (options.pineVersion) pineInputs.pineVersion = options.pineVersion;

    Object.keys(options.inputs).forEach((inputID, n) => {
      const input = options.inputs[inputID];

      pineInputs[inputID] = {
        v: (input.type !== 'color') ? input.value : n,
        f: input.isFake,
        t: input.type,
      };
    });

    return pineInputs;
  }

  return options.options;
}

const parseTrades = (trades) => trades.reverse().map((t) => ({
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
}));

// const historyParser = (history) => history.reverse().map((h) => ({

/**
 * @typedef {Object} TradeReport Trade report

 * @prop {Object} entry Trade entry
 * @prop {string} entry.name Trade name
 * @prop {'long' | 'short'} entry.type Entry type (long/short)
 * @prop {number} entry.value Entry price value
 * @prop {number} entry.time Entry timestamp

 * @prop {Object} exit Trade exit
 * @prop {'' | string} exit.name Trade name ('' if false exit)
 * @prop {number} exit.value Exit price value
 * @prop {number} exit.time Exit timestamp

 * @prop {number} quantity Trade quantity
 * @prop {RelAbsValue} profit Trade profit
 * @prop {RelAbsValue} cumulative Trade cummulative profit
 * @prop {RelAbsValue} runup Trade run-up
 * @prop {RelAbsValue} drawdown Trade drawdown
 */

/**
 * @typedef {Object} PerfReport
 * @prop {number} avgBarsInTrade Average bars in trade
 * @prop {number} avgBarsInWinTrade Average bars in winning trade
 * @prop {number} avgBarsInLossTrade Average bars in losing trade
 * @prop {number} avgTrade Average trade gain
 * @prop {number} avgTradePercent Average trade performace
 * @prop {number} avgLosTrade Average losing trade gain
 * @prop {number} avgLosTradePercent Average losing trade performace
 * @prop {number} avgWinTrade Average winning trade gain
 * @prop {number} avgWinTradePercent Average winning trade performace
 * @prop {number} commissionPaid Commission paid
 * @prop {number} grossLoss Gross loss value
 * @prop {number} grossLossPercent Gross loss percent
 * @prop {number} grossProfit Gross profit
 * @prop {number} grossProfitPercent Gross profit percent
 * @prop {number} largestLosTrade Largest losing trade gain
 * @prop {number} largestLosTradePercent Largent losing trade performance (percentage)
 * @prop {number} largestWinTrade Largest winning trade gain
 * @prop {number} largestWinTradePercent Largest winning trade performance (percentage)
 * @prop {number} marginCalls Margin calls
 * @prop {number} maxContractsHeld Max Contracts Held
 * @prop {number} netProfit Net profit
 * @prop {number} netProfitPercent Net performance (percentage)
 * @prop {number} numberOfLosingTrades Number of losing trades
 * @prop {number} numberOfWiningTrades Number of winning trades
 * @prop {number} percentProfitable Strategy winrate
 * @prop {number} profitFactor Profit factor
 * @prop {number} ratioAvgWinAvgLoss Ratio Average Win / Average Loss
 * @prop {number} totalOpenTrades Total open trades
 * @prop {number} totalTrades Total trades
*/

/**
 * @typedef {Object} FromTo
 * @prop {number} from From timestamp
 * @prop {number} to To timestamp
 */

/**
 * @typedef {Object} StrategyReport
 * @prop {'EUR' | 'USD' | 'JPY' | '' | 'CHF'} [currency] Selected currency
 * @prop {Object} [settings] Backtester settings
 * @prop {Object} [settings.dateRange] Backtester date range
 * @prop {FromTo} [settings.dateRange.backtest] Date range for backtest
 * @prop {FromTo} [settings.dateRange.trade] Date range for trade
 * @prop {TradeReport[]} trades Trade list starting by the last
 * @prop {Object} history History Chart value
 * @prop {number[]} [history.buyHold] Buy hold values
 * @prop {number[]} [history.buyHoldPercent] Buy hold percent values
 * @prop {number[]} [history.drawDown] Drawdown values
 * @prop {number[]} [history.drawDownPercent] Drawdown percent values
 * @prop {number[]} [history.equity] Equity values
 * @prop {number[]} [history.equityPercent] Equity percent values
 * @prop {Object} performance Strategy performance
 * @prop {PerfReport} [performance.all] Strategy long/short performances
 * @prop {PerfReport} [performance.long] Strategy long performances
 * @prop {PerfReport} [performance.short] Strategy short performances
 * @prop {number} [performance.buyHoldReturn] Strategy Buy & Hold Return
 * @prop {number} [performance.buyHoldReturnPercent] Strategy Buy & Hold Return percent
 * @prop {number} [performance.maxDrawDown] Strategy max drawdown
 * @prop {number} [performance.maxDrawDownPercent] Strategy max drawdown percent
 * @prop {number} [performance.openPL] Strategy Open P&L (Profit And Loss)
 * @prop {number} [performance.openPLPercent] Strategy Open P&L (Profit And Loss) percent
 * @prop {number} [performance.sharpeRatio] Strategy Sharpe Ratio
 * @prop {number} [performance.sortinoRatio] Strategy Sortino Ratio
 */

/**
 * @param {import('./session').ChartSessionBridge} chartSession
 */
module.exports = (chartSession) => class ChartStudy {
  #studID = genSessionID('st');

  #studyListeners = chartSession.studyListeners;

  /**
   * Table of periods values indexed by timestamp
   * @type {Object<number, {}[]>}
   */
  #periods = {};

  /** @return {{}[]} List of periods values */
  get periods() {
    return Object.values(this.#periods).sort((a, b) => b.$time - a.$time);
  }

  /**
   * List of graphic xPos indexes
   * @type {number[]}
   */
  #indexes = [];

  /**
   * Table of graphic drawings indexed by type and ID
   * @type {Object<string, Object<number, {}>>}
   */
  #graphic = {};

  /**
   * Table of graphic drawings indexed by type
   * @return {import('./graphicParser').GraphicData}
   */
  get graphic() {
    const translator = {};

    Object.keys(chartSession.indexes)
      .sort((a, b) => chartSession.indexes[b] - chartSession.indexes[a])
      .forEach((r, n) => { translator[r] = n; });

    const indexes = this.#indexes.map((i) => translator[i]);
    return graphicParser(this.#graphic, indexes);
  }

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

  #callbacks = {
    studyCompleted: [],
    update: [],

    event: [],
    error: [],
  };

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

  /**
   * @param {PineIndicator | BuiltInIndicator} indicator Indicator object instance
   */
  constructor(indicator) {
    if (!(indicator instanceof PineIndicator) && !(indicator instanceof BuiltInIndicator)) {
      throw new Error(`Indicator argument must be an instance of PineIndicator or BuiltInIndicator.
      Please use 'TradingView.getIndicator(...)' function.`);
    }

    /** @type {PineIndicator | BuiltInIndicator} Indicator instance */
    this.instance = indicator;

    this.#studyListeners[this.#studID] = async (packet) => {
      if (global.TW_DEBUG) console.log('§90§30§105 STUDY §0 DATA', packet);

      if (packet.type === 'study_completed') {
        this.#handleEvent('studyCompleted');
        return;
      }

      if (['timescale_update', 'du'].includes(packet.type)) {
        const changes = [];
        const data = packet.data[1][this.#studID];

        if (data && data.st && data.st[0]) {
          data.st.forEach((p) => {
            const period = {};

            p.v.forEach((plot, i) => {
              if (!this.instance.plots) {
                period[i === 0 ? '$time' : `plot_${i - 1}`] = plot;
                return;
              }
              const plotName = (i === 0 ? '$time' : this.instance.plots[`plot_${i - 1}`]);
              if (plotName && !period[plotName]) period[plotName] = plot;
              else period[`plot_${i - 1}`] = plot;
            });

            this.#periods[p.v[0]] = period;
          });

          changes.push('plots');
        }

        if (data.ns && data.ns.d) {
          const parsed = JSON.parse(data.ns.d);

          if (parsed.graphicsCmds) {
            if (parsed.graphicsCmds.erase) {
              parsed.graphicsCmds.erase.forEach((instruction) => {
                // console.log('Erase', instruction);
                if (instruction.action === 'all') {
                  if (!instruction.type) {
                    Object.keys(this.#graphic).forEach((drawType) => {
                      this.#graphic[drawType] = {};
                    });
                  } else delete this.#graphic[instruction.type];
                  return;
                }

                if (instruction.action === 'one') {
                  delete this.#graphic[instruction.type][instruction.id];
                }
                // Can an 'instruction' contains other things ?
              });
            }

            if (parsed.graphicsCmds.create) {
              Object.keys(parsed.graphicsCmds.create).forEach((drawType) => {
                if (!this.#graphic[drawType]) this.#graphic[drawType] = {};
                parsed.graphicsCmds.create[drawType].forEach((group) => {
                  group.data.forEach((item) => {
                    this.#graphic[drawType][item.id] = item;
                  });
                });
              });
            }

            // console.log('graphicsCmds', Object.keys(parsed.graphicsCmds));
            // Can 'graphicsCmds' contains other things ?

            changes.push('graphic');
          }

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
        }

        if (data.ns.indexes && typeof data.ns.indexes === 'object') {
          this.#indexes = data.ns.indexes;
        }

        this.#handleEvent('update', changes);
        return;
      }

      if (packet.type === 'study_error') {
        this.#handleError(packet.data[3], packet.data[4]);
      }
    };

    chartSession.send('create_study', [
      chartSession.sessionID,
      `${this.#studID}`,
      'st1',
      '$prices',
      this.instance.type,
      getInputs(this.instance),
    ]);
  }

  /**
   * @param {PineIndicator | BuiltInIndicator} indicator Indicator instance
   */
  setIndicator(indicator) {
    if (!(indicator instanceof PineIndicator) && !(indicator instanceof BuiltInIndicator)) {
      throw new Error(`Indicator argument must be an instance of PineIndicator or BuiltInIndicator.
      Please use 'TradingView.getIndicator(...)' function.`);
    }

    this.instance = indicator;

    chartSession.send('modify_study', [
      chartSession.sessionID,
      `${this.#studID}`,
      'st1',
      getInputs(this.instance),
    ]);
  }

  /**
   * When the indicator is ready
   * @param {() => void} cb
   * @event
   */
  onReady(cb) {
    this.#callbacks.studyCompleted.push(cb);
  }

  /**
   * @typedef {'plots' | 'report.currency'
   *  | 'report.settings' | 'report.perf'
   *  | 'report.trades' | 'report.history'
   *  | 'graphic'
   * } UpdateChangeType
   */

  /**
   * When an indicator update happens
   * @param {(changes: UpdateChangeType[]) => void} cb
   * @event
   */
  onUpdate(cb) {
    this.#callbacks.update.push(cb);
  }

  /**
   * When indicator error happens
   * @param {(...any) => void} cb Callback
   * @event
   */
  onError(cb) {
    this.#callbacks.error.push(cb);
  }

  /** Remove the study */
  remove() {
    chartSession.send('remove_study', [
      chartSession.sessionID,
      this.#studID,
    ]);
    delete this.#studyListeners[this.#studID];
  }
};
