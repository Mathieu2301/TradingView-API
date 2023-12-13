export type advice = number;
export type Period = {
    Other: advice;
    All: advice;
    MA: advice;
};
export type Periods = {
    '1': Period;
    '5': Period;
    '15': Period;
    '60': Period;
    '240': Period;
    '1D': Period;
    '1W': Period;
    '1M': Period;
};
import PineIndicator = require("./classes/PineIndicator");
/**
 * Get technical analysis
 * @function getTA
 * @param {Screener} screener Market screener
 * @param {string} id Full market id (Example: COINBASE:BTCEUR)
 * @returns {Promise<Periods>} results
 */
declare function getTA(screener: Screener, id: string): Promise<Periods>;
/**
 * @typedef {Object} SearchMarketResult
 * @prop {string} id Market full symbol
 * @prop {string} exchange Market exchange name
 * @prop {string} fullExchange Market exchange full name
 * @prop {Screener | 'forex' | 'crypto'} screener Market screener
 * @prop {string} symbol Market symbol
 * @prop {string} description Market name
 * @prop {string} type Market type
 * @prop {() => Promise<Periods>} getTA Get market technical analysis
 */
/**
 * Find a symbol
 * @function searchMarket
 * @param {string} search Keywords
 * @param {'stock'
 *  | 'futures' | 'forex' | 'cfd'
 *  | 'crypto' | 'index' | 'economic'
 * } [filter] Caterogy filter
 * @returns {Promise<SearchMarketResult[]>} Search results
 */
declare function searchMarket(search: string, filter?: "index" | "crypto" | "stock" | "futures" | "forex" | "cfd" | "economic"): Promise<{
    /**
     * Market full symbol
     */
    id: string;
    /**
     * Market exchange name
     */
    exchange: string;
    /**
     * Market exchange full name
     */
    fullExchange: string;
    /**
     * Market screener
     */
    screener: any;
    /**
     * Market symbol
     */
    symbol: string;
    /**
     * Market name
     */
    description: string;
    /**
     * Market type
     */
    type: string;
    /**
     * Get market technical analysis
     */
    getTA: () => Promise<Periods>;
}[]>;
/**
 * @typedef {Object} SearchIndicatorResult
 * @prop {string} id Script ID
 * @prop {string} version Script version
 * @prop {string} name Script complete name
 * @prop {{ id: number, username: string }} author Author user ID
 * @prop {string} image Image ID https://tradingview.com/i/${image}
 * @prop {string | ''} source Script source (if available)
 * @prop {'study' | 'strategy'} type Script type (study / strategy)
 * @prop {'open_source' | 'closed_source' | 'invite_only'
 *  | 'private' | 'other'} access Script access type
 * @prop {() => Promise<PineIndicator>} get Get the full indicator informations
 */
/**
 * Find an indicator
 * @function searchIndicator
 * @param {string} search Keywords
 * @returns {Promise<SearchIndicatorResult[]>} Search results
 */
declare function searchIndicator(search?: string): Promise<{
    /**
     * Script ID
     */
    id: string;
    /**
     * Script version
     */
    version: string;
    /**
     * Script complete name
     */
    name: string;
    /**
     * Author user ID
     */
    author: {
        id: number;
        username: string;
    };
    /**
     * Image ID https://tradingview.com/i/${image}
     */
    image: string;
    /**
     * Script source (if available)
     */
    source: string;
    /**
     * Script type (study / strategy)
     */
    type: "study" | "strategy";
    /**
     * Script access type
     */
    access: "private" | "other" | "closed_source" | "open_source" | "invite_only";
    /**
     * Get the full indicator informations
     */
    get: () => Promise<PineIndicator>;
}[]>;
/**
 * Get an indicator
 * @function getIndicator
 * @param {string} id Indicator ID (Like: PUB;XXXXXXXXXXXXXXXXXXXXX)
 * @param {'last' | string} [version] Wanted version of the indicator
 * @returns {Promise<PineIndicator>} Indicator
 */
