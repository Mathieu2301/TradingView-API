const zlib = require('zlib');
const JSZip = require('jszip');

/**
 * @typedef {Object} TWPacket
 * @prop {string} [m] Packet type
 * @prop {[session: string, {}]} [p] Packet data
 */

const cleanerRgx = /~h~/g;
const splitterRgx = /~m~[0-9]{1,}~m~/g;

/**
 * Normalise base64 data received from TradingView.
 * TradingView occasionally omits padding and may use URL-safe characters.
 * @param {string} data Base64 payload
 * @returns {string} Normalised base64 payload
 */
function normaliseBase64(data) {
  const normalised = data.replace(/-/g, '+').replace(/_/g, '/');
  return normalised.padEnd(normalised.length + ((4 - (normalised.length % 4)) % 4), '=');
}

/**
 * Parse JSON from a decoded buffer, optionally trying common compression wrappers.
 * @param {Buffer} buffer Decoded compressed payload
 * @returns {Object | undefined} Parsed JSON when a format matches
 */
function parseDecodedCompressed(buffer) {
  const readers = [
    () => buffer,
    () => zlib.inflateSync(buffer),
    () => zlib.inflateRawSync(buffer),
    () => zlib.gunzipSync(buffer),
  ];

  for (const read of readers) {
    try {
      return JSON.parse(read().toString('utf8'));
    } catch (error) {
      // Try the next known TradingView payload format.
    }
  }

  return undefined;
}

module.exports = {
  /**
   * Parse websocket packet
   * @function parseWSPacket
   * @param {string} str Websocket raw data
   * @returns {TWPacket[]} TradingView packets
   */
  parseWSPacket(str) {
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
    const normalised = normaliseBase64(data);
    const zip = new JSZip();

    try {
      const archive = await zip.loadAsync(normalised, { base64: true });
      const file = archive.file('') || archive.file(/.*/)[0];
      if (!file) throw new Error('Compressed payload does not contain a file');
      return JSON.parse(await file.async('text'));
    } catch (zipError) {
      const decoded = Buffer.from(normalised, 'base64');
      const parsed = parseDecodedCompressed(decoded);
      if (parsed) return parsed;
      throw zipError;
    }
  },
};
