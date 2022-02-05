/** @class */
class FormData {
  #string = '';

  #boundary = '';

  get boundary() {
    return this.#boundary;
  }

  constructor() {
    const random = (Math.random() * 10 ** 20).toString(36);
    this.#boundary = `${random}`;
    this.#string = `--${this.boundary}`;
  }

  /**
   * Adds a property to the FormData object
   * @param {string} key Property key
   * @param {string} value Property value
   */
  append(key, value) {
    this.#string += `\r\nContent-Disposition: form-data; name="${key}"`;
    this.#string += `\r\n\r\n${value}`;
    this.#string += `\r\n--${this.boundary}`;
  }

  /**
   * @returns {string}
   */
  toString() {
    return `${this.#string}--`;
  }
}

module.exports = FormData;
