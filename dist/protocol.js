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
var JSZip = require('jszip');
/**
 * @typedef {Object} TWPacket
 * @prop {string} [m] Packet type
 * @prop {[session: string, {}]} [p] Packet data
 */
var cleanerRgx = /~h~/g;
var splitterRgx = /~m~[0-9]{1,}~m~/g;
module.exports = {
    /**
     * Parse websocket packet
     * @function parseWSPacket
     * @param {string} str Websocket raw data
     * @returns {TWPacket[]} TradingView packets
     */
    parseWSPacket: function (str) {
        return str.replace(cleanerRgx, '').split(splitterRgx)
            .map(function (p) {
            if (!p)
                return false;
            try {
                return JSON.parse(p);
            }
            catch (error) {
                console.warn('Cant parse', p);
                return false;
            }
        })
            .filter(function (p) { return p; });
    },
    /**
     * Format websocket packet
     * @function formatWSPacket
     * @param {TWPacket} packet TradingView packet
     * @returns {string} Websocket raw data
     */
    formatWSPacket: function (packet) {
        var msg = typeof packet === 'object'
            ? JSON.stringify(packet)
            : packet;
        return "~m~".concat(msg.length, "~m~").concat(msg);
    },
    /**
     * Parse compressed data
     * @function parseCompressed
     * @param {string} data Compressed data
     * @returns {Promise<{}>} Parsed data
     */
    parseCompressed: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var zip, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        zip = new JSZip();
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, zip.loadAsync(data, { base64: true })];
                    case 1: return [4 /*yield*/, (_c.sent()).file('').async('text')];
                    case 2: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
                }
            });
        });
    },
};
