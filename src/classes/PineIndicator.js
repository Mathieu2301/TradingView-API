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
module.exports = class PineIndicator {
  #options;

  /** @type {IndicatorType} */
  #type = 'Script@tv-scripting-101!';

  /** @param {Indicator} options Indicator */
  constructor(options) {
    this.#options = options;
  }

  /** @return {string} Indicator ID */
  get pineId() {
    return this.#options.pineId;
  }

  /** @return {string} Indicator version */
  get pineVersion() {
    return this.#options.pineVersion;
  }

  /** @return {string} Indicator description */
  get description() {
    return this.#options.description;
  }

  /** @return {string} Indicator short description */
  get shortDescription() {
    return this.#options.shortDescription;
  }

  /** @return {Object<string, IndicatorInput>} Indicator inputs */
  get inputs() {
    return this.#options.inputs;
  }

  /** @return {Object<string, string>} Indicator plots */
  get plots() {
    return this.#options.plots;
  }

  /** @return {IndicatorType} Indicator script */
  get type() {
    return this.#type;
  }

  /**
   * Set the indicator type
   * @param {IndicatorType} type Indicator type
   */
  setType(type = 'Script@tv-scripting-101!') {
    this.#type = type;
  }

  /** @return {string} Indicator script */
  get script() {
    return this.#options.script;
  }

  /**
   * Set an option
   * @param {number | string} key The key can be ID of the property (`in_{ID}`),
   * the inline name or the internalID.
   * @param {*} value The new value of the property
   */
  setOption(key, value) {
    let propI = '';

    if (this.#options.inputs[`in_${key}`]) propI = `in_${key}`;
    else if (this.#options.inputs[key]) propI = key;
    else {
      propI = Object.keys(this.#options.inputs).find((I) => (
        this.#options.inputs[I].inline === key
        || this.#options.inputs[I].internalID === key
      ));
    }

    if (propI && this.#options.inputs[propI]) {
      const input = this.#options.inputs[propI];

      const types = {
        bool: 'Boolean',
        integer: 'Number',
        float: 'Number',
        text: 'String',
      };

      // eslint-disable-next-line valid-typeof
      if (types[input.type] && typeof value !== types[input.type].toLowerCase()) {
        throw new Error(`Input '${input.name}' (${propI}) must be a ${types[input.type]} !`);
      }

      if (input.options && !input.options.includes(value)) {
        throw new Error(`Input '${input.name}' (${propI}) must be one of these values:`, input.options);
      }

      input.value = value;
    } else throw new Error(`Input '${key}' not found (${propI}).`);
  }
};
