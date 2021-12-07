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

    Object.keys(options.inputs).forEach((inputID) => {
      const input = options.inputs[inputID];

      pineInputs[inputID] = {
        v: input.value,
        f: input.isFake,
        t: input.type,
      };
    });

    return pineInputs;
  }

  return options.options;
}

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
 * @property {number} largestLosTradePercent Largent losing trade performance (percentage)
 * @property {number} largestWinTrade Largest winning trade gain
 * @property {number} largestWinTradePercent Largest winning trade performance (percentage)
 * @property {number} marginCalls Margin calls
 * @property {number} maxContractsHeld Max Contracts Held
 * @property {number} netProfit Net profit
 * @property {number} netProfitPercent Net performance (percentage)
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
 * @property {'EUR' | 'USD' | 'JPY' | '' | 'CHF'} [currency] Selected currency
 * @property {TradeReport[]} trades Trade list starting by the last
 * @property {Object} history History Chart value
 * @property {number[]} [history.buyHold] Buy hold values
 * @property {number[]} [history.buyHoldPercent] Buy hold percent values
 * @property {number[]} [history.drawDown] Drawdown values
 * @property {number[]} [history.drawDownPercent] Drawdown percent values
 * @property {number[]} [history.equity] Equity values
 * @property {number[]} [history.equityPercent] Equity percent values
 * @property {Object} performance Strategy performance
 * @property {PerfReport} [performance.all] Strategy long/short performances
 * @property {PerfReport} [performance.long] Strategy long performances
 * @property {PerfReport} [performance.short] Strategy short performances
 * @property {number} [performance.buyHoldReturn] Strategy Buy & Hold Return
 * @property {number} [performance.buyHoldReturnPercent] Strategy Buy & Hold Return percent
 * @property {number} [performance.maxDrawDown] Strategy max drawdown
 * @property {number} [performance.maxDrawDownPercent] Strategy max drawdown percent
 * @property {number} [performance.openPL] Strategy Open P&L (Profit And Loss)
 * @property {number} [performance.openPLPercent] Strategy Open P&L (Profit And Loss) percent
 * @property {number} [performance.sharpeRatio] Strategy Sharpe Ratio
 * @property {number} [performance.sortinoRatio] Strategy Sortino Ratio
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
                  } else this.#graphic[instruction.type] = {};
                  return;
                }

                if (instruction.action === 'one') {
                  this.#graphic[instruction.type][instruction.id] = {};
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

            console.log('graphicsCmds', Object.keys(parsed.graphicsCmds));
            // Can 'graphicsCmds' contains other things ?

            changes.push('graphic');
          }

          if (parsed.data && parsed.data.report && parsed.data.report.performance) {
            this.#strategyReport.performance = parsed.data.report.performance;
            changes.push('perfReport');
          }

          if (parsed.dataCompressed) {
            const parsedC = await parseCompressed(parsed.dataCompressed);

            this.#strategyReport = {
              currency: parsedC.report.currency,

              trades: parsedC.report.trades.reverse().map((t) => ({
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
                buyHold: parsedC.report.buyHold,
                buyHoldPercent: parsedC.report.buyHoldPercent,
                drawDown: parsedC.report.drawDown,
                drawDownPercent: parsedC.report.drawDownPercent,
                equity: parsedC.report.equity,
                equityPercent: parsedC.report.equityPercent,
              },

              performance: parsedC.report.performance,
            };

            changes.push('fullReport');
          }
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

  /** @typedef {'plots' | 'perfReport' | 'fullReport'} UpdateChangeType */

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
