declare function _exports(client: import('../client').ClientBridge): {
    new (): {
        "__#6@#chartSessionID": string;
        "__#6@#replaySessionID": string;
        "__#6@#replayMode": boolean;
        /** @type {Object<string, (): any>} */
        "__#6@#replayOKCB": {
            [x: string]: () => any;
        };
        /** Parent client */
        "__#6@#client": import("../client").ClientBridge;
        /** @type {StudyListeners} */
        "__#6@#studyListeners": StudyListeners;
        /**
         * Table of periods values indexed by timestamp
         * @type {Object<number, PricePeriod[]>}
         */
        "__#6@#periods": {
            [x: number]: PricePeriod[];
        };
        /** @return {PricePeriod[]} List of periods values */
        readonly periods: PricePeriod[];
        /**
         * Current market infos
         * @type {MarketInfos}
         */
        "__#6@#infos": MarketInfos;
        /** @return {MarketInfos} Current market infos */
        readonly infos: MarketInfos;
        "__#6@#callbacks": {
            seriesLoaded: any[];
            symbolLoaded: any[];
            update: any[];
            replayLoaded: any[];
            replayPoint: any[];
            replayResolution: any[];
            replayEnd: any[];
            event: any[];
            error: any[];
        };
        /**
         * @param {ChartEvent} ev Client event
         * @param {...{}} data Packet data
         */
        "__#6@#handleEvent"(ev: ChartEvent, ...data: {}[]): void;
        "__#6@#handleError"(...msgs: any[]): void;
        "__#6@#seriesCreated": boolean;
        "__#6@#currentSeries": number;
        /**
         * @param {import('../types').TimeFrame} timeframe Chart period timeframe
         * @param {number} [range] Number of loaded periods/candles (Default: 100)
         * @param {number} [reference] Reference candle timestamp (Default is now)
         */
        setSeries(timeframe?: import('../types').TimeFrame, range?: number, reference?: number): void;
        /**
         * Set the chart market
         * @param {string} symbol Market symbol
         * @param {Object} [options] Chart options
         * @param {import('../types').TimeFrame} [options.timeframe] Chart period timeframe
         * @param {number} [options.range] Number of loaded periods/candles (Default: 100)
         * @param {number} [options.to] Last candle timestamp (Default is now)
         * @param {'splits' | 'dividends'} [options.adjustment] Market adjustment
         * @param {'regular' | 'extended'} [options.session] Chart session
         * @param {'EUR' | 'USD' | string} [options.currency] Chart currency
         * @param {ChartType} [options.type] Chart custom type
         * @param {ChartInputs} [options.inputs] Chart custom inputs
         * @param {number} [options.replay] Replay mode starting point (Timestamp)
         */
        setMarket(symbol: string, options?: {
            timeframe?: import('../types').TimeFrame;
            range?: number;
            to?: number;
            adjustment?: 'splits' | 'dividends';
            session?: 'regular' | 'extended';
            currency?: 'EUR' | 'USD' | string;
            type?: ChartType;
            inputs?: ChartInputs;
            replay?: number;
        }): void;
        /**
         * Set the chart timezone
         * @param {import('../types').Timezone} timezone New timezone
         */
        setTimezone(timezone: import('../types').Timezone): void;
        /**
         * Fetch x additional previous periods/candles values
         * @param {number} number Number of additional periods/candles you want to fetch
         */
        fetchMore(number?: number): void;
        /**
         * Fetch x additional previous periods/candles values
         * @param {number} number Number of additional periods/candles you want to fetch
         * @returns {Promise} Raise when the data has been fetched
         */
        replayStep(number?: number): Promise<any>;
        /**
         * Start fetching a new period/candle every x ms
         * @param {number} interval Number of additional periods/candles you want to fetch
         * @returns {Promise} Raise when the replay mode starts
         */
        replayStart(interval?: number): Promise<any>;
        /**
         * Stop fetching a new period/candle every x ms
         * @returns {Promise} Raise when the replay mode stops
         */
        replayStop(): Promise<any>;
        /**
         * When a symbol is loaded
         * @param {() => void} cb
         * @event
         */
        onSymbolLoaded(cb: () => void): void;
        /**
         * When a chart update happens
         * @param {(changes: ('$prices' | string)[]) => void} cb
         * @event
         */
        onUpdate(cb: (changes: ('$prices' | string)[]) => void): void;
        /**
         * When the replay session is ready
         * @param {() => void} cb
         * @event
         */
        onReplayLoaded(cb: () => void): void;
        /**
         * When the replay session has new resolution
         * @param {(
         *   timeframe: import('../types').TimeFrame,
         *   index: number,
         * ) => void} cb
         * @event
         */
        onReplayResolution(cb: (timeframe: import('../types').TimeFrame, index: number) => void): void;
        /**
         * When the replay session ends
         * @param {() => void} cb
         * @event
         */
        onReplayEnd(cb: () => void): void;
        /**
         * When the replay session cursor has moved
         * @param {(index: number) => void} cb
         * @event
         */
        onReplayPoint(cb: (index: number) => void): void;
        /**
         * When chart error happens
         * @param {(...any) => void} cb Callback
         * @event
         */
        onError(cb: (...any: any[]) => void): void;
        /** @type {ChartSessionBridge} */
        "__#6@#chartSession": ChartSessionBridge;
        Study: {
            new (indicator: import("../classes/PineIndicator") | import("../classes/BuiltInIndicator")): {
                "__#5@#studID": string;
                "__#5@#studyListeners": {
                    [x: string]: Function[];
                };
                "__#5@#periods": {
                    [x: number]: {}[];
                };
                readonly periods: {}[];
                "__#5@#indexes": number[];
                "__#5@#graphic": {
                    [x: string]: {
                        [x: number]: {};
                    };
                };
                readonly graphic: import("./graphicParser").GraphicData;
                "__#5@#strategyReport": studyConstructor.StrategyReport;
                readonly strategyReport: studyConstructor.StrategyReport;
                "__#5@#callbacks": {
                    studyCompleted: any[];
                    update: any[];
                    event: any[];
                    error: any[];
                };
                "__#5@#handleEvent"(ev: ChartEvent, ...data: {}[]): void;
                "__#5@#handleError"(...msgs: any[]): void;
                instance: import("../classes/PineIndicator") | import("../classes/BuiltInIndicator");
                setIndicator(indicator: import("../classes/PineIndicator") | import("../classes/BuiltInIndicator")): void;
                onReady(cb: () => void): void;
                onUpdate(cb: (changes: ("plots" | "report.currency" | "report.settings" | "report.perf" | "report.trades" | "report.history" | "graphic")[]) => void): void;
                onError(cb: (...any: any[]) => void): void;
                remove(): void;
            };
        };
        /** Delete the chart session */
        delete(): void;
    };
};
export = _exports;
/**
 * Custom chart type
 */
