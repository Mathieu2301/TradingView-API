/**
 * @typedef {'Volume@tv-basicstudies-241'
 *  | 'VbPFixed@tv-basicstudies-241'
 *  | 'VbPFixed@tv-basicstudies-241!'
 *  | 'VbPFixed@tv-volumebyprice-53!'
 *  | 'VbPSessions@tv-volumebyprice-53'
 *  | 'VbPSessionsRough@tv-volumebyprice-53!'
 *  | 'VbPSessionsDetailed@tv-volumebyprice-53!'
 *  | 'VbPVisible@tv-volumebyprice-53'} BuiltInIndicatorType Built-in indicator type
 */

/**
 * @typedef {'rowsLayout' | 'rows' | 'volume'
 *  | 'vaVolume' | 'subscribeRealtime'
 *  | 'first_bar_time' | 'first_visible_bar_time'
 *  | 'last_bar_time' | 'last_visible_bar_time'
 *  | 'extendPocRight'} BuiltInIndicatorOption Built-in indicator Option
 */

const defaultValues = {
  'Volume@tv-basicstudies-241': {
    length: 20,
    col_prev_close: false,
  },
  'VbPFixed@tv-basicstudies-241': {
    rowsLayout: 'Number Of Rows',
    rows: 24,
    volume: 'Up/Down',
    vaVolume: 70,
    subscribeRealtime: false,
    first_bar_time: NaN,
    last_bar_time: Date.now(),
    extendToRight: false,
    mapRightBoundaryToBarStartTime: true,
  },
  'VbPFixed@tv-basicstudies-241!': {
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
module.exports = class BuiltInIndicator {
  /** @type {BuiltInIndicatorType} */
  #type;

  /** @return {BuiltInIndicatorType} Indicator script */
  get type() {
    return this.#type;
  }

  /** @type {Object<string, any>} */
  #options = {};

  /** @return {Object<string, any>} Indicator script */
  get options() {
    return this.#options;
  }

  /**
   * @param {BuiltInIndicatorType} type Buit-in indocator raw type
   */
  constructor(type = '') {
    if (!type) throw new Error(`Wrong buit-in indicator type "${type}".`);

    this.#type = type;
    if (defaultValues[type]) this.#options = { ...defaultValues[type] };
  }

  /**
   * Set an option
   * @param {BuiltInIndicatorOption} key The option you want to change
   * @param {*} value The new value of the property
   * @param {boolean} FORCE Ignore type and key verifications
   */
  setOption(key, value, FORCE = false) {
    if (FORCE) {
      this.#options[key] = value;
      return;
    }

    if (defaultValues[this.#type] && defaultValues[this.#type][key] !== undefined) {
      const requiredType = typeof defaultValues[this.#type][key];
      const valType = typeof value;
      if (requiredType !== valType) {
        throw new Error(`Wrong '${key}' value type '${valType}' (must be '${requiredType}')`);
      }
    }

    if (defaultValues[this.#type] && defaultValues[this.#type][key] === undefined) {
      throw new Error(`Option '${key}' is denied with '${this.#type}' indicator`);
    }

    this.#options[key] = value;
  }
};
