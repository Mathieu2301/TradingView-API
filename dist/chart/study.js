var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var genSessionID = require('../utils').genSessionID;
var parseCompressed = require('../protocol').parseCompressed;
var graphicParser = require('./graphicParser');
var PineIndicator = require('../classes/PineIndicator');
var BuiltInIndicator = require('../classes/BuiltInIndicator');
/**
 * Get pine inputs
 * @param {PineIndicator | BuiltInIndicator} options
 */
function getInputs(options) {
    if (options instanceof PineIndicator) {
        var pineInputs_1 = { text: options.script };
        if (options.pineId)
            pineInputs_1.pineId = options.pineId;
        if (options.pineVersion)
            pineInputs_1.pineVersion = options.pineVersion;
        Object.keys(options.inputs).forEach(function (inputID, n) {
            var input = options.inputs[inputID];
            pineInputs_1[inputID] = {
                v: (input.type !== 'color') ? input.value : n,
                f: input.isFake,
                t: input.type,
            };
        });
        return pineInputs_1;
    }
    return options.options;
}
var parseTrades = function (trades) { return trades.reverse().map(function (t) { return ({
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
}); }); };
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
module.exports = function (chartSession) { var _ChartStudy_instances, _ChartStudy_studID, _ChartStudy_studyListeners, _ChartStudy_periods, _ChartStudy_indexes, _ChartStudy_graphic, _ChartStudy_strategyReport, _ChartStudy_callbacks, _ChartStudy_handleEvent, _ChartStudy_handleError, _a; return _a = /** @class */ (function () {
        /**
         * @param {PineIndicator | BuiltInIndicator} indicator Indicator object instance
         */
        function ChartStudy(indicator) {
            var _this = this;
            _ChartStudy_instances.add(this);
            _ChartStudy_studID.set(this, genSessionID('st'));
            _ChartStudy_studyListeners.set(this, chartSession.studyListeners);
            /**
             * Table of periods values indexed by timestamp
             * @type {Object<number, {}[]>}
             */
            _ChartStudy_periods.set(this, {});
            /**
             * List of graphic xPos indexes
             * @type {number[]}
             */
            _ChartStudy_indexes.set(this, []);
            /**
             * Table of graphic drawings indexed by type and ID
             * @type {Object<string, Object<number, {}>>}
             */
            _ChartStudy_graphic.set(this, {});
            /** @type {StrategyReport} */
            _ChartStudy_strategyReport.set(this, {
                trades: [],
                history: {},
                performance: {},
            });
            _ChartStudy_callbacks.set(this, {
                studyCompleted: [],
                update: [],
                event: [],
                error: [],
            });
            if (!(indicator instanceof PineIndicator) && !(indicator instanceof BuiltInIndicator)) {
                throw new Error("Indicator argument must be an instance of PineIndicator or BuiltInIndicator.\n      Please use 'TradingView.getIndicator(...)' function.");
            }
            /** @type {PineIndicator | BuiltInIndicator} Indicator instance */
            this.instance = indicator;
            __classPrivateFieldGet(this, _ChartStudy_studyListeners, "f")[__classPrivateFieldGet(this, _ChartStudy_studID, "f")] = function (packet) { return __awaiter(_this, void 0, void 0, function () {
                var changes_1, data, parsed_1, updateStrategyReport, _a;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (global.TW_DEBUG)
                                console.log('§90§30§105 STUDY §0 DATA', packet);
                            if (packet.type === 'study_completed') {
                                __classPrivateFieldGet(this, _ChartStudy_instances, "m", _ChartStudy_handleEvent).call(this, 'studyCompleted');
                                return [2 /*return*/];
                            }
                            if (!['timescale_update', 'du'].includes(packet.type)) return [3 /*break*/, 4];
                            changes_1 = [];
                            data = packet.data[1][__classPrivateFieldGet(this, _ChartStudy_studID, "f")];
                            if (data && data.st && data.st[0]) {
                                data.st.forEach(function (p) {
                                    var period = {};
                                    p.v.forEach(function (plot, i) {
                                        if (!_this.instance.plots) {
                                            period[i === 0 ? '$time' : "plot_".concat(i - 1)] = plot;
                                            return;
                                        }
                                        var plotName = (i === 0 ? '$time' : _this.instance.plots["plot_".concat(i - 1)]);
                                        if (plotName && !period[plotName])
                                            period[plotName] = plot;
                                        else
                                            period["plot_".concat(i - 1)] = plot;
                                    });
                                    __classPrivateFieldGet(_this, _ChartStudy_periods, "f")[p.v[0]] = period;
                                });
                                changes_1.push('plots');
                            }
                            if (!(data.ns && data.ns.d)) return [3 /*break*/, 3];
                            parsed_1 = JSON.parse(data.ns.d);
                            if (parsed_1.graphicsCmds) {
                                if (parsed_1.graphicsCmds.erase) {
                                    parsed_1.graphicsCmds.erase.forEach(function (instruction) {
                                        // console.log('Erase', instruction);
                                        if (instruction.action === 'all') {
                                            if (!instruction.type) {
                                                Object.keys(__classPrivateFieldGet(_this, _ChartStudy_graphic, "f")).forEach(function (drawType) {
                                                    __classPrivateFieldGet(_this, _ChartStudy_graphic, "f")[drawType] = {};
                                                });
                                            }
                                            else
                                                delete __classPrivateFieldGet(_this, _ChartStudy_graphic, "f")[instruction.type];
                                            return;
                                        }
                                        if (instruction.action === 'one') {
                                            delete __classPrivateFieldGet(_this, _ChartStudy_graphic, "f")[instruction.type][instruction.id];
                                        }
                                        // Can an 'instruction' contains other things ?
                                    });
                                }
                                if (parsed_1.graphicsCmds.create) {
                                    Object.keys(parsed_1.graphicsCmds.create).forEach(function (drawType) {
                                        if (!__classPrivateFieldGet(_this, _ChartStudy_graphic, "f")[drawType])
                                            __classPrivateFieldGet(_this, _ChartStudy_graphic, "f")[drawType] = {};
                                        parsed_1.graphicsCmds.create[drawType].forEach(function (group) {
                                            group.data.forEach(function (item) {
                                                __classPrivateFieldGet(_this, _ChartStudy_graphic, "f")[drawType][item.id] = item;
                                            });
                                        });
                                    });
                                }
                                // console.log('graphicsCmds', Object.keys(parsed.graphicsCmds));
                                // Can 'graphicsCmds' contains other things ?
                                changes_1.push('graphic');
                            }
                            updateStrategyReport = function (report) {
                                if (report.currency) {
                                    __classPrivateFieldGet(_this, _ChartStudy_strategyReport, "f").currency = report.currency;
                                    changes_1.push('report.currency');
                                }
                                if (report.settings) {
                                    __classPrivateFieldGet(_this, _ChartStudy_strategyReport, "f").settings = report.settings;
                                    changes_1.push('report.settings');
                                }
                                if (report.performance) {
                                    __classPrivateFieldGet(_this, _ChartStudy_strategyReport, "f").performance = report.performance;
                                    changes_1.push('report.perf');
                                }
                                if (report.trades) {
                                    __classPrivateFieldGet(_this, _ChartStudy_strategyReport, "f").trades = parseTrades(report.trades);
                                    changes_1.push('report.trades');
                                }
                                if (report.equity) {
                                    __classPrivateFieldGet(_this, _ChartStudy_strategyReport, "f").history = {
                                        buyHold: report.buyHold,
                                        buyHoldPercent: report.buyHoldPercent,
                                        drawDown: report.drawDown,
                                        drawDownPercent: report.drawDownPercent,
                                        equity: report.equity,
                                        equityPercent: report.equityPercent,
                                    };
                                    changes_1.push('report.history');
                                }
                            };
                            if (!parsed_1.dataCompressed) return [3 /*break*/, 2];
                            _a = updateStrategyReport;
                            return [4 /*yield*/, parseCompressed(parsed_1.dataCompressed)];
                        case 1:
                            _a.apply(void 0, [(_b.sent()).report]);
                            _b.label = 2;
                        case 2:
                            if (parsed_1.data && parsed_1.data.report)
                                updateStrategyReport(parsed_1.data.report);
                            _b.label = 3;
                        case 3:
                            if (data.ns.indexes && typeof data.ns.indexes === 'object') {
                                __classPrivateFieldSet(this, _ChartStudy_indexes, data.ns.indexes, "f");
                            }
                            __classPrivateFieldGet(this, _ChartStudy_instances, "m", _ChartStudy_handleEvent).call(this, 'update', changes_1);
                            return [2 /*return*/];
                        case 4:
                            if (packet.type === 'study_error') {
                                __classPrivateFieldGet(this, _ChartStudy_instances, "m", _ChartStudy_handleError).call(this, packet.data[3], packet.data[4]);
                            }
                            return [2 /*return*/];
                    }
                });
            }); };
            chartSession.send('create_study', [
                chartSession.sessionID,
                "".concat(__classPrivateFieldGet(this, _ChartStudy_studID, "f")),
                'st1',
                '$prices',
                this.instance.type,
                getInputs(this.instance),
            ]);
        }
        Object.defineProperty(ChartStudy.prototype, "periods", {
            /** @return {{}[]} List of periods values */
            get: function () {
                return Object.values(__classPrivateFieldGet(this, _ChartStudy_periods, "f")).sort(function (a, b) { return b.$time - a.$time; });
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ChartStudy.prototype, "graphic", {
            /**
             * Table of graphic drawings indexed by type
             * @return {import('./graphicParser').GraphicData}
             */
            get: function () {
                var translator = {};
                Object.keys(chartSession.indexes)
                    .sort(function (a, b) { return chartSession.indexes[b] - chartSession.indexes[a]; })
                    .forEach(function (r, n) { translator[r] = n; });
                var indexes = __classPrivateFieldGet(this, _ChartStudy_indexes, "f").map(function (i) { return translator[i]; });
                return graphicParser(__classPrivateFieldGet(this, _ChartStudy_graphic, "f"), indexes);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ChartStudy.prototype, "strategyReport", {
            /** @return {StrategyReport} Get the strategy report if available */
            get: function () {
                return __classPrivateFieldGet(this, _ChartStudy_strategyReport, "f");
            },
            enumerable: false,
            configurable: true
        });
        /**
         * @param {PineIndicator | BuiltInIndicator} indicator Indicator instance
         */
        ChartStudy.prototype.setIndicator = function (indicator) {
            if (!(indicator instanceof PineIndicator) && !(indicator instanceof BuiltInIndicator)) {
                throw new Error("Indicator argument must be an instance of PineIndicator or BuiltInIndicator.\n      Please use 'TradingView.getIndicator(...)' function.");
            }
            this.instance = indicator;
            chartSession.send('modify_study', [
                chartSession.sessionID,
                "".concat(__classPrivateFieldGet(this, _ChartStudy_studID, "f")),
                'st1',
                getInputs(this.instance),
            ]);
        };
        /**
         * When the indicator is ready
         * @param {() => void} cb
         * @event
         */
        ChartStudy.prototype.onReady = function (cb) {
            __classPrivateFieldGet(this, _ChartStudy_callbacks, "f").studyCompleted.push(cb);
        };
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
        ChartStudy.prototype.onUpdate = function (cb) {
            __classPrivateFieldGet(this, _ChartStudy_callbacks, "f").update.push(cb);
        };
        /**
         * When indicator error happens
         * @param {(...any) => void} cb Callback
         * @event
         */
        ChartStudy.prototype.onError = function (cb) {
            __classPrivateFieldGet(this, _ChartStudy_callbacks, "f").error.push(cb);
        };
        /** Remove the study */
        ChartStudy.prototype.remove = function () {
            chartSession.send('remove_study', [
                chartSession.sessionID,
                __classPrivateFieldGet(this, _ChartStudy_studID, "f"),
            ]);
            delete __classPrivateFieldGet(this, _ChartStudy_studyListeners, "f")[__classPrivateFieldGet(this, _ChartStudy_studID, "f")];
        };
        return ChartStudy;
    }()),
    _ChartStudy_studID = new WeakMap(),
    _ChartStudy_studyListeners = new WeakMap(),
    _ChartStudy_periods = new WeakMap(),
    _ChartStudy_indexes = new WeakMap(),
    _ChartStudy_graphic = new WeakMap(),
    _ChartStudy_strategyReport = new WeakMap(),
    _ChartStudy_callbacks = new WeakMap(),
    _ChartStudy_instances = new WeakSet(),
    _ChartStudy_handleEvent = function _ChartStudy_handleEvent(ev) {
        var data = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            data[_i - 1] = arguments[_i];
        }
        __classPrivateFieldGet(this, _ChartStudy_callbacks, "f")[ev].forEach(function (e) { return e.apply(void 0, data); });
        __classPrivateFieldGet(this, _ChartStudy_callbacks, "f").event.forEach(function (e) { return e.apply(void 0, __spreadArray([ev], data, false)); });
    },
    _ChartStudy_handleError = function _ChartStudy_handleError() {
        var _a;
        var msgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            msgs[_i] = arguments[_i];
        }
        if (__classPrivateFieldGet(this, _ChartStudy_callbacks, "f").error.length === 0)
            console.error.apply(console, msgs);
        else
            (_a = __classPrivateFieldGet(this, _ChartStudy_instances, "m", _ChartStudy_handleEvent)).call.apply(_a, __spreadArray([this, 'error'], msgs, false));
    },
    _a; };
