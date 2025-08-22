declare module '@mathieuc/tradingview' {
    import { EventEmitter } from 'events';

    //src/client
    export interface Session {
        /**
         * Session type
         */
        type: 'quote' | 'chart' | 'replay';
        /**
         * When there is a data
         */
        onData: (data: any) => void;
    }

    /**
     * Session list
     */
    export interface SessionList {
        [key: string]: Session;
    }

    /**
     * Send a custom packet
     */
    export type SendPacket = (t: string, p: string[]) => void;

    export interface ClientBridge {
        sessions: Record<string, Session>;
        send: SendPacket;
    }

    export type ClientEvent =
        | 'connected'
        | 'disconnected'
        | 'logged'
        | 'ping'
        | 'data'
        | 'error'
        | 'event';

    /**
     * TradingView client options
     */
    export interface ClientOptions {
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
        DEBUG?: boolean | 'session' | 'client' | 'study' | 'market' | 'quote';
        /**
         * Server type
         */
        server?: 'data' | 'prodata' | 'widgetdata' | 'history-data';
        location?: string;
    }

    export type SocketSession = unknown;

    /**
     * Client object
     */
    export class Client extends EventEmitter {
        Session: {
            Quote: typeof QuoteSession,
            Chart: typeof ChartSession,
            History: typeof HistorySession,
        };
        #ws: WebSocket;
        #logged: boolean;
        #sessions: SessionList;
        #sendQueue: string[];
        #clientBridge: ClientBridge;
        #callbacks: Record<ClientEvent, Array<(...args: any[]) => void>>;

        /**
         * @param {ClientOptions} clientOptions TradingView client options
         */
        constructor(clientOptions?: ClientOptions);

        /** If the client is logged in */
        get isLogged(): boolean;

        /** If the cient was closed */
        get isOpen(): boolean;

        send(type: string, payload?: string[]): void;

        /** Send all waiting packets */
        sendQueue(): void;

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
         * When client is logged
         * @param {(session: SocketSession) => void} cb Callback
         * @event onLogged
         */
        onLogged(cb: (session: SocketSession) => void): void;

        /**
         * When server is pinging the client
         * @param {(i: number) => void} cb Callback
         * @event onPing
         */
        onPing(cb: (i: number) => void): void;

        /**
         * When unparsed data is received
         * @param {(...args: any[]) => void} cb Callback
         * @event onData
         */
        onData(cb: (...args: any[]) => void): void;

        /**
         * When a client error happens
         * @param {(...args: any[]) => void} cb Callback
         * @event onError
         */
        onError(cb: (...args: any[]) => void): void;

        /**
         * When a client event happens
         * @param {(...args: any[]) => void} cb Callback
         * @event onEvent
         */
        onEvent(cb: (...args: any[]) => void): void;

        /**
         * Close the websocket connection
         * @return {Promise<void>} When websocket is closed
         */
        end(): Promise<void>;

        #handleEvent(ev: ClientEvent, ...data: any[]): void;

        #handleError(...msgs: any[]): void;

        #parsePacket(str: string): void;
    }

    // src/miscRequests
    export interface Period {
        Other: number;
        All: number;
        MA: number;
    }

    export interface Periods {
        '1': Period;
        '5': Period;
        '15': Period;
        '60': Period;
        '240': Period;
        '1D': Period;
        '1W': Period;
        '1M': Period;
    }

    /**
     * User credentials
     */
    export interface UserCredentials {
        /** User ID */
        id: number;
        /** User session ('sessionid' cookie) */
        session: string;
        /** User session signature ('sessionid_sign' cookie) */
        signature: string;
    }

    /**
     * Get technical analysis
     * @function getTA
     * @param {string} id Full market id (Example: COINBASE:BTCEUR)
     * @returns {Promise<Periods>} results
     */
    export function getTA(id: string): Promise<Periods | false>;

    export interface SearchMarketResult {
        /** Market full symbol */
        id: string;
        /** Market exchange name */
        exchange: string;
        /** Market exchange full name */
        fullExchange: string;
        /** Market symbol */
        symbol: string;
        /** Market description */
        description: string;
        /** Market type */
        type: string;
        currency: string;
        chartCurrencyId: string;
        /** Get market technical analysis */
        getTA: () => Promise<Periods>;
    }

    /**
     * Find a symbol (deprecated)
     * @function searchMarket
     * @param {string} search Keywords
     * @param {'stock'
     *  | 'futures' | 'forex' | 'cfd'
     *  | 'crypto' | 'index' | 'economic'
     * } [filter] Category filter
     * @returns {Promise<SearchMarketResult[]>} Search results
     * @deprecated Use searchMarketV3 instead
     */
    export function searchMarket(
        search: string,
        filter?: 'stock' | 'futures' | 'forex' | 'cfd' | 'crypto' | 'index' | 'economic',
    ): Promise<SearchMarketResult[]>;

    /**
     * Find a symbol
     * @function searchMarketV3
     * @param {string} search Keywords
     * @param {'stock'
     *  | 'futures' | 'forex' | 'cfd'
     *  | 'crypto' | 'index' | 'economic'
     * } [filter] Category filter
     * @returns {Promise<SearchMarketResult[]>} Search results
     */
    export function searchMarketV3(
        search: string,
        filter?: 'stock' | 'futures' | 'forex' | 'cfd' | 'crypto' | 'index' | 'economic',
    ): Promise<SearchMarketResult[]>;

    export interface SearchIndicatorResult {
        /** Script ID */
        id: string;
        /** Script version */
        version: string;
        /** Script name */
        name: string;
        /** Script author */
        author: { id: number; username: string };
        /** Script image ID */
        image: string;
        /** Script source */
        source: string | '';
        /** Script type */
        type: 'study' | 'strategy';
        /** Script access type */
        access: 'open_source' | 'closed_source' | 'invite_only' | 'private' | 'other';
        /** Get indicator */
        get: () => Promise<PineIndicator>;
    }

    /**
     * Find an indicator
     * @param {string} search Keywords
     * @returns {Promise<SearchIndicatorResult[]>} Search results
     */
    export function searchIndicator(search?: string): Promise<SearchIndicatorResult[]>;

    /**
     * Get an indicator
     * @param {string} id Indicator ID
     * @param {string} version Indicator version
     * @param {string} session User session
     * @param {string} signature User signature
     * @returns {Promise<PineIndicator>} Indicator
     */
    export function getIndicator(
        id: string,
        version?: string,
        session?: string,
        signature?: string,
    ): Promise<PineIndicator>;

    export function getRawIndicator(
        id: string,
        version?: string,
        session?: string,
        signature?: string,
    ): Promise<RawPineIndicator>;

    export function getPersonalIndicator(
        id: string,
        session: string,
        signature?: string,
    ): Promise<PineIndicator>;

    export interface TwoFactorInfoMessage {
        detail: string;
        code: string;
        two_factor_types: [
            {
                name: string,
                code_ttl: number
            }
        ]
    }

    /**
     * User
     */
    export interface User {
        /** User ID */
        id: number;
        /** Username */
        username: string;
        /** First name */
        first_name?: string;
        /** Last name */
        last_name?: string;
        /** Reputation */
        reputation: number;
        /** Following count */
        following: number;
        /** Followers count */
        followers: number;
        /** Notifications count */
        notification_count: {
            user: number;
            following: number;
        };
        /** Session hash */
        session_hash: string;
        /** Private channel */
        private_channel: string;
        /** Auth token */
        auth_token: string;
        /** Join date */
        date_joined: string;
        has_active_email: boolean;
        userpic?: string;
        userpic_mid?: string;
        userpic_big?: string;
        status?: string;
        must_change_password: boolean;
        must_change_tfa: boolean;
        notification_popup: boolean;
        notification_sound: boolean;
        max_user_language_reputation: number;
        profile_data_filled: boolean;
        is_corporation_user: boolean;
        active_broker?: any;
        ignore_list: any[];
        is_active_partner: boolean;
        is_broker: boolean;
        broker_plan?: any;
        badges?: any[];
        permissions: Record<string, any>;
        is_symphony: boolean;
        is_staff: boolean;
        is_superuser: boolean;
        is_moderator: boolean;
        last_locale: string;
        social_registration: boolean;
        has_phone: boolean;
        sms_email?: string | null;
        is_non_pro_confirmed: boolean;
        do_not_track: boolean;
        is_pro: boolean;
        is_expert: boolean;
        is_trial: boolean;
        is_lite_plan: boolean;
        pro_being_cancelled?: boolean | null;
        pro_plan_days_left: number;
        pro_plan_original_name?: string;
        pro_plan: string;
        pro_plan_billing_cycle: string;
        trial_days_left?: number | null;
        trial_days_left_text?: string;
        available_offers: Record<string, any>;
        had_pro: boolean;
        declared_status: string;
        declared_status_timestamp?: string | null;
        market_profile_updated_timestamp?: string | null;
        force_to_complete_data: boolean;
        force_to_upgrade: boolean;
        is_support_available: boolean;
        disallow_adding_to_private_chats: boolean;
        picture_url?: string;
    }


    export interface LoginResponse {
        session: string;
        signature: string;
        user?: User;
        two_factor_info?: TwoFactorInfoMessage;
    }

    /**
     * Login user
     * @param {string} username Username
     * @param {string} password Password
     * @param {boolean} remember Remember session
     * @param {string} UA User agent
     * @returns {Promise<LoginResponse>} Login response
     */
    export function loginUser(
        username: string,
        password: string,
        remember?: boolean,
        UA?: string,
    ): Promise<LoginResponse>;

    export function twoFactorAuth(
        smsCode: string,
        session: string,
        signature: string,
        twoFaType?: 'sms' | 'totp',
        UA?: string,
    ): Promise<LoginResponse>;

    /**
     * Get user
     * @param {string} session User session
     * @param {string} signature User signature
     * @param {string} location Location
     * @returns {Promise<User>} User
     */
    export function getUser(session: string, signature?: string, location?: string): Promise<User>;

    /**
     * Get private indicators
     * @param {string} session User session
     * @param {string} signature User signature
     * @returns {Promise<SearchIndicatorResult[]>} Search results
     */
    export function getPrivateIndicators(
        session: string,
        signature?: string,
    ): Promise<SearchIndicatorResult[]>;

    export interface ScriptAuthor {
        id: number;
        username: string;
        is_broker: boolean;
    }

    export interface ScriptExtra {
        kind: string;
        sourceInputsCount: number;
    }

    export interface InviteOnlyScript {
        imageUrl: string;
        scriptName: string;
        scriptSource: string;
        access: number;
        scriptIdPart: string;
        version: string;
        extra: ScriptExtra;
        agreeCount: number;
        userHaveAccess: boolean;
        isRecommended: boolean;
        author: ScriptAuthor;
    }

    export function getInviteOnlyScripts(session: string, signature?: string): Promise<InviteOnlyScript[]>;

    /**
     * Get chart token
     * @param {string} layout Layout ID
     * @param {UserCredentials} credentials User credentials
     * @returns {Promise<string>} Chart token
     */
    export function getChartToken(layout: string, credentials?: UserCredentials): Promise<string>;

    /**
     * Drawing point
     */
    export interface DrawingPoint {
        /** Point time */
        time_t: number;
        /** Point price */
        price: number;
        /** Point offset */
        offset: number;
    }

    /**
     * Drawing
     */
    export interface Drawing {
        /** Drawing ID */
        id: string;
        /** Symbol */
        symbol: string;
        /** Owner source */
        ownerSource: string;
        /** Server update time */
        serverUpdateTime: string;
        /** Currency ID */
        currencyId: string;
        /** Unit ID */
        unitId: any;
        /** Type */
        type: string;
        /** Points */
        points: DrawingPoint[];
        /** Z-order */
        zorder: number;
        /** Link key */
        linkKey: string;
        /** State */
        state: Record<string, any>;
    }

    /**
     * Get drawings
     * @param {string} layout Layout ID
     * @param {string} symbol Symbol
     * @param {UserCredentials} credentials User credentials
     * @param {string} chartID Chart ID
     * @returns {Promise<Drawing[]>} Drawings
     */
    export function getDrawings(
        layout: string,
        symbol?: string,
        credentials?: UserCredentials,
        chartID?: string,
    ): Promise<Drawing[]>;

    // src/protocol
    /**
     * TradingView packet
     */
    export interface TWPacket {
        /** Packet type */
        m?: string;
        /** Packet data */
        p?: [string, any];
    }

    /**
     * Parse websocket packet
     * @param {string} str Websocket raw data
     * @returns {TWPacket[]} TradingView packets
     */
    export function parseWSPacket(str: string): TWPacket[];

    /**
     * Format websocket packet
     * @param {TWPacket} packet TradingView packet
     * @returns {string} Websocket raw data
     */
    export function formatWSPacket(packet: TWPacket): string;

    /**
     * Parse compressed data
     * @param {string} data Compressed data
     * @returns {Promise<unknown>} Parsed data
     */
    export function parseCompressed(data: string): Promise<unknown>;

    // src/types
    /**
     * Timezone
     */
    export type Timezone =
        | 'Etc/UTC'
        | 'exchange'
        | 'Pacific/Honolulu'
        | 'America/Juneau'
        | 'America/Los_Angeles'
        | 'America/Phoenix'
        | 'America/Vancouver'
        | 'US/Mountain'
        | 'America/El_Salvador'
        | 'America/Bogota'
        | 'America/Chicago'
        | 'America/Lima'
        | 'America/Mexico_City'
        | 'America/Caracas'
        | 'America/New_York'
        | 'America/Toronto'
        | 'America/Argentina/Buenos_Aires'
        | 'America/Santiago'
        | 'America/Sao_Paulo'
        | 'Atlantic/Reykjavik'
        | 'Europe/Dublin'
        | 'Africa/Lagos'
        | 'Europe/Lisbon'
        | 'Europe/London'
        | 'Europe/Amsterdam'
        | 'Europe/Belgrade'
        | 'Europe/Berlin'
        | 'Europe/Brussels'
        | 'Europe/Copenhagen'
        | 'Africa/Johannesburg'
        | 'Africa/Cairo'
        | 'Europe/Luxembourg'
        | 'Europe/Madrid'
        | 'Europe/Malta'
        | 'Europe/Oslo'
        | 'Europe/Paris'
        | 'Europe/Rome'
        | 'Europe/Stockholm'
        | 'Europe/Warsaw'
        | 'Europe/Zurich'
        | 'Europe/Athens'
        | 'Asia/Bahrain'
        | 'Europe/Helsinki'
        | 'Europe/Istanbul'
        | 'Asia/Jerusalem'
        | 'Asia/Kuwait'
        | 'Europe/Moscow'
        | 'Asia/Qatar'
        | 'Europe/Riga'
        | 'Asia/Riyadh'
        | 'Europe/Tallinn'
        | 'Europe/Vilnius'
        | 'Asia/Tehran'
        | 'Asia/Dubai'
        | 'Asia/Muscat'
        | 'Asia/Ashkhabad'
        | 'Asia/Kolkata'
        | 'Asia/Almaty'
        | 'Asia/Bangkok'
        | 'Asia/Jakarta'
        | 'Asia/Ho_Chi_Minh'
        | 'Asia/Chongqing'
        | 'Asia/Hong_Kong'
        | 'Australia/Perth'
        | 'Asia/Shanghai'
        | 'Asia/Singapore'
        | 'Asia/Taipei'
        | 'Asia/Seoul'
        | 'Asia/Tokyo'
        | 'Australia/Brisbane'
        | 'Australia/Adelaide'
        | 'Australia/Sydney'
        | 'Pacific/Norfolk'
        | 'Pacific/Auckland'
        | 'Pacific/Fakaofo'
        | 'Pacific/Chatham';

    /**
     * Timeframe
     */
    export type TimeFrame =
        | '1'
        | '3'
        | '5'
        | '15'
        | '30'
        | '45'
        | '60'
        | '120'
        | '180'
        | '240'
        | '1D'
        | '1W'
        | '1M'
        | 'D'
        | 'W'
        | 'M';

    // src/utils
    /**
     * Generate session ID
     * @param {string} type Session type
     * @returns {string} Session ID
     */
    export function genSessionID(type: string): string;

    /**
     * Generate auth cookies
     * @param {string} sessionId Session ID
     * @param {string} signature Signature
     * @returns {string} Auth cookies
     */
    export function genAuthCookies(sessionId: string, signature: string): string;

    // src/chart/graphicParser
    export type ExtendValue = 'right' | 'left' | 'both' | 'none';
    export type YLocValue = 'price' | 'abovebar' | 'belowbar';
    export type LabelStyleValue =
        | 'none'
        | 'xcross'
        | 'cross'
        | 'triangleup'
        | 'triangledown'
        | 'flag'
        | 'circle'
        | 'arrowup'
        | 'arrowdown'
        | 'label_up'
        | 'label_down'
        | 'label_left'
        | 'label_right'
        | 'label_lower_left'
        | 'label_lower_right'
        | 'label_upper_left'
        | 'label_upper_right'
        | 'label_center'
        | 'square'
        | 'diamond';
    export type LineStyleValue =
        | 'solid'
        | 'dotted'
        | 'dashed'
        | 'arrow_left'
        | 'arrow_right'
        | 'arrow_both';
    export type BoxStyleValue = 'solid' | 'dotted' | 'dashed';
    export type SizeValue = 'auto' | 'huge' | 'large' | 'normal' | 'small' | 'tiny';
    export type VAlignValue = 'top' | 'center' | 'bottom';
    export type HAlignValue = 'left' | 'center' | 'right';
    export type TextWrapValue = 'none' | 'auto';
    export type TablePositionValue =
        | 'top_left'
        | 'top_center'
        | 'top_right'
        | 'middle_left'
        | 'middle_center'
        | 'middle_right'
        | 'bottom_left'
        | 'bottom_center'
        | 'bottom_right';

    export interface GraphicLabel {
        /** Drawing ID */
        id: number;
        /** X position */
        x: number;
        /** Y position */
        y: number;
        /** Y location */
        yLoc: YLocValue;
        /** Text */
        text: string;
        /** Style */
        style: LabelStyleValue;
        /** Color */
        color: number;
        /** Text color */
        textColor: number;
        /** Size */
        size: SizeValue;
        /** Text align */
        textAlign: HAlignValue;
        /** Tooltip */
        toolTip: string;
    }

    export interface GraphicLine {
        /** Drawing ID */
        id: number;
        /** X1 position */
        x1: number;
        /** Y1 position */
        y1: number;
        /** X2 position */
        x2: number;
        /** Y2 position */
        y2: number;
        /** Extend */
        extend: ExtendValue;
        /** Style */
        style: LineStyleValue;
        /** Color */
        color: number;
        /** Width */
        width: number;
    }

    export interface GraphicBox {
        /** Drawing ID */
        id: number;
        /** X1 position */
        x1: number;
        /** Y1 position */
        y1: number;
        /** X2 position */
        x2: number;
        /** Y2 position */
        y2: number;
        /** Color */
        color: number;
        /** Background color */
        bgColor: number;
        /** Extend */
        extend: ExtendValue;
        /** Style */
        style: BoxStyleValue;
        /** Width */
        width: number;
        /** Text */
        text: string;
        /** Text size */
        textSize: SizeValue;
        /** Text color */
        textColor: number;
        /** Text vertical align */
        textVAlign: VAlignValue;
        /** Text horizontal align */
        textHAlign: HAlignValue;
        /** Text wrap */
        textWrap: TextWrapValue;
    }

    export interface TableCell {
        /** Drawing ID */
        id: number;
        /** Text */
        text: string;
        /** Width */
        width: number;
        /** Height */
        height: number;
        /** Text color */
        textColor: number;
        /** Text horizontal align */
        textHAlign: HAlignValue;
        /** Text vertical align */
        textVAlign: VAlignValue;
        /** Text size */
        textSize: SizeValue;
        /** Background color */
        bgColor: number;
    }

    export interface GraphicTable {
        /** Drawing ID */
        id: number;
        /** Position */
        position: TablePositionValue;
        /** Rows */
        rows: number;
        /** Columns */
        columns: number;
        /** Background color */
        bgColor: number;
        /** Frame color */
        frameColor: number;
        /** Frame width */
        frameWidth: number;
        /** Border color */
        borderColor: number;
        /** Border width */
        borderWidth: number;

        cells(): TableCell[][];
    }

    export interface GraphicHorizline {
        /** Drawing ID */
        id: number;
        /** Level */
        level: number;
        /** Start index */
        startIndex: number;
        /** End index */
        endIndex: number;
        /** Extend right */
        extendRight: boolean;
        /** Extend left */
        extendLeft: boolean;
    }

    export interface GraphicPoint {
        /** Index */
        index: number;
        /** Level */
        level: number;
    }

    export interface GraphicPolygon {
        /** Drawing ID */
        id: number;
        /** Points */
        points: GraphicPoint[];
    }

    export interface GraphicHorizHist {
        /** Drawing ID */
        id: number;
        /** Price low */
        priceLow: number;
        /** Price high */
        priceHigh: number;
        /** First bar time */
        firstBarTime: number;
        /** Last bar time */
        lastBarTime: number;
        /** Rate */
        rate: number[];
    }

    export interface GraphicData {
        labels: GraphicLabel[];
        lines: GraphicLine[];
        boxes: GraphicBox[];
        tables: GraphicTable[];
        polygons: GraphicPolygon[];
        horizHists: GraphicHorizHist[];
        horizLines: GraphicHorizline[];
    }

    export function graphicParse(rawGraphic?: Record<string, any>, indexes?: number[]): GraphicData;

    // src/classes/BuiltInIndicator
    /**
     * Built-in indicator type
     */
    export type BuiltInIndicatorType =
        | 'Volume@tv-basicstudies-241'
        | 'VbPFixed@tv-basicstudies-241'
        | 'VbPFixed@tv-basicstudies-241!'
        | 'VbPFixed@tv-volumebyprice-53!'
        | 'VbPSessions@tv-volumebyprice-53'
        | 'VbPSessionsRough@tv-volumebyprice-53!'
        | 'VbPSessionsDetailed@tv-volumebyprice-53!'
        | 'VbPVisible@tv-volumebyprice-53';

    /**
     * Built-in indicator option
     */
    export type BuiltInIndicatorOption =
        | 'rowsLayout'
        | 'rows'
        | 'volume'
        | 'vaVolume'
        | 'subscribeRealtime'
        | 'first_bar_time'
        | 'first_visible_bar_time'
        | 'last_bar_time'
        | 'last_visible_bar_time'
        | 'extendPocRight';

    export interface IndicatorOptions {
        [key: string]: any;
    }

    export class BuiltInIndicator {
        #type: BuiltInIndicatorType;
        #options: IndicatorOptions;

        /**
         * @param {BuiltInIndicatorType} type Built-in indicator type
         */
        constructor(type: BuiltInIndicatorType);

        /**
         * Get indicator type
         * @returns {BuiltInIndicatorType} Indicator type
         */
        getType(): BuiltInIndicatorType;

        /**
         * Get indicator options
         * @returns {IndicatorOptions} Indicator options
         */
        getOptions(): IndicatorOptions;

        /**
         * Set indicator option
         * @param {BuiltInIndicatorOption} key Option key
         * @param {any} value Option value
         * @param {boolean} FORCE Force
         */
        setOption(key: BuiltInIndicatorOption, value: any, FORCE?: boolean): void;

        clone(): PineIndicator;
    }

    // src/classes/PineIndicator
    /**
     * Indicator input
     */
    export type IndicatorInput = {
        /** Name */
        name: string;
        /** Inline name */
        inline: string;
        /** Internal ID */
        internalID?: string;
        /** Tooltip */
        tooltip?: string;
        /** Type */
        type: 'text' | 'source' | 'integer' | 'float' | 'resolution' | 'bool' | 'color';
        /** Value */
        value: string | number | boolean;
        /** Is hidden */
        isHidden: boolean;
        /** Is fake */
        isFake: boolean;
        /** Options */
        options?: string[];
    };

    /**
     * Indicator
     */
    export type Indicator = {
        /** Pine ID */
        pineId: string;
        /** Pine version */
        pineVersion: string;
        /** Description */
        description: string;
        /** Short description */
        shortDescription: string;
        /** Inputs */
        inputs: Record<string, IndicatorInput>;
        /** Plots */
        plots: Record<string, string>;
        /** Script */
        script: string;
    };

    /**
     * Indicator type
     */
    export type IndicatorType = 'Script@tv-scripting-101!' | 'StrategyScript@tv-scripting-101!';

    export class PineIndicator {
        #options: Indicator;
        #type: IndicatorType;

        /**
         * @param {Indicator} options Indicator options
         */
        constructor(options: Indicator);

        /** Pine ID */
        get pineId(): string;

        /** Pine version */
        get pineVersion(): string;

        /** Description */
        get description(): string;

        /** Short description */
        get shortDescription(): string;

        /** Inputs */
        get inputs(): Record<string, IndicatorInput>;

        /** Plots */
        get plots(): Record<string, string>;

        /** Script */
        get script(): string;

        /** Type */
        get type(): IndicatorType;

        /**
         * Set indicator type
         * @param {IndicatorType} type Indicator type
         */
        setType(type?: IndicatorType): void;

        /**
         * Set indicator option
         * @param {number | string} key Option key
         * @param {any} value Option value
         */
        setOption(key: number | string, value: any): void;

        clone(): PineIndicator;
    }

    export type RawPineIndicator = {
        IL: string;
        ilTemplate: string;
        metaInfo: {
            _metainfoVersion: number;
            behind_chart: boolean;
            defaults: {
                inputs: RawPineIndicatorInputValues;
                strategy?: {
                    orders?: {
                        showLabels?: boolean;
                        showQty?: boolean;
                        visible?: boolean;
                    };
                };
                styles?: Record<string, any>;
                filledAreasStyle?: Record<string, {
                    color: string;
                    transparency: number;
                    visible: boolean;
                }>;
                graphics?: {
                    dwglabels?: { labels?: { visible?: boolean } };
                    dwglines?: { lines?: { visible?: boolean } };
                    dwgtablecells?: { tableCells?: { visible?: boolean } };
                    dwgtables?: { tables?: { visible?: boolean } };
                };
            };
            description?: string;
            docs?: string;
            format?: { type?: string };
            id: string;
            inputs: Array<RawPineIndicatorInput>;
            styles?: Record<string, any>;
            filledAreas?: Array<{
                fillgaps: boolean;
                id: string;
                isHidden: boolean;
                objAId: string;
                objBId: string;
                title: string;
                type: string;
            }>;
            hasAlertFunction?: boolean;
            historyCalculationMayChange?: boolean;
        };

        readonly inputValues: RawPineIndicatorInputValues;
        readonly inputs: RawPineIndicatorInput[];

        setInputValue(inputKey: string, value: any): void;
    };

    export type RawPineIndicatorInputValues = Record<string, any>

    export type RawPineIndicatorInput = {
        defval: any;
        id: string;
        name?: string;
        type: string;
        display?: number;
        isHidden?: boolean;
        options?: string[];
        max?: number;
        min?: number;
        tooltip?: string;
        groupId?: string;
        internalID?: string;
        isFake?: boolean;
    }

    // src/classes/PinePermManager
    /**
     * Authorization user
     */
    export type AuthorizationUser = {
        /** User ID */
        id: string;
        /** Username */
        username: string;
        /** User picture */
        userpic: string;
        /** Expiration */
        expiration: string;
        /** Created */
        created: string;
    };

    export type FetchOrder =
        | 'user__username'
        | '-user__username'
        | 'created'
        | '-created'
        | 'expiration,user__username'
        | '-expiration,user__username';

    export class PinePermManager {
        #sessionId: string;
        #signature: string;
        #pineId: string;

        /**
         * @param {string} sessionId Session ID
         * @param {string} signature Signature
         * @param {string} pineId Pine ID
         */
        constructor(sessionId: string, signature: string, pineId: string);

        /**
         * Get users
         * @param {number} limit Limit
         * @param {FetchOrder} order Order
         * @returns {Promise<AuthorizationUser[]>} Users
         */
        getUsers(limit?: number, order?: FetchOrder): Promise<AuthorizationUser[]>;

        /**
         * Add user
         * @param {string} username Username
         * @param {Date | null} expiration Expiration
         * @returns {Promise<'ok' | 'exists' | null>} Result
         */
        addUser(username: string, expiration?: Date | null): Promise<'ok' | 'exists' | null>;

        /**
         * Modify expiration
         * @param {string} username Username
         * @param {Date | null} expiration Expiration
         * @returns {Promise<'ok' | null>} Result
         */
        modifyExpiration(username: string, expiration?: Date | null): Promise<'ok' | null>;

        /**
         * Remove user
         * @param {string} username Username
         * @returns {Promise<'ok' | null>} Result
         */
        removeUser(username: string): Promise<'ok' | null>;
    }

    // src/quote/market
    export type MarketEvent = 'loaded' | 'data' | 'error';

    export type SymbolInfo = {
        fractional: false;
        original_name: string;
        lp_time: number;
        pricescale: number;
        current_session: string;
        first_bar_time_1s: number;
        rtc: null;
        currency_code: string;
        ch: number;
        pro_name: string;
        low_price: number;
        "currency-logoid": string;
        "base-currency-logoid": string;
        lp: number;
        rchp: null;
        first_bar_time_1m: number;
        update_mode: string;
        is_tradable: boolean;
        provider_id: string;
        open_price: number;
        prev_close_price: number;
        minmove2: number;
        chp: number;
        timezone: string;
        rch: null;
        rtc_time: null;
        volume: number;
        minmov: number;
        high_price: number;
        short_name: string;
        description: string;
        type: string;
        exchange: string;
    };


    export class QuoteMarket {
        #symbol: string;
        #session: string;
        #symbolInfo: SymbolInfo;
        #symbolKey: string;
        #symbolListenerID: number;
        #lastData: Record<string, any>;
        #callbacks: Record<MarketEvent | 'event', Array<(...args: any[]) => void>>;

        constructor(symbol: string, session?: string);

        get symbolInfo(): SymbolInfo;

        /**
         * On loaded
         * @param {() => void} cb Callback
         */
        onLoaded(cb: () => void): void;

        /**
         * On data
         * @param {(data: Record<string, any>) => void} cb Callback
         */
        onData(cb: (data: Record<string, any>) => void): void;

        /**
         * On event
         * @param {(...args: any[]) => void} cb Callback
         */
        onEvent(cb: (...args: any[]) => void): void;

        /**
         * On error
         * @param {(...args: any[]) => void} cb Callback
         */
        onError(cb: (...args: any[]) => void): void;

        close(): void;
    }

    export function createQuoteMarket(
        quoteSession: QuoteSessionBridge,
    ): InstanceType<typeof QuoteMarket>;

    // src/quote/session
    export type SymbolListeners = Record<string, Array<(...args: any[]) => void>>;

    export type QuoteSessionBridge = {
        sessionID: string;
        symbolListeners: SymbolListeners;
        send: (type: string, payload: any[]) => void;
    };

    /**
     * Quote field
     */
    export type QuoteField =
        | 'base-currency-logoid'
        | 'ch'
        | 'chp'
        | 'currency-logoid'
        | 'provider_id'
        | 'currency_code'
        | 'current_session'
        | 'description'
        | 'exchange'
        | 'format'
        | 'fractional'
        | 'is_tradable'
        | 'language'
        | 'local_description'
        | 'logoid'
        | 'lp'
        | 'lp_time'
        | 'minmov'
        | 'minmove2'
        | 'original_name'
        | 'pricescale'
        | 'pro_name'
        | 'short_name'
        | 'type'
        | 'update_mode'
        | 'volume'
        | 'ask'
        | 'bid'
        | 'fundamentals'
        | 'high_price'
        | 'low_price'
        | 'open_price'
        | 'prev_close_price'
        | 'rch'
        | 'rchp'
        | 'rtc'
        | 'rtc_time'
        | 'status'
        | 'industry'
        | 'basic_eps_net_income'
        | 'beta_1_year'
        | 'market_cap_basic'
        | 'earnings_per_share_basic_ttm'
        | 'price_earnings_ttm'
        | 'sector'
        | 'dividends_yield'
        | 'timezone'
        | 'country_code';

    /**
     * Quote session options
     */
    export interface QuoteSessionOptions {
        /** Fields */
        fields?: 'all' | 'price';
        /** Custom fields */
        customFields?: QuoteField[];
    }

    export class QuoteSession {
        Market: typeof QuoteMarket;
        #sessionID: string;
        #client: ClientBridge;
        #symbolListeners: SymbolListeners;
        #quoteSession: QuoteSessionBridge;

        constructor(options?: QuoteSessionOptions);

        delete(): void;
    }

    // src/chart/study
    /**
     * Trade report
     */
    export type TradeReport = {
        /** Entry */
        entry: {
            name: string;
            type: 'long' | 'short';
            value: number;
            time: number;
        };
        /** Exit */
        exit: {
            name: string;
            value: number;
            time: number;
        };
        /** Quantity */
        quantity: number;
        /** Profit */
        profit: {
            v: number;
            p: number;
        };
    };

    /**
     * Performance report
     */
    export type PerfReport = {
        /** Average bars in trade */
        avgBarsInTrade: number;
        /** Average bars in winning trade */
        avgBarsInWinTrade: number;
        /** Average bars in losing trade */
        avgBarsInLossTrade: number;
        /** Average trade */
        avgTrade: number;
        /** Average trade percent */
        avgTradePercent: number;
        /** Average losing trade */
        avgLosTrade: number;
        /** Average losing trade percent */
        avgLosTradePercent: number;
        /** Average winning trade */
        avgWinTrade: number;
        /** Average winning trade percent */
        avgWinTradePercent: number;
        /** Commission paid */
        commissionPaid: number;
        /** Gross loss */
        grossLoss: number;
        /** Gross loss percent */
        grossLossPercent: number;
        /** Gross profit */
        grossProfit: number;
        /** Gross profit percent */
        grossProfitPercent: number;
        /** Largest losing trade */
        largestLosTrade: number;
        /** Largest losing trade percent */
        largestLosTradePercent: number;
        /** Largest winning trade */
        largestWinTrade: number;
        /** Largest winning trade percent */
        largestWinTradePercent: number;
        /** Margin calls */
        marginCalls: number;
        /** Max contracts held */
        maxContractsHeld: number;
        /** Net profit */
        netProfit: number;
        /** Net profit percent */
        netProfitPercent: number;
        /** Number of losing trades */
        numberOfLosingTrades: number;
        /** Number of winning trades */
        numberOfWinningTrades: number;
        /** Percent profitable */
        percentProfitable: number;
        /** Profit factor */
        profitFactor: number;
        /** Ratio average win / average loss */
        ratioAvgWinAvgLoss: number;
        /** Total open trades */
        totalOpenTrades: number;
        /** Total trades */
        totalTrades: number;
    };

    /**
     * From-to
     */
    export type FromTo = {
        /** From */
        from: number;
        /** To */
        to: number;
    };

    /**
     * Strategy report
     */
    export type StrategyReport = {
        /** Currency */
        currency?: 'EUR' | 'USD' | 'JPY' | '' | 'CHF';
        /** Settings */
        settings?: {
            dateRange?: {
                backtest?: FromTo;
                trade?: FromTo;
            };
        };
        /** Trades */
        trades: TradeReport[];
        /** History */
        history: {
            buyHold?: number[];
            buyHoldPercent?: number[];
            drawDown?: number[];
            drawDownPercent?: number[];
            equity?: number[];
            equityPercent?: number[];
        };
        /** Performance */
        performance: {
            all?: PerfReport;
            long?: PerfReport;
            short?: PerfReport;
            buyHoldReturn?: number;
            buyHoldReturnPercent?: number;
            maxDrawDown?: number;
            maxStrategyDrawDownPercent?: number;
            openPL?: number;
            openPLPercent?: number;
            sharpeRatio?: number;
            sortinoRatio?: number;
        };
    };

    /**
     * Update change type
     */
    export type UpdateChangeType =
        | 'plots'
        | 'report.currency'
        | 'report.settings'
        | 'report.perf'
        | 'report.trades'
        | 'report.history'
        | 'graphic';

    /**
     * Study event callbacks
     */
    export interface StudyCallbacks {
        /** When study is completed */
        studyCompleted: Array<() => void>;
        /** When study updates */
        update: Array<(changes: UpdateChangeType[]) => void>;
        /** Generic event handler */
        event: Array<(ev: string, ...data: any[]) => void>;
        /** Error handler */
        error: Array<(...args: any[]) => void>;
    }

    /**
     * Study configuration
     */
    export interface StudyConfig {
        /** Study ID */
        id: string;
        /** Chart session reference */
        chartSession: ChartSessionBridge;
        /** Debug mode flag */
        debug?: boolean;
    }


    export class ChartStudy {
        /** Study instance ID */
        readonly id: string;
        /** Indicator instance */
        instance: PineIndicator | BuiltInIndicator;
        /** Period values */
        readonly periods: Array<Record<string, any>>;
        /** Graphic drawings */
        readonly graphic: GraphicData;
        /** Strategy report */
        readonly strategyReport: StrategyReport;
        /** Study callbacks */
        readonly callbacks: StudyCallbacks;

        /**
         * Creates a new Study instance
         * @param indicator Indicator to use
         * @param config Study configuration
         */
        constructor(indicator: PineIndicator | BuiltInIndicator, config?: StudyConfig);

        /**
         * Change the indicator used by this study
         * @param indicator New indicator instance
         */
        setIndicator(indicator: PineIndicator | BuiltInIndicator): void;

        /**
         * Register ready callback
         * @param cb Callback when study is ready
         */
        onReady(cb: () => void): void;

        /**
         * Register update callback
         * @param cb Callback when study updates
         */
        onUpdate(cb: (changes: UpdateChangeType[]) => void): void;

        /**
         * Register error callback
         * @param cb Callback when errors occur
         */
        onError(cb: (...args: any[]) => void): void;

        /**
         * Remove the study from the chart
         */
        remove(): void;
    }

    export function getInputs(options: PineIndicator): Record<string, any>;

    export function parseTrades(trades: any[]): TradeReport[];

    export function studyConstructor(chartSession: ChartSessionBridge): typeof ChartStudy;

    // src/chart/session
    /**
     * Price period
     */
    export interface PricePeriod {
        /** Time */
        time: number;
        /** Open */
        open: number;
        /** Close */
        close: number;
        /** Max */
        max: number;
        /** Min */
        min: number;
        /** Volume */
        volume: number;
    }

    export interface ChartSessionBridge {
        sessionID: string;
        studyListeners: StudyListeners;
        indexes: Record<number, number>;
        send: SendPacket;
    }

    export type ChartEvent = 'seriesLoaded' | 'symbolLoaded' | 'update' | 'error';

    /**
     * Chart type
     */
    export type ChartType = 'HeikinAshi' | 'Renko' | 'LineBreak' | 'Kagi' | 'PointAndFigure' | 'Range';

    /**
     * Chart inputs
     */
    export interface ChartInputs {
        /** ATR length */
        atrLength?: number;
        /** Source */
        source?: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';
        /** Style */
        style?: 'ATR' | string;
        /** Box size */
        boxSize?: number;
        /** Reversal amount */
        reversalAmount?: number;
        /** Sources */
        sources?: 'Close';
        /** Wicks */
        wicks?: boolean;
        /** Line break */
        lb?: number;
        /** One step back building */
        oneStepBackBuilding?: boolean;
        /** Phantom bars */
        phantomBars?: boolean;
        /** Range */
        range?: number;
    }

    export type StudyListeners = Record<string, Array<(...args: any[]) => void>>;

    export interface Subsession {
        id: string;
        name: string;
    }

    /**
     * Market infos
     */
    export interface MarketInfos {
        /** Series ID */
        series_id: string;
        /** Base currency */
        base_currency: string;
        /** Base currency ID */
        base_currency_id: string;
        /** Name */
        name: string;
        /** Full name */
        full_name: string;
        /** Pro name */
        pro_name: string;
        /** Description */
        description: string;
        /** Short description */
        short_description: string;
        /** Exchange */
        exchange: string;
        /** Listed exchange */
        listed_exchange: string;
        /** Provider ID */
        provider_id: string;
        /** Currency ID */
        currency_id: string;
        /** Currency code */
        currency_code: string;
        /** Variable tick size */
        variable_tick_size: string;
        /** Pricescale */
        pricescale: number;
        /** Point value */
        pointvalue: number;
        /** Session */
        session: string;
        /** Session display */
        session_display: string;
        /** Type */
        type: string;
        /** Has intraday */
        has_intraday: boolean;
        /** Fractional */
        fractional: boolean;
        /** Is tradable */
        is_tradable: boolean;
        /** Min movement */
        minmov: number;
        /** Min movement 2 */
        minmove2: number;
        /** Timezone */
        timezone: string;
        /** Is replayable */
        is_replayable: boolean;
        /** Has adjustment */
        has_adjustment: boolean;
        /** Has extended hours */
        has_extended_hours: boolean;
        /** Bar source */
        bar_source: string;
        /** Bar transform */
        bar_transform: string;
        /** Bar fillgaps */
        bar_fillgaps: boolean;
        /** Allowed adjustment */
        allowed_adjustment: string;
        /** Subsession ID */
        subsession_id: string;
        /** Pro permission */
        pro_perm: string;
        /** Base name */
        base_name: string[];
        /** Legs */
        legs: string[];
        /** Subsessions */
        subsessions: Subsession[];
        /** Typespecs */
        typespecs: string[];
        /** Resolutions */
        resolutions: string[];
        /** Aliases */
        aliases: string[];
        /** Alternatives */
        alternatives: string[];
    }

    export class ChartSession {
        Study: typeof ChartStudy;
        #chartSessionID: string;
        #replaySessionID: string;
        #replayMode: boolean;
        #replayOKCB: Record<string, () => any>;
        #client: ClientBridge;
        #studyListeners: StudyListeners;
        #periods: Record<number, PricePeriod[]>;
        #infos: MarketInfos;
        #callbacks: Record<
            ChartEvent | 'replayLoaded' | 'replayPoint' | 'replayResolution' | 'replayEnd',
            Array<(...args: any[]) => void>
        >;
        #seriesCreated: boolean;
        #currentSeries: number;
        #chartSession: ChartSessionBridge;

        constructor(client?: ClientBridge);

        /** Periods */
        get periods(): PricePeriod[];

        /** Infos */
        get infos(): MarketInfos;

        /**
         * Set series
         * @param {string} timeframe Timeframe
         * @param {number} range Range
         * @param {number | null} reference Reference
         */
        setSeries(timeframe?: string, range?: number, reference?: number | null): void;

        /**
         * Set market
         * @param {string} symbol Symbol
         * @param {object} options Options
         */
        setMarket(
            symbol: string,
            options?: {
                timeframe?: string;
                range?: number;
                to?: number;
                adjustment?: 'splits' | 'dividends';
                backadjustment?: boolean;
                session?: 'regular' | 'extended';
                currency?: 'EUR' | 'USD' | string;
                type?: ChartType;
                inputs?: ChartInputs;
                replay?: number;
            },
        ): void;

        /**
         * Set timezone
         * @param {string} timezone Timezone
         */
        setTimezone(timezone: string): void;

        /**
         * Fetch more
         * @param {number} number Number
         */
        fetchMore(number?: number): void;

        /**
         * Replay step
         * @param {number} number Number
         * @returns {Promise<void>}
         */
        replayStep(number?: number): Promise<void>;

        /**
         * Replay start
         * @param {number} interval Interval
         * @returns {Promise<void>}
         */
        replayStart(interval?: number): Promise<void>;

        /**
         * Replay stop
         * @returns {Promise<void>}
         */
        replayStop(): Promise<void>;

        /**
         * On symbol loaded
         * @param {() => void} cb Callback
         */
        onSymbolLoaded(cb: () => void): void;

        /**
         * On update
         * @param {(changes: string[]) => void} cb Callback
         */
        onUpdate(cb: (changes: string[]) => void): void;

        /**
         * On replay loaded
         * @param {() => void} cb Callback
         */
        onReplayLoaded(cb: () => void): void;

        /**
         * On replay resolution
         * @param {(timeframe: string, index: number) => void} cb Callback
         */
        onReplayResolution(cb: (timeframe: string, index: number) => void): void;

        /**
         * On replay end
         * @param {() => void} cb Callback
         */
        onReplayEnd(cb: () => void): void;

        /**
         * On replay point
         * @param {(index: number) => void} cb Callback
         */
        onReplayPoint(cb: (index: number) => void): void;

        /**
         * On error
         * @param {(...args: any[]) => void} cb Callback
         */
        onError(cb: (...args: any[]) => void): void;

        delete(): void;
    }

    // src/chart/history
    export interface HistorySessionBridge {
        sessionID: string;
        send: (type: string, payload: any[]) => void;
    }

    export class HistorySession {
        #historySessionID: string;
        #client: ClientBridge;
        #strategyReport: StrategyReport;
        #callbacks: Record<ChartEvent | 'historyLoaded', Array<(...args: any[]) => void>>;
        #historySession: HistorySessionBridge;

        constructor(client?: ClientBridge);

        get strategyReport(): StrategyReport;

        requestHistoryData(
            symbol: string,
            indicator: PineIndicator,
            options: {
                timeframe?: string;
                from?: number;
                to?: number;
                adjustment?: 'splits' | 'dividends';
                session?: 'regular' | 'extended';
                currency?: 'EUR' | 'USD' | string;
                resolution?: string;
            },
        ): void;

        onHistoryLoaded(cb: () => void): void;

        onError(cb: (...args: any[]) => void): void;

        delete(): void;
    }

    export type Layout = {
        id: number;
        image_url: string;
        symbol: string;
        short_name: string;
        name: string;
        created: string;
        modified: string;
        resolution: string;
        pro_symbol: string;
        expression: string;
        created_time: string;
        created_timestamp: number;
        modified_iso: number;
        short_symbol: string;
        interval: string;
        url: string;
        favorite: boolean;
    };

    export function fetchLayouts(session: string, signature: string): Promise<Layout[]>;

    export function fetchLayout(nameOrIdOrUrl: string | number, session: string, signature: string): Promise<Layout>;

    export function fetchLayoutInitData(chartShortUrl: string | number, session: string, signature: string): Promise<any>

    export function fetchLayoutContent(chartShortUrl: string | number, session: string, signature: string): Promise<any>

    export function createBlankLayout(
        name: string,
        session: string,
        signature: string
    ): Promise<Layout>;

    export function replaceLayout(
        layout: Layout,
        currencyId: string,
        symbol: string,
        interval: string,
        studyId: string,
        indicatorId: string,
        indicatorValues: Record<string, any>,
        session: string,
        signature: string
    ): Promise<string>;

    export function createLayout(
        name: string,
        currencyId: string,
        symbol: string,
        interval: string,
        studyId: string,
        indicatorId: string,
        indicatorValues: Record<string, any>,
        session: string,
        signature: string
    ): Promise<string>;

    export function updateLayoutStudyInputs(
        chartShortUrl: string,
        studyId: string,
        inputs: Record<string, any>,
        session: string,
        signature: string
    ): Promise<string>;

    export function deleteLayout(
        chartShortUrl: string | string[],
        session: string,
        signature: string
    ): Promise<void>;

    export function deleteLayouts(
        chartShortUrl: string[],
        session: string,
        signature: string
    ): Promise<void>;

    type Alert = {
        symbol: string;
        resolution: string;
        condition: {
            type: string;
            frequency: string;
            series: any[];
            strategy_mode: string;
        };
        expiration: null;
        auto_deactivate: boolean;
        email: boolean;
        sms_over_email: boolean;
        mobile_push: boolean;
        message: string;
        sound_file: string | null;
        sound_duration: number;
        popup: boolean;
        web_hook: string;
        name: string;
        alert_id: number;
        cross_interval: boolean;
        type: string;
        active: boolean;
        create_time: string; // ISO date string
        last_fire_time: string; // ISO date string
        last_fire_bar_time: string; // ISO date string
        last_error: string | null;
        last_stop_reason: string | null;
        complexity: string;
        presentation_data: {
            main_series: Record<string, unknown>;
            studies: Record<string, unknown>;
            mutable_study_data: Record<string, unknown>;
        };
        kinds: string[];
    };

    export function getAlerts(
        session: string,
        signature: string
    ): Promise<Alert>;

    type AlertCreated = {
        symbol: string;
        resolution: string;
        condition: {
            type: 'strategy';
            frequency: string;
            series: {
                type: string;
                study: string;
                pine_id: string;
                pine_version: string;
                inputs: Record<string, unknown>; // Dynamic object
            }[];
            strategy_mode: 'strategy';
        };
        expiration: null;
        auto_deactivate: boolean;
        email: boolean;
        sms_over_email: boolean;
        mobile_push: boolean;
        message: string;
        sound_file: string | null;
        sound_duration: number;
        popup: boolean;
        web_hook: string;
        name: string;
        alert_id: number;
        cross_interval: boolean;
        type: 'strategy';
        active: boolean;
        create_time: string; // ISO date string
        last_fire_time: string | null;
        last_fire_bar_time: string | null;
        last_error: string | null;
        last_stop_reason: string | null;
        complexity: 'complex';
        presentation_data: {
            main_series: {
                type: string;
                formatter: string;
                pricescale: number;
                minmovement: number;
                "currency-logoid": string;
                "base-currency-logoid": string;
            };
            studies: Record<string, {
                description: string;
                short_description: string;
                format_type: string;
            }>;
            mutable_study_data: Record<string, {
                titles: {
                    title: string;
                    short_title: string;
                };
            }>;
        };
        kinds: string[];
    };

    type CreateAlertPayload = {
        symbol: string;
        resolution: string;
        message: string;
        sound_file: string | null;
        sound_duration: number;
        popup: boolean;
        expiration: null | string;
        condition: {
            type: 'strategy';
            strategy_mode: 'strategy';
            series: {
                type: string;
                study: string;
                inputs: Record<string, any>; // Inputs can be anything
                pine_id: string;
                pine_version: string;
            }[];
        };
        auto_deactivate: boolean;
        email: boolean;
        sms_over_email: boolean;
        mobile_push: boolean;
        web_hook?: string;
        name?: string;
        active: boolean;
        ignore_warnings: boolean;
        watchlist_color?: string | null;
    };

    export function createAlert(
        payload: CreateAlertPayload,
        session: string,
        signature: string
    ): Promise<{ s: string, id: string, r: AlertCreated, errmsg?: string, err?: { code: string } }>;

    export function createAlertForChart(
        chartId: string,
        name: string,
        webhook: string,
        message: string,
        email: boolean,
        sourceId: string | undefined,
        session: string,
        signature: string
    ): Promise<{ status: 'OK' | 'ERROR', message: string, data?: any }>;

    export function alertToBacktest(
        alert: Alert,
        session: string,
        signature: string
    ): Promise<{ s: string, id: string, r: null, errmsg?: string, err?: { code: string } }>;

    export function modifyAlerts(
        alertIds: number[],
        action: 'stop' | 'restart' | 'clone' | 'delete' | 'modify_restart_alert',
        session: string,
        signature: string
    ): Promise<any>;

    export function modifyAlert(
        payload: Alert,
        session: string,
        signature: string
    ): Promise<{ s: string, id: string, r: null, errmsg?: string, err?: { code: string } }>;

    type FiredAlert = {
        fire_id: number;
        alert_id: number;
        symbol: string;
        resolution: string;
        sound_file: string | null;
        sound_duration: number;
        popup: boolean;
        cross_interval: boolean;
        message: string; // JSON string containing details
        fire_time: string; // ISO date string
        bar_time: string; // ISO date string
        name: string;
        kinds: string[];
    };

    export function getFiredAlerts(
        filter?: { limit?: string, symbol?: string, resolution?: string },
        session: string,
        signature: string
    ): Promise<{ s: string, id: string, r: FiredAlert[], errmsg?: string, err?: { code: string } }>;

    export function getStudySourcesFromLayoutContent(layoutContent: any): any[];
}
