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
var axios = require('axios');
/**
 * @typedef {Object} AuthorizationUser
 * @prop {id} id User id
 * @prop {string} username User's username
 * @prop {string} userpic User's profile picture URL
 * @prop {string} expiration Authorization expiration date
 * @prop {string} created Authorization creation date
 */
/** @class */
var PinePermManager = /** @class */ (function () {
    /**
     * Creates a PinePermManager instance
     * @param {string} sessionId Token from `sessionid` cookie
     * @param {string} signature Signature cookie
     * @param {string} pineId Indicator ID (Like: PUB;XXXXXXXXXXXXXXXXXXXXX)
     */
    function PinePermManager(sessionId, signature, pineId) {
        if (!sessionId)
            throw new Error('Please provide a SessionID');
        if (!signature)
            throw new Error('Please provide a Signature');
        if (!pineId)
            throw new Error('Please provide a PineID');
        this.sessionId = sessionId;
        this.signature = signature;
        this.pineId = pineId;
    }
    /**
     * Get list of authorized users
     * @param {number} limit Fetching limit
     * @param {'user__username'
     * | '-user__username'
     * | 'created' | 'created'
     * | 'expiration,user__username'
     * | '-expiration,user__username'
     * } order Fetching order
     * @returns {AuthorizationUser[]}
     */
    PinePermManager.prototype.getUsers = function (limit, order) {
        if (limit === void 0) { limit = 10; }
        if (order === void 0) { order = '-created'; }
        return __awaiter(this, void 0, void 0, function () {
            var data, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.post("https://www.tradingview.com/pine_perm/list_users/?limit=".concat(limit, "&order_by=").concat(order), "pine_id=".concat(this.pineId.replace(/;/g, '%3B')), {
                                headers: {
                                    origin: 'https://www.tradingview.com',
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    cookie: "sessionid=".concat(this.sessionId, ";sessionid_sign=").concat(this.signature, ";"),
                                },
                            })];
                    case 1:
                        data = (_a.sent()).data;
                        return [2 /*return*/, data.results];
                    case 2:
                        e_1 = _a.sent();
                        throw new Error(e_1.response.data.detail || 'Wrong credentials or pineId');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Adds an user to the authorized list
     * @param {string} username User's username
     * @param {Date} [expiration] Expiration date
     * @returns {'ok' | 'exists' | null}
     */
    PinePermManager.prototype.addUser = function (username, expiration) {
        if (expiration === void 0) { expiration = null; }
        return __awaiter(this, void 0, void 0, function () {
            var data, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.post('https://www.tradingview.com/pine_perm/add/', "pine_id=".concat(this.pineId.replace(/;/g, '%3B'), "&username_recip=").concat(username).concat(expiration && expiration instanceof Date
                                ? "&expiration=".concat(expiration.toISOString())
                                : ''), {
                                headers: {
                                    origin: 'https://www.tradingview.com',
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    cookie: "sessionid=".concat(this.sessionId, ";sessionid_sign=").concat(this.signature, ";"),
                                },
                            })];
                    case 1:
                        data = (_a.sent()).data;
                        return [2 /*return*/, data.status];
                    case 2:
                        e_2 = _a.sent();
                        throw new Error(e_2.response.data.detail || 'Wrong credentials or pineId');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Modify an authorization expiration date
     * @param {string} username User's username
     * @param {Date} [expiration] New expiration date
     * @returns {'ok' | null}
     */
    PinePermManager.prototype.modifyExpiration = function (username, expiration) {
        if (expiration === void 0) { expiration = null; }
        return __awaiter(this, void 0, void 0, function () {
            var data, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.post('https://www.tradingview.com/pine_perm/modify_user_expiration/', "pine_id=".concat(this.pineId.replace(/;/g, '%3B'), "&username_recip=").concat(username).concat(expiration && expiration instanceof Date
                                ? "&expiration=".concat(expiration.toISOString())
                                : ''), {
                                headers: {
                                    origin: 'https://www.tradingview.com',
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    cookie: "sessionid=".concat(this.sessionId, ";sessionid_sign=").concat(this.signature, ";"),
                                },
                            })];
                    case 1:
                        data = (_a.sent()).data;
                        return [2 /*return*/, data.status];
                    case 2:
                        e_3 = _a.sent();
                        throw new Error(e_3.response.data.detail || 'Wrong credentials or pineId');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Removes an user to the authorized list
     * @param {string} username User's username
     * @returns {'ok' | null}
     */
    PinePermManager.prototype.removeUser = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var data, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.post('https://www.tradingview.com/pine_perm/remove/', "pine_id=".concat(this.pineId.replace(/;/g, '%3B'), "&username_recip=").concat(username), {
                                headers: {
                                    origin: 'https://www.tradingview.com',
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    cookie: "sessionid=".concat(this.sessionId, ";sessionid_sign=").concat(this.signature, ";"),
                                },
                            })];
                    case 1:
                        data = (_a.sent()).data;
                        return [2 /*return*/, data.status];
                    case 2:
                        e_4 = _a.sent();
                        throw new Error(e_4.response.data.detail || 'Wrong credentials or pineId');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return PinePermManager;
}());
module.exports = PinePermManager;
