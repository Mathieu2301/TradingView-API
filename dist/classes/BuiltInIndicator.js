/**
 * @typedef {'Volume@tv-basicstudies-144'
 *  | 'VbPFixed@tv-basicstudies-139!'
 *  | 'VbPFixed@tv-volumebyprice-53!'
 *  | 'VbPSessions@tv-volumebyprice-53'
 *  | 'VbPSessionsRough@tv-volumebyprice-53!'
 *  | 'VbPSessionsDetailed@tv-volumebyprice-53!'
 *  | 'VbPVisible@tv-volumebyprice-53'} BuiltInIndicatorType Built-in indicator type
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
var _BuiltInIndicator_type, _BuiltInIndicator_options, _a;
/**
 * @typedef {'rowsLayout' | 'rows' | 'volume'
 *  | 'vaVolume' | 'subscribeRealtime'
 *  | 'first_bar_time' | 'first_visible_bar_time'
 *  | 'last_bar_time' | 'last_visible_bar_time'
 *  | 'extendPocRight'} BuiltInIndicatorOption Built-in indicator Option
 */
var defaultValues = {
    'Volume@tv-basicstudies-144': {
        length: 20,
        col_prev_close: false,
    },
    'VbPFixed@tv-basicstudies-139!': {
        rowsLayout: 'Number Of Rows',
        rows: 24,
        volume: 'Up/Down',
        vaVolume: 70,
        subscribeRealtime: false,
        first_bar_time: NaN,
        last_bar_time: Date.now(),
    },
    'VbPFixed@tv-volumebyprice-53!': {
        rowsLayout: 'Number Of Rows',
        rows: 24,
        volume: 'Up/Down',
        vaVolume: 70,
        subscribeRealtime: false,
        first_bar_time: NaN,
        last_bar_time: Date.now(),
    },
    'VbPSessions@tv-volumebyprice-53': {
        rowsLayout: 'Number Of Rows',
        rows: 24,
        volume: 'Up/Down',
        vaVolume: 70,
        extendPocRight: false,
    },
    'VbPSessionsRough@tv-volumebyprice-53!': {
        volume: 'Up/Down',
        vaVolume: 70,
    },
    'VbPSessionsDetailed@tv-volumebyprice-53!': {
        volume: 'Up/Down',
        vaVolume: 70,
        subscribeRealtime: false,
        first_visible_bar_time: NaN,
        last_visible_bar_time: Date.now(),
    },
    'VbPVisible@tv-volumebyprice-53': {
        rowsLayout: 'Number Of Rows',
        rows: 24,
        volume: 'Up/Down',
        vaVolume: 70,
        subscribeRealtime: false,
        first_visible_bar_time: NaN,
        last_visible_bar_time: Date.now(),
    },
};
/** @class */
module.exports = (_a = /** @class */ (function () {
        /**
         * @param {BuiltInIndicatorType} type Buit-in indocator raw type
         */
        function BuiltInIndicator(type) {
            if (type === void 0) { type = ''; }
            /** @type {BuiltInIndicatorType} */
            _BuiltInIndicator_type.set(this, void 0);
            /** @type {Object<string, any>} */
            _BuiltInIndicator_options.set(this, {});
            if (!type)
                throw new Error("Wrong buit-in indicator type \"".concat(type, "\"."));
            __classPrivateFieldSet(this, _BuiltInIndicator_type, type, "f");
            if (defaultValues[type])
                __classPrivateFieldSet(this, _BuiltInIndicator_options, __assign({}, defaultValues[type]), "f");
        }
        Object.defineProperty(BuiltInIndicator.prototype, "type", {
            /** @return {BuiltInIndicatorType} Indicator script */
            get: function () {
                return __classPrivateFieldGet(this, _BuiltInIndicator_type, "f");
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(BuiltInIndicator.prototype, "options", {
            /** @return {Object<string, any>} Indicator script */
            get: function () {
                return __classPrivateFieldGet(this, _BuiltInIndicator_options, "f");
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Set an option
         * @param {BuiltInIndicatorOption} key The option you want to change
         * @param {*} value The new value of the property
         * @param {boolean} FORCE Ignore type and key verifications
         */
        BuiltInIndicator.prototype.setOption = function (key, value, FORCE) {
            if (FORCE === void 0) { FORCE = false; }
            if (FORCE) {
                __classPrivateFieldGet(this, _BuiltInIndicator_options, "f")[key] = value;
                return;
            }
            if (defaultValues[__classPrivateFieldGet(this, _BuiltInIndicator_type, "f")] && defaultValues[__classPrivateFieldGet(this, _BuiltInIndicator_type, "f")][key] !== undefined) {
                var requiredType = typeof defaultValues[__classPrivateFieldGet(this, _BuiltInIndicator_type, "f")][key];
                var valType = typeof value;
                if (requiredType !== valType) {
                    throw new Error("Wrong '".concat(key, "' value type '").concat(valType, "' (must be '").concat(requiredType, "')"));
                }
            }
            if (defaultValues[__classPrivateFieldGet(this, _BuiltInIndicator_type, "f")] && defaultValues[__classPrivateFieldGet(this, _BuiltInIndicator_type, "f")][key] === undefined) {
                throw new Error("Option '".concat(key, "' is denied with '").concat(__classPrivateFieldGet(this, _BuiltInIndicator_type, "f"), "' indicator"));
            }
            __classPrivateFieldGet(this, _BuiltInIndicator_options, "f")[key] = value;
        };
        return BuiltInIndicator;
    }()),
    _BuiltInIndicator_type = new WeakMap(),
    _BuiltInIndicator_options = new WeakMap(),
    _a);
