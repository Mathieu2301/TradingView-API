/**
 * @typedef {'loaded' | 'data' | 'error'} MarketEvent
 */
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
/**
 * @param {import('./session').QuoteSessionBridge} quoteSession
 */
module.exports = function (quoteSession) { var _QuoteMarket_instances, _QuoteMarket_symbolListeners, _QuoteMarket_symbol, _QuoteMarket_session, _QuoteMarket_symbolKey, _QuoteMarket_symbolListenerID, _QuoteMarket_lastData, _QuoteMarket_callbacks, _QuoteMarket_handleEvent, _QuoteMarket_handleError, _a; return _a = /** @class */ (function () {
        /**
         * @param {string} symbol Market symbol (like: 'BTCEUR' or 'KRAKEN:BTCEUR')
         * @param {string} session Market session (like: 'regular' or 'extended')
         */
        function QuoteMarket(symbol, session) {
            if (session === void 0) { session = 'regular'; }
            var _this = this;
            _QuoteMarket_instances.add(this);
            _QuoteMarket_symbolListeners.set(this, quoteSession.symbolListeners);
            _QuoteMarket_symbol.set(this, void 0);
            _QuoteMarket_session.set(this, void 0);
            _QuoteMarket_symbolKey.set(this, void 0);
            _QuoteMarket_symbolListenerID.set(this, 0);
            _QuoteMarket_lastData.set(this, {});
            _QuoteMarket_callbacks.set(this, {
                loaded: [],
                data: [],
                event: [],
                error: [],
            });
            __classPrivateFieldSet(this, _QuoteMarket_symbol, symbol, "f");
            __classPrivateFieldSet(this, _QuoteMarket_session, session, "f");
            __classPrivateFieldSet(this, _QuoteMarket_symbolKey, "=".concat(JSON.stringify({ session: session, symbol: symbol })), "f");
            if (!__classPrivateFieldGet(this, _QuoteMarket_symbolListeners, "f")[__classPrivateFieldGet(this, _QuoteMarket_symbolKey, "f")]) {
                __classPrivateFieldGet(this, _QuoteMarket_symbolListeners, "f")[__classPrivateFieldGet(this, _QuoteMarket_symbolKey, "f")] = [];
                quoteSession.send('quote_add_symbols', [
                    quoteSession.sessionID,
                    __classPrivateFieldGet(this, _QuoteMarket_symbolKey, "f"),
                ]);
            }
            __classPrivateFieldSet(this, _QuoteMarket_symbolListenerID, __classPrivateFieldGet(this, _QuoteMarket_symbolListeners, "f")[__classPrivateFieldGet(this, _QuoteMarket_symbolKey, "f")].length, "f");
            __classPrivateFieldGet(this, _QuoteMarket_symbolListeners, "f")[__classPrivateFieldGet(this, _QuoteMarket_symbolKey, "f")][__classPrivateFieldGet(this, _QuoteMarket_symbolListenerID, "f")] = function (packet) {
                if (global.TW_DEBUG)
                    console.log('§90§30§105 MARKET §0 DATA', packet);
                if (packet.type === 'qsd' && packet.data[1].s === 'ok') {
                    __classPrivateFieldSet(_this, _QuoteMarket_lastData, __assign(__assign({}, __classPrivateFieldGet(_this, _QuoteMarket_lastData, "f")), packet.data[1].v), "f");
                    __classPrivateFieldGet(_this, _QuoteMarket_instances, "m", _QuoteMarket_handleEvent).call(_this, 'data', __classPrivateFieldGet(_this, _QuoteMarket_lastData, "f"));
                    return;
                }
                if (packet.type === 'quote_completed') {
                    __classPrivateFieldGet(_this, _QuoteMarket_instances, "m", _QuoteMarket_handleEvent).call(_this, 'loaded');
                    return;
                }
                if (packet.type === 'qsd' && packet.data[1].s === 'error') {
                    __classPrivateFieldGet(_this, _QuoteMarket_instances, "m", _QuoteMarket_handleError).call(_this, 'Market error', packet.data);
                }
            };
        }
        /**
         * When quote market is loaded
         * @param {() => void} cb Callback
         * @event
         */
        QuoteMarket.prototype.onLoaded = function (cb) {
            __classPrivateFieldGet(this, _QuoteMarket_callbacks, "f").loaded.push(cb);
        };
        /**
         * When quote data is received
         * @param {(data: {}) => void} cb Callback
         * @event
         */
        QuoteMarket.prototype.onData = function (cb) {
            __classPrivateFieldGet(this, _QuoteMarket_callbacks, "f").data.push(cb);
        };
        /**
         * When quote event happens
         * @param {(...any) => void} cb Callback
         * @event
         */
        QuoteMarket.prototype.onEvent = function (cb) {
            __classPrivateFieldGet(this, _QuoteMarket_callbacks, "f").event.push(cb);
        };
        /**
         * When quote error happens
         * @param {(...any) => void} cb Callback
         * @event
         */
        QuoteMarket.prototype.onError = function (cb) {
            __classPrivateFieldGet(this, _QuoteMarket_callbacks, "f").error.push(cb);
        };
        /** Close this listener */
        QuoteMarket.prototype.close = function () {
            if (__classPrivateFieldGet(this, _QuoteMarket_symbolListeners, "f")[__classPrivateFieldGet(this, _QuoteMarket_symbolKey, "f")].length <= 1) {
                quoteSession.send('quote_remove_symbols', [
                    quoteSession.sessionID,
                    __classPrivateFieldGet(this, _QuoteMarket_symbolKey, "f"),
                ]);
            }
            delete __classPrivateFieldGet(this, _QuoteMarket_symbolListeners, "f")[__classPrivateFieldGet(this, _QuoteMarket_symbolKey, "f")][__classPrivateFieldGet(this, _QuoteMarket_symbolListenerID, "f")];
        };
        return QuoteMarket;
    }()),
    _QuoteMarket_symbolListeners = new WeakMap(),
    _QuoteMarket_symbol = new WeakMap(),
    _QuoteMarket_session = new WeakMap(),
    _QuoteMarket_symbolKey = new WeakMap(),
    _QuoteMarket_symbolListenerID = new WeakMap(),
    _QuoteMarket_lastData = new WeakMap(),
    _QuoteMarket_callbacks = new WeakMap(),
    _QuoteMarket_instances = new WeakSet(),
    _QuoteMarket_handleEvent = function _QuoteMarket_handleEvent(ev) {
        var data = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            data[_i - 1] = arguments[_i];
        }
        __classPrivateFieldGet(this, _QuoteMarket_callbacks, "f")[ev].forEach(function (e) { return e.apply(void 0, data); });
        __classPrivateFieldGet(this, _QuoteMarket_callbacks, "f").event.forEach(function (e) { return e.apply(void 0, __spreadArray([ev], data, false)); });
    },
    _QuoteMarket_handleError = function _QuoteMarket_handleError() {
        var _a;
        var msgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            msgs[_i] = arguments[_i];
        }
        if (__classPrivateFieldGet(this, _QuoteMarket_callbacks, "f").error.length === 0)
            console.error.apply(console, msgs);
        else
            (_a = __classPrivateFieldGet(this, _QuoteMarket_instances, "m", _QuoteMarket_handleEvent)).call.apply(_a, __spreadArray([this, 'error'], msgs, false));
    },
    _a; };