declare function getIndicator(id: string, version?: string): Promise<PineIndicator>;
/**
 * @typedef {Object} User Instance of User
 * @prop {number} id User ID
 * @prop {string} username User username
 * @prop {string} firstName User first name
 * @prop {string} lastName User last name
 * @prop {number} reputation User reputation
 * @prop {number} following Number of following accounts
 * @prop {number} followers Number of followers
 * @prop {Object} notifications User's notifications
 * @prop {number} notifications.user User notifications
 * @prop {number} notifications.following Notification from following accounts
 * @prop {string} session User session
 * @prop {string} sessionHash User session hash
 * @prop {string} signature User session signature
 * @prop {string} privateChannel User private channel
 * @prop {string} authToken User auth token
 * @prop {Date} joinDate Account creation date
 */
/**
 * Get user and sessionid from username/email and password
 * @function loginUser
 * @param {string} username User username/email
 * @param {string} password User password
 * @param {boolean} [remember] Remember the session (default: false)
 * @param {string} [UA] Custom UserAgent
 * @returns {Promise<User>} Token
 */
declare function loginUser(username: string, password: string, remember?: boolean, UA?: string): Promise<{
    /**
     * User ID
     */
    id: number;
    /**
     * User username
     */
    username: string;
    /**
     * User first name
     */
    firstName: string;
    /**
     * User last name
     */
    lastName: string;
    /**
     * User reputation
     */
    reputation: number;
    /**
     * Number of following accounts
     */
    following: number;
    /**
     * Number of followers
     */
    followers: number;
    /**
     * User's notifications
     */
    notifications: {
        /**
         * User notifications
         */
        user: number;
        /**
         * Notification from following accounts
         */
        following: number;
    };
    /**
     * User session
     */
    session: string;
    /**
     * User session hash
     */
    sessionHash: string;
    /**
     * User session signature
     */
    signature: string;
    /**
     * User private channel
     */
    privateChannel: string;
    /**
     * User auth token
     */
    authToken: string;
    /**
     * Account creation date
     */
    joinDate: Date;
}>;
/**
 * Get user from 'sessionid' cookie
 * @function getUser
 * @param {string} session User 'sessionid' cookie
 * @param {string} [signature] User 'sessionid_sign' cookie
 * @param {string} [location] Auth page location (For france: https://fr.tradingview.com/)
 * @returns {Promise<User>} Token
 */
declare function getUser(session: string, signature?: string, location?: string): Promise<{
    /**
     * User ID
     */
    id: number;
    /**
     * User username
     */
    username: string;
    /**
     * User first name
     */
    firstName: string;
    /**
     * User last name
     */
    lastName: string;
    /**
     * User reputation
     */
    reputation: number;
    /**
     * Number of following accounts
     */
    following: number;
    /**
     * Number of followers
     */
    followers: number;
    /**
     * User's notifications
     */
    notifications: {
        /**
         * User notifications
         */
        user: number;
        /**
         * Notification from following accounts
         */
        following: number;
    };
    /**
     * User session
     */
    session: string;
    /**
     * User session hash
     */
    sessionHash: string;
    /**
     * User session signature
     */
    signature: string;
    /**
     * User private channel
     */
    privateChannel: string;
    /**
     * User auth token
     */
    authToken: string;
    /**
     * Account creation date
     */
    joinDate: Date;
}>;
/**
 * Get user's private indicators from a 'sessionid' cookie
 * @function getPrivateIndicators
 * @param {string} session User 'sessionid' cookie
 * @param {string} [signature] User 'sessionid_sign' cookie
 * @returns {Promise<SearchIndicatorResult[]>} Search results
 */
