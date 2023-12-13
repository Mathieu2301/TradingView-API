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
var _Client_instances, _Client_ws, _Client_logged, _Client_sessions, _Client_callbacks, _Client_handleEvent, _Client_handleError, _Client_parsePacket, _Client_sendQueue, _Client_clientBridge, _a;
var WebSocket = require('ws');
var misc = require('./miscRequests');
var protocol = require('./protocol');
var quoteSessionGenerator = require('./quote/session');
var chartSessionGenerator = require('./chart/session');
/**
 * @typedef {Object} Session
 * @prop {'quote' | 'chart' | 'replay'} type Session type
 * @prop {(data: {}) => null} onData When there is a data
 */
/** @typedef {Object<string, Session>} SessionList Session list */
/**
 * @callback SendPacket Send a custom packet
 * @param {string} t Packet type
 * @param {string[]} p Packet data
 * @returns {void}
*/
/**
 * @typedef {Object} ClientBridge
 * @prop {SessionList} sessions
 * @prop {SendPacket} send
 */
/**
 * @typedef { 'connected' | 'disconnected'
 *  | 'logged' | 'ping' | 'data'
 *  | 'error' | 'event'
 * } ClientEvent
 */
/** @class */
module.exports = (_a = /** @class */ (function () {
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
        function Client(clientOptions) {
            if (clientOptions === void 0) { clientOptions = {}; }
            var _this = this;
            _Client_instances.add(this);
            _Client_ws.set(this, void 0);
            _Client_logged.set(this, false);
            /** @type {SessionList} */
            _Client_sessions.set(this, {});
            _Client_callbacks.set(this, {
                connected: [],
                disconnected: [],
                logged: [],
                ping: [],
                data: [],
                error: [],
                event: [],
            });
            _Client_sendQueue.set(this, []);
            /** @type {ClientBridge} */
            _Client_clientBridge.set(this, {
                sessions: __classPrivateFieldGet(this, _Client_sessions, "f"),
                send: function (t, p) { return _this.send(t, p); },
            });
            /** @namespace Session */
            this.Session = {
                Quote: quoteSessionGenerator(__classPrivateFieldGet(this, _Client_clientBridge, "f")),
                Chart: chartSessionGenerator(__classPrivateFieldGet(this, _Client_clientBridge, "f")),
            };
            if (clientOptions.DEBUG)
                global.TW_DEBUG = clientOptions.DEBUG;
            var server = clientOptions.server || 'data';
            __classPrivateFieldSet(this, _Client_ws, new WebSocket("wss://".concat(server, ".tradingview.com/socket.io/websocket?&type=chart"), {
                origin: 'https://s.tradingview.com',
            }), "f");
            if (clientOptions.token) {
                misc.getUser(clientOptions.token, clientOptions.signature ? clientOptions.signature : '').then(function (user) {
                    __classPrivateFieldGet(_this, _Client_sendQueue, "f").unshift(protocol.formatWSPacket({
                        m: 'set_auth_token',
                        p: [user.authToken],
                    }));
                    __classPrivateFieldSet(_this, _Client_logged, true, "f");
                    _this.sendQueue();
                }).catch(function (err) {
                    __classPrivateFieldGet(_this, _Client_instances, "m", _Client_handleError).call(_this, 'Credentials error:', err.message);
                });
            }
            else {
                __classPrivateFieldGet(this, _Client_sendQueue, "f").unshift(protocol.formatWSPacket({
                    m: 'set_auth_token',
                    p: ['unauthorized_user_token'],
                }));
                __classPrivateFieldSet(this, _Client_logged, true, "f");
                this.sendQueue();
            }
            __classPrivateFieldGet(this, _Client_ws, "f").on('open', function () {
                __classPrivateFieldGet(_this, _Client_instances, "m", _Client_handleEvent).call(_this, 'connected');
                _this.sendQueue();
            });
            __classPrivateFieldGet(this, _Client_ws, "f").on('close', function () {
                __classPrivateFieldSet(_this, _Client_logged, false, "f");
                __classPrivateFieldGet(_this, _Client_instances, "m", _Client_handleEvent).call(_this, 'disconnected');
            });
            __classPrivateFieldGet(this, _Client_ws, "f").on('message', function (data) { return __classPrivateFieldGet(_this, _Client_instances, "m", _Client_parsePacket).call(_this, data); });
        }
        Object.defineProperty(Client.prototype, "isLogged", {
            /** If the client is logged in */
            get: function () {
                return __classPrivateFieldGet(this, _Client_logged, "f");
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Client.prototype, "isOpen", {
            /** If the cient was closed */
            get: function () {
                return __classPrivateFieldGet(this, _Client_ws, "f").readyState === __classPrivateFieldGet(this, _Client_ws, "f").OPEN;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * When client is connected
         * @param {() => void} cb Callback
         * @event onConnected
         */
        Client.prototype.onConnected = function (cb) {
            __classPrivateFieldGet(this, _Client_callbacks, "f").connected.push(cb);
        };
        /**
         * When client is disconnected
         * @param {() => void} cb Callback
         * @event onDisconnected
         */
        Client.prototype.onDisconnected = function (cb) {
            __classPrivateFieldGet(this, _Client_callbacks, "f").disconnected.push(cb);
        };
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
        Client.prototype.onLogged = function (cb) {
            __classPrivateFieldGet(this, _Client_callbacks, "f").logged.push(cb);
        };
        /**
         * When server is pinging the client
         * @param {(i: number) => void} cb Callback
         * @event onPing
         */
        Client.prototype.onPing = function (cb) {
            __classPrivateFieldGet(this, _Client_callbacks, "f").ping.push(cb);
        };
        /**
         * When unparsed data is received
         * @param {(...{}) => void} cb Callback
         * @event onData
         */
        Client.prototype.onData = function (cb) {
            __classPrivateFieldGet(this, _Client_callbacks, "f").data.push(cb);
        };
        /**
         * When a client error happens
         * @param {(...{}) => void} cb Callback
         * @event onError
         */
        Client.prototype.onError = function (cb) {
            __classPrivateFieldGet(this, _Client_callbacks, "f").error.push(cb);
        };
        /**
         * When a client event happens
         * @param {(...{}) => void} cb Callback
         * @event onEvent
         */
        Client.prototype.onEvent = function (cb) {
            __classPrivateFieldGet(this, _Client_callbacks, "f").event.push(cb);
        };
        /** @type {SendPacket} Send a custom packet */
        Client.prototype.send = function (t, p) {
            if (p === void 0) { p = []; }
            __classPrivateFieldGet(this, _Client_sendQueue, "f").push(protocol.formatWSPacket({ m: t, p: p }));
            this.sendQueue();
        };
        /** Send all waiting packets */
        Client.prototype.sendQueue = function () {
            while (this.isOpen && __classPrivateFieldGet(this, _Client_logged, "f") && __classPrivateFieldGet(this, _Client_sendQueue, "f").length > 0) {
                var packet = __classPrivateFieldGet(this, _Client_sendQueue, "f").shift();
                __classPrivateFieldGet(this, _Client_ws, "f").send(packet);
                if (global.TW_DEBUG)
                    console.log('§90§30§107 > §0', packet);
            }
        };
        /**
         * Close the websocket connection
         * @return {Promise<void>} When websocket is closed
         */
        Client.prototype.end = function () {
            var _this = this;
            return new Promise(function (cb) {
                if (__classPrivateFieldGet(_this, _Client_ws, "f").readyState)
                    __classPrivateFieldGet(_this, _Client_ws, "f").close();
                cb();
            });
        };
        return Client;
    }()),
    _Client_ws = new WeakMap(),
    _Client_logged = new WeakMap(),
    _Client_sessions = new WeakMap(),
    _Client_callbacks = new WeakMap(),
    _Client_sendQueue = new WeakMap(),
    _Client_clientBridge = new WeakMap(),
    _Client_instances = new WeakSet(),
    _Client_handleEvent = function _Client_handleEvent(ev) {
        var data = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            data[_i - 1] = arguments[_i];
        }
        __classPrivateFieldGet(this, _Client_callbacks, "f")[ev].forEach(function (e) { return e.apply(void 0, data); });
        __classPrivateFieldGet(this, _Client_callbacks, "f").event.forEach(function (e) { return e.apply(void 0, __spreadArray([ev], data, false)); });
    },
    _Client_handleError = function _Client_handleError() {
        var _a;
        var msgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            msgs[_i] = arguments[_i];
        }
        if (__classPrivateFieldGet(this, _Client_callbacks, "f").error.length === 0)
            console.error.apply(console, msgs);
        else
            (_a = __classPrivateFieldGet(this, _Client_instances, "m", _Client_handleEvent)).call.apply(_a, __spreadArray([this, 'error'], msgs, false));
    },
    _Client_parsePacket = function _Client_parsePacket(str) {
        var _this = this;
        if (!this.isOpen)
            return;
        protocol.parseWSPacket(str).forEach(function (packet) {
            if (global.TW_DEBUG)
                console.log('§90§30§107 CLIENT §0 PACKET', packet);
            if (typeof packet === 'number') { // Ping
                __classPrivateFieldGet(_this, _Client_ws, "f").send(protocol.formatWSPacket("~h~".concat(packet)));
                __classPrivateFieldGet(_this, _Client_instances, "m", _Client_handleEvent).call(_this, 'ping', packet);
                return;
            }
            if (packet.m === 'protocol_error') { // Error
                __classPrivateFieldGet(_this, _Client_instances, "m", _Client_handleError).call(_this, 'Client critical error:', packet.p);
                __classPrivateFieldGet(_this, _Client_ws, "f").close();
                return;
            }
            if (packet.m && packet.p) { // Normal packet
                var parsed = {
                    type: packet.m,
                    data: packet.p,
                };
                var session = packet.p[0];
                if (session && __classPrivateFieldGet(_this, _Client_sessions, "f")[session]) {
                    __classPrivateFieldGet(_this, _Client_sessions, "f")[session].onData(parsed);
                    return;
                }
            }
            if (!__classPrivateFieldGet(_this, _Client_logged, "f")) {
                __classPrivateFieldGet(_this, _Client_instances, "m", _Client_handleEvent).call(_this, 'logged', packet);
                return;
            }
            __classPrivateFieldGet(_this, _Client_instances, "m", _Client_handleEvent).call(_this, 'data', packet);
        });
    },
    _a);
