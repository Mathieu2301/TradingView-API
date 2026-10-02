/**
 * TradingView websocket framing.
 *
 * Every websocket message contains one or more frames: `~m~<length>~m~<payload>`.
 * The length counts UTF-16 code units (JavaScript string length). Payloads are
 * either JSON packets or heartbeats (`~h~<id>`), which the client must echo.
 */

/** A JSON packet sent by the server: `m` is the method, `p` its parameters. */
export interface ServerPacket {
  m: string;
  p: unknown[];
  /** Server timestamp in seconds. */
  t?: number;
  /** Server timestamp in milliseconds. */
  t_ms?: number;
}

/** Greeting sent by the server right after the websocket opens. */
export interface ServerHello {
  session_id: string;
  timestamp: number;
  timestampMs: number;
  release: string;
  studies_metadata_hash: string;
  auth_scheme_vsn: number;
  protocol: 'json' | string;
  via: string;
  javastudies: string[];
  [key: string]: unknown;
}

export type Frame =
  /** Heartbeat to echo back with `encodeHeartbeat(id)`. */
  | { type: 'heartbeat'; id: number }
  /** Method packet (`{ m, p }`). */
  | { type: 'packet'; packet: ServerPacket }
  /** Any other JSON payload (for example the server greeting). */
  | { type: 'data'; data: unknown }
  /** A payload that could not be parsed. */
  | { type: 'invalid'; raw: string; error: unknown };

const HEADER = '~m~';
const HEARTBEAT = '~h~';

function decodePayload(raw: string): Frame {
  if (raw.startsWith(HEARTBEAT)) {
    const id = Number(raw.slice(HEARTBEAT.length));
    if (Number.isFinite(id)) return { type: 'heartbeat', id };
    return { type: 'invalid', raw, error: new Error('Invalid heartbeat') };
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    return { type: 'invalid', raw, error };
  }

  if (data && typeof data === 'object' && typeof (data as ServerPacket).m === 'string') {
    const packet = data as ServerPacket;
    return { type: 'packet', packet: { ...packet, p: Array.isArray(packet.p) ? packet.p : [] } };
  }
  return { type: 'data', data };
}

/** Lenient fallback for malformed input: split on frame headers. */
function splitFrames(input: string): string[] {
  return input.split(/~m~\d+~m~/).filter((part) => part.length > 0);
}

/** Decodes a raw websocket message into frames. */
export function decodeFrames(input: string): Frame[] {
  const payloads: string[] = [];
  let position = 0;

  while (position < input.length) {
    if (!input.startsWith(HEADER, position)) {
      payloads.push(...splitFrames(input.slice(position)));
      break;
    }
    const lengthStart = position + HEADER.length;
    const lengthEnd = input.indexOf(HEADER, lengthStart);
    const length = Number(input.slice(lengthStart, lengthEnd));
    if (lengthEnd < 0 || !Number.isInteger(length) || length < 0) {
      payloads.push(...splitFrames(input.slice(position)));
      break;
    }
    const start = lengthEnd + HEADER.length;
    payloads.push(input.slice(start, start + length));
    position = start + length;
  }

  return payloads.map(decodePayload);
}

/** Encodes one frame. Objects are JSON-encoded. */
export function encodeFrame(payload: string | object): string {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return `${HEADER}${body.length}${HEADER}${body}`;
}

/** Encodes a client packet (`{ m: method, p: params }`). */
export function encodePacket(method: string, params: readonly unknown[] = []): string {
  return encodeFrame({ m: method, p: params });
}

/** Encodes the reply to a server heartbeat. */
export function encodeHeartbeat(id: number): string {
  return encodeFrame(`${HEARTBEAT}${id}`);
}
