declare function _exports(chartSession: import('./session').ChartSessionBridge): {
    new (indicator: PineIndicator | BuiltInIndicator): {
        "__#5@#studID": string;
        "__#5@#studyListeners": {
            [x: string]: Function[];
        };
        /**
         * Table of periods values indexed by timestamp
         * @type {Object<number, {}[]>}
         */
        "__#5@#periods": {
            [x: number]: {}[];
        };
        /** @return {{}[]} List of periods values */
        readonly periods: {}[];
        /**
         * List of graphic xPos indexes
         * @type {number[]}
         */
        "__#5@#indexes": number[];
        /**
         * Table of graphic drawings indexed by type and ID
         * @type {Object<string, Object<number, {}>>}
         */
        "__#5@#graphic": {
            [x: string]: {
                [x: number]: {};
            };
        };
        /**
         * Table of graphic drawings indexed by type
         * @return {import('./graphicParser').GraphicData}
         */
        readonly graphic: graphicParser.GraphicData;
        /** @type {StrategyReport} */
        "__#5@#strategyReport": StrategyReport;
        /** @return {StrategyReport} Get the strategy report if available */
        readonly strategyReport: StrategyReport;
        "__#5@#callbacks": {
            studyCompleted: any[];
            update: any[];
            event: any[];
            error: any[];
        };
        /**
         * @param {ChartEvent} ev Client event
         * @param {...{}} data Packet data
         */
        "__#5@#handleEvent"(ev: ChartEvent, ...data: {}[]): void;
        "__#5@#handleError"(...msgs: any[]): void;
        /** @type {PineIndicator | BuiltInIndicator} Indicator instance */
        instance: PineIndicator | BuiltInIndicator;
        /**
         * @param {PineIndicator | BuiltInIndicator} indicator Indicator instance
         */
        setIndicator(indicator: PineIndicator | BuiltInIndicator): void;
        /**
         * When the indicator is ready
         * @param {() => void} cb
         * @event
         */
        onReady(cb: () => void): void;
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
        onUpdate(cb: (changes: ("plots" | "report.currency" | "report.settings" | "report.perf" | "report.trades" | "report.history" | "graphic")[]) => void): void;
        /**
         * When indicator error happens
         * @param {(...any) => void} cb Callback
         * @event
         */
        onError(cb: (...any: any[]) => void): void;
        /** Remove the study */
        remove(): void;
    };
};
export = _exports;
/**
 * Trade report
 */
export type TradeReport = {
    /**
     * Trade entry
     */
    entry: {
        name: string;
        type: 'long' | 'short';
        value: number;
        time: number;
    };
    /**
     * Trade exit
     */
    exit: {
        name: '' | string;
        value: number;
        time: number;
    };
    /**
     * Trade quantity
     */
    quantity: number;
    /**
     * Trade profit
     */
    profit: RelAbsValue;
    /**
     * Trade cummulative profit
     */
    cumulative: RelAbsValue;
    /**
     * Trade run-up
     */
    runup: RelAbsValue;
    /**
     * Trade drawdown
     */
    drawdown: RelAbsValue;
};
export type PerfReport = {
    /**
     * Average bars in trade
     */
    avgBarsInTrade: number;
    /**
     * Average bars in winning trade
     */
    avgBarsInWinTrade: number;
    /**
     * Average bars in losing trade
     */
    avgBarsInLossTrade: number;
    /**
     * Average trade gain
     */
    avgTrade: number;
    /**
     * Average trade performace
     */
    avgTradePercent: number;
    /**
     * Average losing trade gain
     */
    avgLosTrade: number;
    /**
     * Average losing trade performace
     */
    avgLosTradePercent: number;
    /**
     * Average winning trade gain
     */
    avgWinTrade: number;
    /**
     * Average winning trade performace
     */
    avgWinTradePercent: number;
    /**
     * Commission paid
     */
    commissionPaid: number;
    /**
     * Gross loss value
     */
    grossLoss: number;
    /**
     * Gross loss percent
     */
    grossLossPercent: number;
    /**
     * Gross profit
     */
    grossProfit: number;
    /**
     * Gross profit percent
     */
    grossProfitPercent: number;
    /**
     * Largest losing trade gain
     */
    largestLosTrade: number;
    /**
     * Largent losing trade performance (percentage)
     */
    largestLosTradePercent: number;
    /**
     * Largest winning trade gain
     */
    largestWinTrade: number;
    /**
     * Largest winning trade performance (percentage)
     */
    largestWinTradePercent: number;
    /**
     * Margin calls
     */
    marginCalls: number;
    /**
     * Max Contracts Held
     */
    maxContractsHeld: number;
    /**
     * Net profit
     */
    netProfit: number;
    /**
     * Net performance (percentage)
     */
    netProfitPercent: number;
    /**
     * Number of losing trades
     */
    numberOfLosingTrades: number;
    /**
     * Number of winning trades
     */
    numberOfWiningTrades: number;
    /**
     * Strategy winrate
     */
    percentProfitable: number;
    /**
     * Profit factor
     */
    profitFactor: number;
    /**
     * Ratio Average Win / Average Loss
     */
    ratioAvgWinAvgLoss: number;
    /**
     * Total open trades
     */
    totalOpenTrades: number;
    /**
     * Total trades
     */
    totalTrades: number;
};
export type FromTo = {
    /**
     * From timestamp
     */
    from: number;
    /**
     * To timestamp
     */
    to: number;
};
export type StrategyReport = {
    /**
     * Selected currency
     */
    currency?: 'EUR' | 'USD' | 'JPY' | '' | 'CHF';
    /**
     * Backtester settings
     */
    settings?: {
        dateRange?: {
            backtest?: FromTo;
            trade?: FromTo;
        };
    };
    /**
     * Trade list starting by the last
     */
    trades: TradeReport[];
    /**
     * History Chart value
     */
    history: {
        buyHold?: number[];
        buyHoldPercent?: number[];
        drawDown?: number[];
        drawDownPercent?: number[];
        equity?: number[];
        equityPercent?: number[];
    };
    /**
     * Strategy performance
     */
    performance: {
        all?: PerfReport;
        long?: PerfReport;
        short?: PerfReport;
        buyHoldReturn?: number;
        buyHoldReturnPercent?: number;
        maxDrawDown?: number;
        maxDrawDownPercent?: number;
        openPL?: number;
        openPLPercent?: number;
        sharpeRatio?: number;
        sortinoRatio?: number;
    };
};
import PineIndicator = require("../classes/PineIndicator");
import BuiltInIndicator = require("../classes/BuiltInIndicator");
import graphicParser = require("./graphicParser");
