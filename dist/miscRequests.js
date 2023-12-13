var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var os = require('os');
var axios = require('axios');
var PineIndicator = require('./classes/PineIndicator');
var validateStatus = function (status) { return status < 500; };
var indicators = ['Recommend.Other', 'Recommend.All', 'Recommend.MA'];
var builtInIndicList = [];
function fetchScanData(tickers, type, columns) {
    if (tickers === void 0) { tickers = []; }
    if (type === void 0) { type = ''; }
    if (columns === void 0) { columns = []; }
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios.post("https://scanner.tradingview.com/".concat(type, "/scan"), {
                        symbols: { tickers: tickers },
                        columns: columns,
                    }, { validateStatus: validateStatus })];
                case 1:
                    data = (_a.sent()).data;
                    return [2 /*return*/, data];
            }
        });
    });
}
/** @typedef {number} advice */
/**
 * @typedef {{
 *   Other: advice,
 *   All: advice,
 *   MA: advice
 * }} Period
 */
/**
 * @typedef {{
 *  '1': Period,
 *  '5': Period,
 *  '15': Period,
 *  '60': Period,
 *  '240': Period,
 *  '1D': Period,
 *  '1W': Period,
 *  '1M': Period
 * }} Periods
 */
// /**
//  * @typedef {string | 'forex' | 'crypto'
//  * | 'america' | 'australia' | 'canada' | 'egypt'
//  * | 'germany' | 'india' | 'israel' | 'italy'
//  * | 'luxembourg' | 'poland' | 'sweden' | 'turkey'
//  * | 'uk' | 'vietnam'} Screener
//  * You can use `getScreener(exchange)` function for non-forex and non-crypto markets.
//  */
module.exports = {
    // /**
    //  * Get a screener from an exchange
    //  * @function getScreener
    //  * @param {string} exchange Example: BINANCE, EURONEXT, NASDAQ
    //  * @returns {Screener}
    // */
    // getScreener(exchange) {
    //   const e = exchange.toUpperCase();
    //   if (['NASDAQ', 'NYSE', 'NYSE ARCA', 'OTC'].includes(e)) return 'america';
    //   if (['ASX'].includes(e)) return 'australia';
    //   if (['TSX', 'TSXV', 'CSE', 'NEO'].includes(e)) return 'canada';
    //   if (['EGX'].includes(e)) return 'egypt';
    //   if (['FWB', 'SWB', 'XETR'].includes(e)) return 'germany';
    //   if (['BSE', 'NSE'].includes(e)) return 'india';
    //   if (['TASE'].includes(e)) return 'israel';
    //   if (['MIL', 'MILSEDEX'].includes(e)) return 'italy';
    //   if (['LUXSE'].includes(e)) return 'luxembourg';
    //   if (['NEWCONNECT'].includes(e)) return 'poland';
    //   if (['NGM'].includes(e)) return 'sweden';
    //   if (['BIST'].includes(e)) return 'turkey';
    //   if (['LSE', 'LSIN'].includes(e)) return 'uk';
    //   if (['HNX'].includes(e)) return 'vietnam';
    //   return 'global';
    // },
    /**
     * Get technical analysis
     * @function getTA
     * @param {Screener} screener Market screener
     * @param {string} id Full market id (Example: COINBASE:BTCEUR)
     * @returns {Promise<Periods>} results
     */
    getTA: function (screener, id) {
        return __awaiter(this, void 0, void 0, function () {
            var advice, cols, rs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        advice = {};
                        cols = ['1', '5', '15', '60', '240', '1D', '1W', '1M']
                            .map(function (t) { return indicators.map(function (i) { return (t !== '1D' ? "".concat(i, "|").concat(t) : i); }); })
                            .flat();
                        return [4 /*yield*/, fetchScanData([id], screener, cols)];
                    case 1:
                        rs = _a.sent();
                        if (!rs.data || !rs.data[0])
                            return [2 /*return*/, false];
                        rs.data[0].d.forEach(function (val, i) {
                            var _a = cols[i].split('|'), name = _a[0], period = _a[1];
                            var pName = period || '1D';
                            if (!advice[pName])
                                advice[pName] = {};
                            advice[pName][name.split('.').pop()] = Math.round(val * 1000) / 500;
                        });
                        return [2 /*return*/, advice];
                }
            });
        });
    },
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
    searchMarket: function (search, filter) {
        if (filter === void 0) { filter = ''; }
        return __awaiter(this, void 0, void 0, function () {
            var data;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios.get("https://symbol-search.tradingview.com/symbol_search/?text=".concat(search.replace(/ /g, '%20'), "&type=").concat(filter), {
                            validateStatus: validateStatus,
                            headers: {
                                origin: 'https://www.tradingview.com',
                            },
                        })];
                    case 1:
                        data = (_a.sent()).data;
                        return [2 /*return*/, data.map(function (s) {
                                var exchange = s.exchange.split(' ')[0];
                                var id = "".concat(exchange, ":").concat(s.symbol);
                                // const screener = (['forex', 'crypto'].includes(s.type)
                                //   ? s.type
                                //   : this.getScreener(exchange)
                                // );
                                var screener = 'global';
                                return {
                                    id: id,
                                    exchange: exchange,
                                    fullExchange: s.exchange,
                                    screener: screener,
                                    symbol: s.symbol,
                                    description: s.description,
                                    type: s.type,
                                    getTA: function () { return _this.getTA(screener, id); },
                                };
                            })];
                }
            });
        });
    },
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
    searchIndicator: function (search) {
        if (search === void 0) { search = ''; }
        return __awaiter(this, void 0, void 0, function () {
            function norm(str) {
                if (str === void 0) { str = ''; }
                return str.toUpperCase().replace(/[^A-Z]/g, '');
            }
            var data;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!builtInIndicList.length) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(['standard', 'candlestick', 'fundamental'].map(function (type) { return __awaiter(_this, void 0, void 0, function () {
                                var data;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, axios.get("https://pine-facade.tradingview.com/pine-facade/list/?filter=".concat(type), { validateStatus: validateStatus })];
                                        case 1:
                                            data = (_a.sent()).data;
                                            builtInIndicList.push.apply(builtInIndicList, data);
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, axios.get("https://www.tradingview.com/pubscripts-suggest-json/?search=".concat(search.replace(/ /g, '%20')), { validateStatus: validateStatus })];
                    case 3:
                        data = (_a.sent()).data;
                        return [2 /*return*/, __spreadArray(__spreadArray([], builtInIndicList.filter(function (i) { return (norm(i.scriptName).includes(norm(search))
                                || norm(i.extra.shortDescription).includes(norm(search))); }).map(function (ind) { return ({
                                id: ind.scriptIdPart,
                                version: ind.version,
                                name: ind.scriptName,
                                author: {
                                    id: ind.userId,
                                    username: '@TRADINGVIEW@',
                                },
                                image: '',
                                access: 'closed_source',
                                source: '',
                                type: (ind.extra && ind.extra.kind) ? ind.extra.kind : 'study',
                                get: function () {
                                    return module.exports.getIndicator(ind.scriptIdPart, ind.version);
                                },
                            }); }), true), data.results.map(function (ind) { return ({
                                id: ind.scriptIdPart,
                                version: ind.version,
                                name: ind.scriptName,
                                author: {
                                    id: ind.author.id,
                                    username: ind.author.username,
                                },
                                image: ind.imageUrl,
                                access: ['open_source', 'closed_source', 'invite_only'][ind.access - 1] || 'other',
                                source: ind.scriptSource,
                                type: (ind.extra && ind.extra.kind) ? ind.extra.kind : 'study',
                                get: function () {
                                    return module.exports.getIndicator(ind.scriptIdPart, ind.version);
                                },
                            }); }), true)];
                }
            });
        });
    },
    /**
     * Get an indicator
     * @function getIndicator
     * @param {string} id Indicator ID (Like: PUB;XXXXXXXXXXXXXXXXXXXXX)
     * @param {'last' | string} [version] Wanted version of the indicator
     * @returns {Promise<PineIndicator>} Indicator
     */
    getIndicator: function (id, version) {
        if (version === void 0) { version = 'last'; }
        return __awaiter(this, void 0, void 0, function () {
            var indicID, data, inputs, plots;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        indicID = id.replace(/ |%/g, '%25');
                        return [4 /*yield*/, axios.get("https://pine-facade.tradingview.com/pine-facade/translate/".concat(indicID, "/").concat(version), { validateStatus: validateStatus })];
                    case 1:
                        data = (_a.sent()).data;
                        if (!data.success || !data.result.metaInfo || !data.result.metaInfo.inputs) {
                            throw new Error("Inexistent or unsupported indicator: \"".concat(data.reason, "\""));
                        }
                        inputs = {};
                        data.result.metaInfo.inputs.forEach(function (input) {
                            if (['text', 'pineId', 'pineVersion'].includes(input.id))
                                return;
                            var inlineName = input.name.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '');
                            inputs[input.id] = {
                                name: input.name,
                                inline: input.inline || inlineName,
                                internalID: input.internalID || inlineName,
                                tooltip: input.tooltip,
                                type: input.type,
                                value: input.defval,
                                isHidden: !!input.isHidden,
                                isFake: !!input.isFake,
                            };
                            if (input.options)
                                inputs[input.id].options = input.options;
                        });
                        plots = {};
                        Object.keys(data.result.metaInfo.styles).forEach(function (plotId) {
                            var plotTitle = data
                                .result
                                .metaInfo
                                .styles[plotId]
                                .title
                                .replace(/ /g, '_')
                                .replace(/[^a-zA-Z0-9_]/g, '');
                            var titles = Object.values(plots);
                            if (titles.includes(plotTitle)) {
                                var i = 2;
                                while (titles.includes("".concat(plotTitle, "_").concat(i)))
                                    i += 1;
                                plots[plotId] = "".concat(plotTitle, "_").concat(i);
                            }
                            else
                                plots[plotId] = plotTitle;
                        });
                        data.result.metaInfo.plots.forEach(function (plot) {
                            var _a;
                            if (!plot.target)
                                return;
                            plots[plot.id] = "".concat((_a = plots[plot.target]) !== null && _a !== void 0 ? _a : plot.target, "_").concat(plot.type);
                        });
                        return [2 /*return*/, new PineIndicator({
                                pineId: data.result.metaInfo.scriptIdPart || indicID,
                                pineVersion: data.result.metaInfo.pine.version || version,
                                description: data.result.metaInfo.description,
                                shortDescription: data.result.metaInfo.shortDescription,
                                inputs: inputs,
                                plots: plots,
                                script: data.result.ilTemplate,
                            })];
                }
            });
        });
    },
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
    loginUser: function (username, password, remember, UA) {
        var _a, _b;
        if (remember === void 0) { remember = true; }
        if (UA === void 0) { UA = 'TWAPI/3.0'; }
        return __awaiter(this, void 0, void 0, function () {
            var _c, data, headers, cookies, sessionCookie, session, signCookie, signature;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, axios.post('https://www.tradingview.com/accounts/signin/', "username=".concat(username, "&password=").concat(password).concat(remember ? '&remember=on' : ''), {
                            validateStatus: validateStatus,
                            headers: {
                                referer: 'https://www.tradingview.com',
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'User-agent': "".concat(UA, " (").concat(os.version(), "; ").concat(os.platform(), "; ").concat(os.arch(), ")"),
                            },
                        })];
                    case 1:
                        _c = _d.sent(), data = _c.data, headers = _c.headers;
                        cookies = headers['set-cookie'];
                        if (data.error)
                            throw new Error(data.error);
                        sessionCookie = cookies.find(function (c) { return c.includes('sessionid='); });
                        session = ((_a = sessionCookie.match(/sessionid=(.*?);/)) !== null && _a !== void 0 ? _a : [])[1];
                        signCookie = cookies.find(function (c) { return c.includes('sessionid_sign='); });
                        signature = ((_b = signCookie.match(/sessionid_sign=(.*?);/)) !== null && _b !== void 0 ? _b : [])[1];
                        return [2 /*return*/, {
                                id: data.user.id,
                                username: data.user.username,
                                firstName: data.user.first_name,
                                lastName: data.user.last_name,
                                reputation: data.user.reputation,
                                following: data.user.following,
                                followers: data.user.followers,
                                notifications: data.user.notification_count,
                                session: session,
                                signature: signature,
                                sessionHash: data.user.session_hash,
                                privateChannel: data.user.private_channel,
                                authToken: data.user.auth_token,
                                joinDate: new Date(data.user.date_joined),
                            }];
                }
            });
        });
    },
    /**
     * Get user from 'sessionid' cookie
     * @function getUser
     * @param {string} session User 'sessionid' cookie
     * @param {string} [signature] User 'sessionid_sign' cookie
     * @param {string} [location] Auth page location (For france: https://fr.tradingview.com/)
     * @returns {Promise<User>} Token
     */
    getUser: function (session, signature, location) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        if (signature === void 0) { signature = ''; }
        if (location === void 0) { location = 'https://www.tradingview.com/'; }
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_p) {
                switch (_p.label) {
                    case 0: return [4 /*yield*/, axios.get(location, {
                            validateStatus: validateStatus,
                            headers: {
                                cookie: "sessionid=".concat(session).concat(signature ? ";sessionid_sign=".concat(signature, ";") : ''),
                            },
                        })];
                    case 1:
                        data = (_p.sent()).data;
                        if (data.includes('auth_token')) {
                            return [2 /*return*/, {
                                    id: (_a = /"id":([0-9]{1,10}),/.exec(data)) === null || _a === void 0 ? void 0 : _a[1],
                                    username: (_b = /"username":"(.*?)"/.exec(data)) === null || _b === void 0 ? void 0 : _b[1],
                                    firstName: (_c = /"first_name":"(.*?)"/.exec(data)) === null || _c === void 0 ? void 0 : _c[1],
                                    lastName: (_d = /"last_name":"(.*?)"/.exec(data)) === null || _d === void 0 ? void 0 : _d[1],
                                    reputation: parseFloat(((_e = /"reputation":(.*?),/.exec(data)) === null || _e === void 0 ? void 0 : _e[1]) || 0),
                                    following: parseFloat(((_f = /,"following":([0-9]*?),/.exec(data)) === null || _f === void 0 ? void 0 : _f[1]) || 0),
                                    followers: parseFloat(((_g = /,"followers":([0-9]*?),/.exec(data)) === null || _g === void 0 ? void 0 : _g[1]) || 0),
                                    notifications: {
                                        following: parseFloat(((_h = /"notification_count":\{"following":([0-9]*),/.exec(data)) === null || _h === void 0 ? void 0 : _h[1]) || 0),
                                        user: parseFloat(((_j = /"notification_count":\{"following":[0-9]*,"user":([0-9]*)/.exec(data)) === null || _j === void 0 ? void 0 : _j[1]) || 0),
                                    },
                                    session: session,
                                    signature: signature,
                                    sessionHash: (_k = /"session_hash":"(.*?)"/.exec(data)) === null || _k === void 0 ? void 0 : _k[1],
                                    privateChannel: (_l = /"private_channel":"(.*?)"/.exec(data)) === null || _l === void 0 ? void 0 : _l[1],
                                    authToken: (_m = /"auth_token":"(.*?)"/.exec(data)) === null || _m === void 0 ? void 0 : _m[1],
                                    joinDate: new Date(((_o = /"date_joined":"(.*?)"/.exec(data)) === null || _o === void 0 ? void 0 : _o[1]) || 0),
                                }];
                        }
                        throw new Error('Wrong or expired sessionid/signature');
                }
            });
        });
    },
    /**
     * Get user's private indicators from a 'sessionid' cookie
     * @function getPrivateIndicators
     * @param {string} session User 'sessionid' cookie
     * @param {string} [signature] User 'sessionid_sign' cookie
     * @returns {Promise<SearchIndicatorResult[]>} Search results
     */
    getPrivateIndicators: function (session, signature) {
        if (signature === void 0) { signature = ''; }
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios.get('https://pine-facade.tradingview.com/pine-facade/list?filter=saved', {
                            validateStatus: validateStatus,
                            headers: {
                                cookie: "sessionid=".concat(session).concat(signature ? ";sessionid_sign=".concat(signature, ";") : ''),
                            },
                        })];
                    case 1:
                        data = (_a.sent()).data;
                        return [2 /*return*/, data.map(function (ind) { return ({
                                id: ind.scriptIdPart,
                                version: ind.version,
                                name: ind.scriptName,
                                author: {
                                    id: -1,
                                    username: '@ME@',
                                },
                                image: ind.imageUrl,
                                access: 'private',
                                source: ind.scriptSource,
                                type: (ind.extra && ind.extra.kind) ? ind.extra.kind : 'study',
                                get: function () {
                                    return module.exports.getIndicator(ind.scriptIdPart, ind.version);
                                },
                            }); })];
                }
            });
        });
    },
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
    getChartToken: function (layout, credentials) {
        if (credentials === void 0) { credentials = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, id, session, signature, data;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (credentials.id && credentials.session
                            ? credentials
                            : { id: -1, session: null, signature: null }), id = _a.id, session = _a.session, signature = _a.signature;
                        return [4 /*yield*/, axios.get("https://www.tradingview.com/chart-token/?image_url=".concat(layout, "&user_id=").concat(id), {
                                validateStatus: validateStatus,
                                headers: {
                                    cookie: session
                                        ? "sessionid=".concat(session).concat(signature ? ";sessionid_sign=".concat(signature, ";") : '')
                                        : '',
                                },
                            })];
                    case 1:
                        data = (_b.sent()).data;
                        if (!data.token)
                            throw new Error('Wrong layout or credentials');
                        return [2 /*return*/, data.token];
                }
            });
        });
    },
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
    getDrawings: function (layout, symbol, credentials, chartID) {
        if (symbol === void 0) { symbol = ''; }
        if (credentials === void 0) { credentials = {}; }
        if (chartID === void 0) { chartID = '_shared'; }
        return __awaiter(this, void 0, void 0, function () {
            var chartToken, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, module.exports.getChartToken(layout, credentials)];
                    case 1:
                        chartToken = _a.sent();
                        return [4 /*yield*/, axios.get("https://charts-storage.tradingview.com/charts-storage/get/layout/".concat(layout, "/sources?chart_id=").concat(chartID, "&jwt=").concat(chartToken).concat((symbol ? "&symbol=".concat(symbol) : '')), { validateStatus: validateStatus })];
                    case 2:
                        data = (_a.sent()).data;
                        if (!data.payload)
                            throw new Error('Wrong layout, user credentials, or chart id.');
                        return [2 /*return*/, Object.values(data.payload.sources || {}).map(function (drawing) { return (__assign(__assign({}, drawing), drawing.state)); })];
                }
            });
        });
    },
};
