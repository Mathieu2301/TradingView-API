declare module '@mathieuc/tradingview' {
    import { EventEmitter } from 'events';

    //src/client
    export interface Session {
        type: 'quote' | 'chart' | 'replay';
        onData: (data: any) => void;
    }

    export interface SessionList {
        [key: string]: Session;
    }

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

    export interface ClientOptions {
        token?: string;
        signature?: string;
        DEBUG?: boolean | 'session' | 'client' | 'study' | 'market' | 'quote';
        server?: 'data' | 'prodata' | 'widgetdata' | 'history-data';
        location?: string;
    }

    export type SocketSession = unknown;

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

        constructor(clientOptions?: ClientOptions);

        get isLogged(): boolean;

        get isOpen(): boolean;

        send(type: string, payload?: string[]): void;

        sendQueue(): void;

        onConnected(cb: () => void): void;

        onDisconnected(cb: () => void): void;

        onLogged(cb: (session: SocketSession) => void): void;

        onPing(cb: (i: number) => void): void;

        onData(cb: (...args: any[]) => void): void;

        onError(cb: (...args: any[]) => void): void;

        onEvent(cb: (...args: any[]) => void): void;

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

    export interface UserCredentials {
        id: number;
        session: string;
        signature: string;
    }

    export function getTA(id: string): Promise<Periods | false>;

    export interface SearchMarketResult {
        id: string;
        exchange: string;
        fullExchange: string;
        symbol: string;
        description: string;
        type: string;
        currency: string;
        chartCurrencyId: string;
        getTA: () => Promise<Periods>;
    }

    export function searchMarket(
        search: string,
        filter?: 'stock' | 'futures' | 'forex' | 'cfd' | 'crypto' | 'index' | 'economic',
    ): Promise<SearchMarketResult[]>;

    export function searchMarketV3(
        search: string,
        filter?: 'stock' | 'futures' | 'forex' | 'cfd' | 'crypto' | 'index' | 'economic',
    ): Promise<SearchMarketResult[]>;

    export interface SearchIndicatorResult {
        id: string;
        version: string;
        name: string;
        author: { id: number; username: string };
        image: string;
        source: string | '';
        type: 'study' | 'strategy';
        access: 'open_source' | 'closed_source' | 'invite_only' | 'private' | 'other';
        get: () => Promise<PineIndicator>;
    }

    export function searchIndicator(search?: string): Promise<SearchIndicatorResult[]>;

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

    export interface User {
        id: number;
        username: string;
        first_name?: string;
        last_name?: string;
        reputation: number;
        following: number;
        followers: number;
        notification_count: {
            user: number;
            following: number;
        };
        session_hash: string;
        private_channel: string;
        auth_token: string;
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

    export function getUser(session: string, signature?: string, location?: string): Promise<User>;

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

    export function getChartToken(layout: string, credentials?: UserCredentials): Promise<string>;

    export interface DrawingPoint {
        time_t: number;
        price: number;
        offset: number;
    }

    export interface Drawing {
        id: string;
        symbol: string;
        ownerSource: string;
        serverUpdateTime: string;
        currencyId: string;
        unitId: any;
        type: string;
        points: DrawingPoint[];
        zorder: number;
        linkKey: string;
        state: Record<string, any>;
    }

    export function getDrawings(
        layout: string,
        symbol?: string,
        credentials?: UserCredentials,
        chartID?: string,
    ): Promise<Drawing[]>;

    // src/protocol
    export interface TWPacket {
        m?: string;
        p?: [string, any];
    }

    export function parseWSPacket(str: string): TWPacket[];

    export function formatWSPacket(packet: TWPacket): string;

    export function parseCompressed(data: string): Promise<unknown>;

    // src/types
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
    export function genSessionID(type: string): string;

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
        id: number;
        x: number;
        y: number;
        yLoc: YLocValue;
        text: string;
        style: LabelStyleValue;
        color: number;
        textColor: number;
        size: SizeValue;
        textAlign: HAlignValue;
        toolTip: string;
    }

    export interface GraphicLine {
        id: number;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        extend: ExtendValue;
        style: LineStyleValue;
        color: number;
        width: number;
    }

    export interface GraphicBox {
        id: number;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        color: number;
        bgColor: number;
        extend: ExtendValue;
        style: BoxStyleValue;
        width: number;
        text: string;
        textSize: SizeValue;
        textColor: number;
        textVAlign: VAlignValue;
        textHAlign: HAlignValue;
        textWrap: TextWrapValue;
    }

    export interface TableCell {
        id: number;
        text: string;
        width: number;
        height: number;
        textColor: number;
        textHAlign: HAlignValue;
        textVAlign: VAlignValue;
        textSize: SizeValue;
        bgColor: number;
    }

    export interface GraphicTable {
        id: number;
        position: TablePositionValue;
        rows: number;
        columns: number;
        bgColor: number;
        frameColor: number;
        frameWidth: number;
        borderColor: number;
        borderWidth: number;

        cells(): TableCell[][];
    }

    export interface GraphicHorizline {
        id: number;
        level: number;
        startIndex: number;
        endIndex: number;
        extendRight: boolean;
        extendLeft: boolean;
    }

    export interface GraphicPoint {
        index: number;
        level: number;
    }

    export interface GraphicPolygon {
        id: number;
        points: GraphicPoint[];
    }

    export interface GraphicHorizHist {
        id: number;
        priceLow: number;
        priceHigh: number;
        firstBarTime: number;
        lastBarTime: number;
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
    export type BuiltInIndicatorType =
        | 'Volume@tv-basicstudies-241'
        | 'VbPFixed@tv-basicstudies-241'
        | 'VbPFixed@tv-basicstudies-241!'
        | 'VbPFixed@tv-volumebyprice-53!'
        | 'VbPSessions@tv-volumebyprice-53'
        | 'VbPSessionsRough@tv-volumebyprice-53!'
        | 'VbPSessionsDetailed@tv-volumebyprice-53!'
        | 'VbPVisible@tv-volumebyprice-53';

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

        constructor(type: BuiltInIndicatorType);

        getType(): BuiltInIndicatorType;

        getOptions(): IndicatorOptions;

        setOption(key: BuiltInIndicatorOption, value: any, FORCE?: boolean): void;

        clone(): PineIndicator;
    }

    // src/classes/PineIndicator
    export type IndicatorInput = {
        name: string;
        inline: string;
        internalID?: string;
        tooltip?: string;
        type: 'text' | 'source' | 'integer' | 'float' | 'resolution' | 'bool' | 'color';
        value: string | number | boolean;
        isHidden: boolean;
        isFake: boolean;
        options?: string[];
    };

    export type Indicator = {
        pineId: string;
        pineVersion: string;
        description: string;
        shortDescription: string;
        inputs: Record<string, IndicatorInput>;
        plots: Record<string, string>;
        script: string;
    };

    export type IndicatorType = 'Script@tv-scripting-101!' | 'StrategyScript@tv-scripting-101!';

    export class PineIndicator {
        #options: Indicator;
        #type: IndicatorType = 'Script@tv-scripting-101!';

        constructor(options: Indicator);

        get pineId(): string;

        get pineVersion(): string;

        get description(): string;

        get shortDescription(): string;

        get inputs(): Record<string, IndicatorInput>;

        get plots(): Record<string, string>;

        get script(): string;

        get type(): IndicatorType;

        setType(type?: IndicatorType): void;

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
    export type AuthorizationUser = {
        id: string;
        username: string;
        userpic: string;
        expiration: string;
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

        constructor(sessionId: string, signature: string, pineId: string);

        getUsers(limit?: number, order?: FetchOrder): Promise<AuthorizationUser[]>;

        addUser(username: string, expiration?: Date | null): Promise<'ok' | 'exists' | null>;

        modifyExpiration(username: string, expiration?: Date | null): Promise<'ok' | null>;

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

        onLoaded(cb: () => void): void;

        onData(cb: (data: Record<string, any>) => void): void;

        onEvent(cb: (...args: any[]) => void): void;

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

    export interface QuoteSessionOptions {
        fields?: 'all' | 'price';
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
    export type TradeReport = {
        entry: {
            name: string;
            type: 'long' | 'short';
            value: number;
            time: number;
        };
        exit: {
            name: string;
            value: number;
            time: number;
        };
        quantity: number;
        profit: {
            v: number;
            p: number;
        };
    };

    export type PerfReport = {
        avgBarsInTrade: number;
        avgBarsInWinTrade: number;
        avgBarsInLossTrade: number;
        avgTrade: number;
        avgTradePercent: number;
        avgLosTrade: number;
        avgLosTradePercent: number;
        avgWinTrade: number;
        avgWinTradePercent: number;
        commissionPaid: number;
        grossLoss: number;
        grossLossPercent: number;
        grossProfit: number;
        grossProfitPercent: number;
        largestLosTrade: number;
        largestLosTradePercent: number;
        largestWinTrade: number;
        largestWinTradePercent: number;
        marginCalls: number;
        maxContractsHeld: number;
        netProfit: number;
        netProfitPercent: number;
        numberOfLosingTrades: number;
        numberOfWinningTrades: number;
        percentProfitable: number;
        profitFactor: number;
        ratioAvgWinAvgLoss: number;
        totalOpenTrades: number;
        totalTrades: number;
    };

    export type FromTo = {
        from: number;
        to: number;
    };

    export type StrategyReport = {
        currency?: 'EUR' | 'USD' | 'JPY' | '' | 'CHF';
        settings?: {
            dateRange?: {
                backtest?: FromTo;
                trade?: FromTo;
            };
        };
        trades: TradeReport[];
        history: {
            buyHold?: number[];
            buyHoldPercent?: number[];
            drawDown?: number[];
            drawDownPercent?: number[];
            equity?: number[];
            equityPercent?: number[];
        };
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
    export interface PricePeriod {
        time: number;
        open: number;
        close: number;
        max: number;
        min: number;
        volume: number;
    }

    export interface ChartSessionBridge {
        sessionID: string;
        studyListeners: StudyListeners;
        indexes: Record<number, number>;
        send: SendPacket;
    }

    export type ChartEvent = 'seriesLoaded' | 'symbolLoaded' | 'update' | 'error';

    export type ChartType = 'HeikinAshi' | 'Renko' | 'LineBreak' | 'Kagi' | 'PointAndFigure' | 'Range';

    export interface ChartInputs {
        atrLength?: number;
        source?: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';
        style?: 'ATR' | string;
        boxSize?: number;
        reversalAmount?: number;
        sources?: 'Close';
        wicks?: boolean;
        lb?: number;
        oneStepBackBuilding?: boolean;
        phantomBars?: boolean;
        range?: number;
    }

    export type StudyListeners = Record<string, Array<(...args: any[]) => void>>;

    export interface Subsession {
        id: string;
        name: string;
    }

    export interface MarketInfos {
        series_id: string;
        base_currency: string;
        base_currency_id: string;
        name: string;
        full_name: string;
        pro_name: string;
        description: string;
        short_description: string;
        exchange: string;
        listed_exchange: string;
        provider_id: string;
        currency_id: string;
        currency_code: string;
        variable_tick_size: string;
        pricescale: number;
        pointvalue: number;
        session: string;
        session_display: string;
        type: string;
        has_intraday: boolean;
        fractional: boolean;
        is_tradable: boolean;
        minmov: number;
        minmove2: number;
        timezone: string;
        is_replayable: boolean;
        has_adjustment: boolean;
        has_extended_hours: boolean;
        bar_source: string;
        bar_transform: string;
        bar_fillgaps: boolean;
        allowed_adjustment: string;
        subsession_id: string;
        pro_perm: string;
        base_name: string[];
        legs: string[];
        subsessions: Subsession[];
        typespecs: string[];
        resolutions: string[];
        aliases: string[];
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

        get periods(): PricePeriod[];

        get infos(): MarketInfos;

        setSeries(timeframe?: string, range?: number, reference?: number | null): void;

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

        setTimezone(timezone: string): void;

        fetchMore(number?: number): void;

        replayStep(number?: number): Promise<void>;

        replayStart(interval?: number): Promise<void>;

        replayStop(): Promise<void>;

        onSymbolLoaded(cb: () => void): void;

        onUpdate(cb: (changes: string[]) => void): void;

        onReplayLoaded(cb: () => void): void;

        onReplayResolution(cb: (timeframe: string, index: number) => void): void;

        onReplayEnd(cb: () => void): void;

        onReplayPoint(cb: (index: number) => void): void;

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