export type ChartType = 'HeikinAshi' | 'Renko' | 'LineBreak' | 'Kagi' | 'PointAndFigure' | 'Range';
/**
 * Custom chart type
 */
export type ChartInputs = {
    /**
     * Renko/Kagi/PointAndFigure ATR length
     */
    atrLength?: number;
    /**
     * Renko/LineBreak/Kagi source
     */
    source?: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';
    /**
     * Renko/Kagi/PointAndFigure style
     */
    style?: 'ATR' | string;
    /**
     * Renko/PointAndFigure box size
     */
    boxSize?: number;
    /**
     * Kagi/PointAndFigure reversal amount
     */
    reversalAmount?: number;
    /**
     * Renko/PointAndFigure sources
     */
    sources?: 'Close';
    /**
     * Renko wicks
     */
    wicks?: boolean;
    /**
     * LineBreak Line break
     */
    lb?: number;
    /**
     * PointAndFigure oneStepBackBuilding
     */
    oneStepBackBuilding?: boolean;
    /**
     * Range phantom bars
     */
    phantomBars?: boolean;
    /**
     * Range range
     */
    range?: number;
};
export type StudyListeners = {
    [x: string]: Function[];
};
export type ChartSessionBridge = {
    sessionID: string;
    studyListeners: StudyListeners;
    indexes: {
        [x: number]: number;
    };
    send: import('../client').SendPacket;
};
export type ChartEvent = 'seriesLoaded' | 'symbolLoaded' | 'update' | 'error';
export type PricePeriod = {
    /**
     * Period timestamp
     */
    time: number;
    /**
     * Period open value
     */
    open: number;
    /**
     * Period close value
     */
    close: number;
    /**
     * Period max value
     */
    max: number;
    /**
     * Period min value
     */
    min: number;
    /**
     * Period volume value
     */
    volume: number;
};
export type Subsession = {
    /**
     * Subsession ID (ex: 'regular')
     */
    id: string;
    /**
     * Subsession description (ex: 'Regular')
     */
    description: string;
    /**
     * If private
     */
    private: boolean;
    /**
     * Session (ex: '24x7')
     */
    session: string;
    /**
     * Session correction
     */
    "session-correction": string;
    /**
     * Session display (ex: '24x7')
     */
    "session-display": string;
};
export type MarketInfos = {
    /**
     * Used series (ex: 'ser_1')
     */
    series_id: string;
    /**
     * Base currency (ex: 'BTC')
     */
    base_currency: string;
    /**
     * Base currency ID (ex: 'XTVCBTC')
     */
    base_currency_id: string;
    /**
     * Market short name (ex: 'BTCEUR')
     */
    name: string;
    /**
     * Market full name (ex: 'COINBASE:BTCEUR')
     */
    full_name: string;
    /**
     * Market pro name (ex: 'COINBASE:BTCEUR')
     */
    pro_name: string;
    /**
     * Market symbol description (ex: 'BTC/EUR')
     */
    description: string;
    /**
     * Market symbol short description (ex: 'BTC/EUR')
     */
    short_description: string;
    /**
     * Market exchange (ex: 'COINBASE')
     */
    exchange: string;
    /**
     * Market exchange (ex: 'COINBASE')
     */
    listed_exchange: string;
    /**
     * Values provider ID (ex: 'coinbase')
     */
    provider_id: string;
    /**
     * Used currency ID (ex: 'EUR')
     */
    currency_id: string;
    /**
     * Used currency code (ex: 'EUR')
     */
    currency_code: string;
    /**
     * Variable tick size
     */
    variable_tick_size: string;
    /**
     * Price scale
     */
    pricescale: number;
    /**
     * Point value
     */
    pointvalue: number;
    /**
     * Session (ex: '24x7')
     */
    session: string;
    /**
     * Session display (ex: '24x7')
     */
    session_display: string;
    /**
     * Market type (ex: 'crypto')
     */
    type: string;
    /**
     * If intraday values are available
     */
    has_intraday: boolean;
    /**
     * If market is fractional
     */
    fractional: boolean;
    /**
     * If the market is curently tradable
     */
    is_tradable: boolean;
    /**
     * Minimum move value
     */
    minmov: number;
    /**
     * Minimum move value 2
     */
    minmove2: number;
    /**
     * Used timezone
     */
    timezone: string;
    /**
     * If the replay mode is available
     */
    is_replayable: boolean;
    /**
     * If the adjustment mode is enabled
     */
    has_adjustment: boolean;
    /**
     * Has extended hours
     */
    has_extended_hours: boolean;
    /**
     * Bar source
     */
    bar_source: string;
    /**
     * Bar transform
     */
    bar_transform: string;
    /**
     * Bar fill gaps
     */
    bar_fillgaps: boolean;
    /**
     * Allowed adjustment (ex: 'none')
     */
    allowed_adjustment: string;
    /**
     * Subsession ID (ex: 'regular')
     */
    subsession_id: string;
    /**
     * Pro permission (ex: '')
     */
    pro_perm: string;
    /**
     * Base name (ex: ['COINBASE:BTCEUR'])
     */
    base_name: [];
    /**
     * Legs (ex: ['COINBASE:BTCEUR'])
     */
    legs: [];
    /**
     * Sub sessions
     */
    subsessions: Subsession[];
    /**
     * Typespecs (ex: [])
     */
    typespecs: [];
    /**
     * Resolutions (ex: [])
     */
    resolutions: [];
    /**
     * Aliases (ex: [])
     */
    aliases: [];
    /**
     * Alternatives (ex: [])
     */
    alternatives: [];
};
import studyConstructor = require("./study");
