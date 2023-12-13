export type TWPacket = {
    /**
     * Packet type
     */
    m?: string;
    /**
     * Packet data
     */
    p?: [session: string, {}];
};
/**
 * Parse websocket packet
 * @function parseWSPacket
 * @param {string} str Websocket raw data
 * @returns {TWPacket[]} TradingView packets
 */
declare function parseWSPacket(str: string): TWPacket[];
/**
 * Format websocket packet
 * @function formatWSPacket
 * @param {TWPacket} packet TradingView packet
 * @returns {string} Websocket raw data
 */
declare function formatWSPacket(packet: TWPacket): string;
/**
 * Parse compressed data
 * @function parseCompressed
 * @param {string} data Compressed data
 * @returns {Promise<{}>} Parsed data
 */
declare function parseCompressed(data: string): Promise<{}>;
export {};
