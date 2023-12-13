export = Client;
declare class Client {
    /**
     * @typedef {Object} ClientOptions
     * @prop {string} [token] User auth token (in 'sessionid' cookie)
     * @prop {string} [signature] User auth token signature (in 'sessionid_sign' cookie)
     * @prop {boolean} [DEBUG] Enable debug mode
     * @prop {'data' | 'prodata' | 'widgetdata'} [server] Server type
     */
    /** Client object
     * @param {ClientOptions} clientOptions TradingView client options
     */
    constructor(clientOptions?: {
        /**
         * User auth token (in 'sessionid' cookie)
         */
        token?: string;
        /**
         * User auth token signature (in 'sessionid_sign' cookie)
         */
        signature?: string;
        /**
         * Enable debug mode
         */
        DEBUG?: boolean;
        /**
         * Server type
         */
        server?: 'data' | 'prodata' | 'widgetdata';
    });
    /** If the client is logged in */
    get isLogged(): boolean;
    /** If the cient was closed */
    get isOpen(): boolean;
    /**
     * When client is connected
     * @param {() => void} cb Callback
     * @event onConnected
     */
    onConnected(cb: () => void): void;
    /**
     * When client is disconnected
     * @param {() => void} cb Callback
     * @event onDisconnected
     */
    onDisconnected(cb: () => void): void;
    /**
     * @typedef {Object} SocketSession
     * @prop {string} session_id Socket session ID
     * @prop {number} timestamp Session start timestamp
     * @prop {number} timestampMs Session start milliseconds timestamp
     * @prop {string} release Release
     * @prop {string} studies_metadata_hash Studies metadata hash
     * @prop {'json' | string} protocol Used protocol
     * @prop {string} javastudies Javastudies
     * @prop {number} auth_scheme_vsn Auth scheme type
     * @prop {string} via Socket IP
     */
    /**
     * When client is logged
     * @param {(SocketSession: SocketSession) => void} cb Callback
     * @event onLogged
     */
    onLogged(cb: (SocketSession: {
        /**
         * Socket session ID
         */
        session_id: string;
        /**
         * Session start timestamp
         */
        timestamp: number;
        /**
         * Session start milliseconds timestamp
         */
        timestampMs: number;
        /**
         * Release
         */
        release: string;
        /**
         * Studies metadata hash
         */
        studies_metadata_hash: string;
        /**
         * Used protocol
         */
        protocol: 'json' | string;
        /**
         * Javastudies
         */
        javastudies: string;
        /**
         * Auth scheme type
         */
        auth_scheme_vsn: number;
        /**
         * Socket IP
         */
        via: string;
    }) => void): void;
    /**
     * When server is pinging the client
     * @param {(i: number) => void} cb Callback
     * @event onPing
     */
    onPing(cb: (i: number) => void): void;
    /**
     * When unparsed data is received
     * @param {(...{}) => void} cb Callback
     * @event onData
     */
    onData(cb: (...{}) => void): void;
    /**
     * When a client error happens
     * @param {(...{}) => void} cb Callback
     * @event onError
     */
    onError(cb: (...{}) => void): void;
    /**
     * When a client event happens
     * @param {(...{}) => void} cb Callback
     * @event onEvent
     */
    onEvent(cb: (...{}) => void): void;
    send(t: string, p: string[]): void;
    /** Send all waiting packets */
    sendQueue(): void;
    /** @namespace Session */
    Session: {
        Quote: {
            new (options?: {
                /**
                 * Asked quote fields
                 */
                fields?: "all" | "price";
                /**
                 * List of asked quote fields
                 */
                customFields?: quoteSessionGenerator.quoteField[];
            }): {
                "__#3@#sessionID": string;
                "__#3@#client": ClientBridge;
                "__#3@#symbolListeners": {
                    [x: string]: Function[];
                };
                "__#3@#quoteSession": quoteSessionGenerator.QuoteSessionBridge;
                Market: {
                    new (symbol: string, session?: string): {
                        "__#2@#symbolListeners": {
                            [x: string]: Function[];
                        };
                        "__#2@#symbol": string;
                        "__#2@#session": string;
                        "__#2@#symbolKey": string;
                        "__#2@#symbolListenerID": number;
                        "__#2@#lastData": {};
                        "__#2@#callbacks": {
                            loaded: any[];
                            data: any[];
                            event: any[];
                            error: any[];
                        };
                        "__#2@#handleEvent"(ev: import("./quote/market").MarketEvent, ...data: {}[]): void;
                        "__#2@#handleError"(...msgs: any[]): void;
                        onLoaded(cb: () => void): void;
                        onData(cb: (data: {}) => void): void;
                        onEvent(cb: (...any: any[]) => void): void;
                        onError(cb: (...any: any[]) => void): void; /**
                         * When server is pinging the client
                         * @param {(i: number) => void} cb Callback
                         * @event onPing
                         */
                        close(): void;
                    };
                };
                delete(): void;
            };
        };
        Chart: {
            new (): {
                "__#6@#chartSessionID": string;
                "__#6@#replaySessionID": string;
                "__#6@#replayMode": boolean;
                "__#6@#replayOKCB": {
                    [x: string]: () => any;
                };
                "__#6@#client": ClientBridge;
                "__#6@#studyListeners": {
                    [x: string]: Function[];
                };
                "__#6@#periods": {
                    [x: number]: chartSessionGenerator.PricePeriod[];
                };
                readonly periods: chartSessionGenerator.PricePeriod[];
                "__#6@#infos": chartSessionGenerator.MarketInfos;
                readonly infos: chartSessionGenerator.MarketInfos;
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
                "__#6@#handleEvent"(ev: chartSessionGenerator.ChartEvent, ...data: {}[]): void;
                "__#6@#handleError"(...msgs: any[]): void;
                "__#6@#seriesCreated": boolean;
                "__#6@#currentSeries": number;
                setSeries(timeframe?: import("./types").TimeFrame, range?: number, reference?: number): void;
                setMarket(symbol: string, options?: {
                    timeframe?: import("./types").TimeFrame;
                    range?: number;
                    to?: number;
                    adjustment?: "splits" | "dividends";
                    session?: "regular" | "extended";
                    currency?: string;
                    type?: chartSessionGenerator.ChartType;
                    inputs?: chartSessionGenerator.ChartInputs;
                    replay?: number;
                }): void;
                setTimezone(timezone: import("./types").Timezone): void;
                fetchMore(number?: number): void;
                replayStep(number?: number): Promise<any>;
                replayStart(interval?: number): Promise<any>;
                replayStop(): Promise<any>;
                onSymbolLoaded(cb: () => void): void;
                onUpdate(cb: (changes: string[]) => void): void;
                onReplayLoaded(cb: () => void): void;
                onReplayResolution(cb: (timeframe: import("./types").TimeFrame, index: number) => void): void;
                onReplayEnd(cb: () => void): void;
                onReplayPoint(cb: (index: number) => void): void;
                onError(cb: (...any: any[]) => void): void;
                "__#6@#chartSession": chartSessionGenerator.ChartSessionBridge;
                Study: {
                    new (indicator: import("./classes/PineIndicator") | import("./classes/BuiltInIndicator")): {
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
                        readonly graphic: import("./chart/graphicParser").GraphicData;
                        "__#5@#strategyReport": import("./chart/study").StrategyReport;
                        readonly strategyReport: import("./chart/study").StrategyReport;
                        "__#5@#callbacks": {
                            studyCompleted: any[];
                            update: any[];
                            event: any[];
                            error: any[];
                        };
                        "__#5@#handleEvent"(ev: ChartEvent, ...data: {}[]): void;
                        "__#5@#handleError"(...msgs: any[]): void;
                        instance: import("./classes/PineIndicator") | import("./classes/BuiltInIndicator");
                        setIndicator(indicator: import("./classes/PineIndicator") | import("./classes/BuiltInIndicator")): void;
                        onReady(cb: () => void): void;
                        onUpdate(cb: (changes: ("plots" | "report.currency" | "report.settings" | "report.perf" | "report.trades" | "report.history" | "graphic")[]) => void): void;
                        onError(cb: (...any: any[]) => void): void;
                        remove(): void;
                    };
                };
                delete(): void;
            };
        };
    };
    /**
     * Close the websocket connection
     * @return {Promise<void>} When websocket is closed
     */
    end(): Promise<void>;
    #private;
}
declare namespace Client {
    export { Session, SessionList, SendPacket, ClientBridge, ClientEvent };
}
import quoteSessionGenerator = require("./quote/session");
type ClientBridge = {
    sessions: SessionList;
    send: SendPacket;
};
import chartSessionGenerator = require("./chart/session");
type Session = {
    /**
     * Session type
     */
    type: 'quote' | 'chart' | 'replay';
    /**
     * When there is a data
     */
    onData: (data: {}) => null;
};
/**
 * Session list
 */
type SessionList = {
    [x: string]: Session;
};
/**
 * Send a custom packet
 */
type SendPacket = (t: string, p: string[]) => void;
type ClientEvent = 'connected' | 'disconnected' | 'logged' | 'ping' | 'data' | 'error' | 'event';
