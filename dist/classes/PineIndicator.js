/**
 * @typedef {Object} IndicatorInput
 * @property {string} name Input name
 * @property {string} inline Input inline name
 * @property {string} [internalID] Input internal ID
 * @property {string} [tooltip] Input tooltip
 * @property {'text' | 'source' | 'integer'
 *  | 'float' | 'resolution' | 'bool' | 'color'
 * } type Input type
 * @property {string | number | boolean} value Input default value
 * @property {boolean} isHidden If the input is hidden
 * @property {boolean} isFake If the input is fake
 * @property {string[]} [options] Input options if the input is a select
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _PineIndicator_options, _PineIndicator_type, _a;
/**
 * @typedef {Object} Indicator
 * @property {string} pineId Indicator ID
 * @property {string} pineVersion Indicator version
 * @property {string} description Indicator description
 * @property {string} shortDescription Indicator short description
 * @property {Object<string, IndicatorInput>} inputs Indicator inputs
 * @property {Object<string, string>} plots Indicator plots
 * @property {string} script Indicator script
 */
/**
 * @typedef {'Script@tv-scripting-101!'
 *  | 'StrategyScript@tv-scripting-101!'} IndicatorType Indicator type
 */
/** @class */
module.exports = (_a = /** @class */ (function () {
        /** @param {Indicator} options Indicator */
        function PineIndicator(options) {
            _PineIndicator_options.set(this, void 0);
            /** @type {IndicatorType} */
            _PineIndicator_type.set(this, 'Script@tv-scripting-101!');
            __classPrivateFieldSet(this, _PineIndicator_options, options, "f");
        }
        Object.defineProperty(PineIndicator.prototype, "pineId", {
            /** @return {string} Indicator ID */
            get: function () {
                return __classPrivateFieldGet(this, _PineIndicator_options, "f").pineId;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(PineIndicator.prototype, "pineVersion", {
            /** @return {string} Indicator version */
            get: function () {
                return __classPrivateFieldGet(this, _PineIndicator_options, "f").pineVersion;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(PineIndicator.prototype, "description", {
            /** @return {string} Indicator description */
            get: function () {
                return __classPrivateFieldGet(this, _PineIndicator_options, "f").description;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(PineIndicator.prototype, "shortDescription", {
            /** @return {string} Indicator short description */
            get: function () {
                return __classPrivateFieldGet(this, _PineIndicator_options, "f").shortDescription;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(PineIndicator.prototype, "inputs", {
            /** @return {Object<string, IndicatorInput>} Indicator inputs */
            get: function () {
                return __classPrivateFieldGet(this, _PineIndicator_options, "f").inputs;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(PineIndicator.prototype, "plots", {
            /** @return {Object<string, string>} Indicator plots */
            get: function () {
                return __classPrivateFieldGet(this, _PineIndicator_options, "f").plots;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(PineIndicator.prototype, "type", {
            /** @return {IndicatorType} Indicator script */
            get: function () {
                return __classPrivateFieldGet(this, _PineIndicator_type, "f");
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Set the indicator type
         * @param {IndicatorType} type Indicator type
         */
        PineIndicator.prototype.setType = function (type) {
            if (type === void 0) { type = 'Script@tv-scripting-101!'; }
            __classPrivateFieldSet(this, _PineIndicator_type, type, "f");
        };
        Object.defineProperty(PineIndicator.prototype, "script", {
            /** @return {string} Indicator script */
            get: function () {
                return __classPrivateFieldGet(this, _PineIndicator_options, "f").script;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Set an option
         * @param {number | string} key The key can be ID of the property (`in_{ID}`),
         * the inline name or the internalID.
         * @param {*} value The new value of the property
         */
        PineIndicator.prototype.setOption = function (key, value) {
            var _this = this;
            var propI = '';
            if (__classPrivateFieldGet(this, _PineIndicator_options, "f").inputs["in_".concat(key)])
                propI = "in_".concat(key);
            else if (__classPrivateFieldGet(this, _PineIndicator_options, "f").inputs[key])
                propI = key;
            else {
                propI = Object.keys(__classPrivateFieldGet(this, _PineIndicator_options, "f").inputs).find(function (I) { return (__classPrivateFieldGet(_this, _PineIndicator_options, "f").inputs[I].inline === key
                    || __classPrivateFieldGet(_this, _PineIndicator_options, "f").inputs[I].internalID === key); });
            }
            if (propI && __classPrivateFieldGet(this, _PineIndicator_options, "f").inputs[propI]) {
                var input = __classPrivateFieldGet(this, _PineIndicator_options, "f").inputs[propI];
                var types = {
                    bool: 'Boolean',
                    integer: 'Number',
                    float: 'Number',
                    text: 'String',
                };
                // eslint-disable-next-line valid-typeof
                if (types[input.type] && typeof value !== types[input.type].toLowerCase()) {
                    throw new Error("Input '".concat(input.name, "' (").concat(propI, ") must be a ").concat(types[input.type], " !"));
                }
                if (input.options && !input.options.includes(value)) {
                    throw new Error("Input '".concat(input.name, "' (").concat(propI, ") must be one of these values:"), input.options);
                }
                input.value = value;
            }
            else
                throw new Error("Input '".concat(key, "' not found (").concat(propI, ")."));
        };
        return PineIndicator;
    }()),
    _PineIndicator_options = new WeakMap(),
    _PineIndicator_type = new WeakMap(),
    _a);
