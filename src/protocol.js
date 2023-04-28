const JSZip = require('jszip');

/**
 * @typedef {Object} TWPacket
 * @prop {string} [m] Packet type
 * @prop {[session: string, {}]} [p] Packet data
 */

const cleanerRgx = /~h~/g;
const splitterRgx = /~m~[0-9]{1,}~m~/g;

module.exports = {
  /**
   * Parse websocket packet
   * @function parseWSPacket
   * @param {input} string | Buffer Websocket raw data
   * @returns {TWPacket[]} TradingView packets
   */
  parseWSPacket(input) {
    // Convert input to a string if it is a buffer
    const str = (input instanceof Buffer) ? input.toString() : input;
    return str.replace(cleanerRgx, '').split(splitterRgx)
      .map((p) => {
        if (!p) return false;
        try {
          return JSON.parse(p);
        } catch (error) {
          console.warn('Cant parse', p);
          return false;
        }
      })
      .filter((p) => p);
  },

  /**
   * Format websocket packet
   * @function formatWSPacket
   * @param {TWPacket} packet TradingView packet
   * @returns {string} Websocket raw data
   */
  formatWSPacket(packet) {
    const msg = typeof packet === 'object'
      ? JSON.stringify(packet)
      : packet;
    return `~m~${msg.length}~m~${msg}`;
  },

  /**
   * Parse compressed data
   * @function parseCompressed
   * @param {string} data Compressed data
   * @returns {Promise<{}>} Parsed data
   */
  async parseCompressed(data) {
    const zip = new JSZip();
    return JSON.parse(
      await (
        await zip.loadAsync(data, { base64: true })
      ).file('').async('text'),
    );
  },
};