declare function getPrivateIndicators(session: string, signature?: string): Promise<{
    /**
     * Script ID
     */
    id: string;
    /**
     * Script version
     */
    version: string;
    /**
     * Script complete name
     */
    name: string;
    /**
     * Author user ID
     */
    author: {
        id: number;
        username: string;
    };
    /**
     * Image ID https://tradingview.com/i/${image}
     */
    image: string;
    /**
     * Script source (if available)
     */
    source: string;
    /**
     * Script type (study / strategy)
     */
    type: "study" | "strategy";
    /**
     * Script access type
     */
    access: "private" | "other" | "closed_source" | "open_source" | "invite_only";
    /**
     * Get the full indicator informations
     */
    get: () => Promise<PineIndicator>;
}[]>;
/**
 * User credentials
 * @typedef {Object} UserCredentials
 * @prop {number} id User ID
 * @prop {string} session User session ('sessionid' cookie)
 * @prop {string} [signature] User session signature ('sessionid_sign' cookie)
 */
/**
 * Get a chart token from a layout ID and the user credentials if the layout is not public
 * @function getChartToken
 * @param {string} layout The layout ID found in the layout URL (Like: 'XXXXXXXX')
 * @param {UserCredentials} [credentials] User credentials (id + session + [signature])
 * @returns {Promise<string>} Token
 */
declare function getChartToken(layout: string, credentials?: {
    /**
     * User ID
     */
    id: number;
    /**
     * User session ('sessionid' cookie)
     */
    session: string;
    /**
     * User session signature ('sessionid_sign' cookie)
     */
    signature?: string;
}): Promise<string>;
/**
 * @typedef {Object} DrawingPoint Drawing poitn
 * @prop {number} time_t Point X time position
 * @prop {number} price Point Y price position
 * @prop {number} offset Point offset
 */
/**
 * @typedef {Object} Drawing
 * @prop {string} id Drawing ID (Like: 'XXXXXX')
 * @prop {string} symbol Layout market symbol (Like: 'BINANCE:BUCEUR')
 * @prop {string} ownerSource Owner user ID (Like: 'XXXXXX')
 * @prop {string} serverUpdateTime Drawing last update timestamp
 * @prop {string} currencyId Currency ID (Like: 'EUR')
 * @prop {any} unitId Unit ID
 * @prop {string} type Drawing type
 * @prop {DrawingPoint[]} points List of drawing points
 * @prop {number} zorder Drawing Z order
 * @prop {string} linkKey Drawing link key
 * @prop {Object} state Drawing state
 */
/**
 * Get a chart token from a layout ID and the user credentials if the layout is not public
 * @function getDrawings
 * @param {string} layout The layout ID found in the layout URL (Like: 'XXXXXXXX')
 * @param {string | ''} [symbol] Market filter (Like: 'BINANCE:BTCEUR')
 * @param {UserCredentials} [credentials] User credentials (id + session + [signature])
 * @param {number} [chartID] Chart ID
 * @returns {Promise<Drawing[]>} Drawings
 */
declare function getDrawings(layout: string, symbol?: string, credentials?: {
    /**
     * User ID
     */
    id: number;
    /**
     * User session ('sessionid' cookie)
     */
    session: string;
    /**
     * User session signature ('sessionid_sign' cookie)
     */
    signature?: string;
}, chartID?: number): Promise<{
    /**
     * Drawing ID (Like: 'XXXXXX')
     */
    id: string;
    /**
     * Layout market symbol (Like: 'BINANCE:BUCEUR')
     */
    symbol: string;
    /**
     * Owner user ID (Like: 'XXXXXX')
     */
    ownerSource: string;
    /**
     * Drawing last update timestamp
     */
    serverUpdateTime: string;
    /**
     * Currency ID (Like: 'EUR')
     */
    currencyId: string;
    /**
     * Unit ID
     */
    unitId: any;
    /**
     * Drawing type
     */
    type: string;
    /**
     * List of drawing points
     */
    points: {
        /**
         * Point X time position
         */
        time_t: number;
        /**
         * Point Y price position
         */
        price: number;
        /**
         * Point offset
         */
        offset: number;
    }[];
    /**
     * Drawing Z order
     */
    zorder: number;
    /**
     * Drawing link key
     */
    linkKey: string;
    /**
     * Drawing state
     */
    state: any;
}[]>;
export {};
