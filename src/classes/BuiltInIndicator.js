/**
 * @typedef {'VbPFixed@tv-basicstudies-139!'
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
  'VbPFixed@tv-basicstudies-139!': {
    rowsLayout: 'Number Of Rows',
    rows: 24,
    volume: 'Up/Down',
    vaVolume: 70,
    subscribeRealtime: false,
    // first_bar_time: 0000000000000,
    // last_bar_time: 0000000000000,
  },
  'VbPFixed@tv-volumebyprice-53!': {
    rowsLayout: 'Number Of Rows',
    rows: 24,
    volume: 'Up/Down',
    vaVolume: 70,
    subscribeRealtime: false,
    // first_bar_time: 0000000000000,
    // last_bar_time: 0000000000000,
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
    // first_visible_bar_time: 0000000000000,
    // last_visible_bar_time: 0000000000000,
  },
  'VbPVisible@tv-volumebyprice-53': {
    rowsLayout: 'Number Of Rows',
    rows: 24,
    volume: 'Up/Down',
    vaVolume: 70,
    subscribeRealtime: false,
    // first_visible_bar_time: 0000000000000,
    // last_visible_bar_time: 0000000000000,
  },
};

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
    if (defaultValues[type]) this.#options = defaultValues[type];
  }

  /**
   * Set an option
   * @param {BuiltInIndicatorOption} key The option you want to change
   * @param {*} value The new value of the property
   */
  setOption(key, value) {
    this.#options[key] = value;
  }
};
