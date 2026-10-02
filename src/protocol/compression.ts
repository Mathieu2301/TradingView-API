import { gunzipSync, inflateRawSync, inflateSync } from 'node:zlib';

import { TradingViewError } from '../errors.js';

/**
 * TradingView sends large strategy reports as base64 data (`dataCompressed`).
 * The payload is usually a ZIP archive with a single entry, but zlib, raw
 * deflate, gzip and plain JSON have also been observed. Base64 may be URL-safe
 * and unpadded.
 */

/** Normalises URL-safe and unpadded base64. */
export function normaliseBase64(data: string): string {
  const normalised = data.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  return normalised.padEnd(normalised.length + ((4 - (normalised.length % 4)) % 4), '=');
}

const LOCAL_FILE_HEADER = 0x04034b50;
const CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;

function inflateEntry(method: number, data: Buffer): Buffer {
  if (method === 0) return data;
  if (method === 8) return inflateRawSync(data);
  throw new Error(`Unsupported ZIP compression method ${method}`);
}

/** Reads the first file of a ZIP archive (stored or deflated). */
export function readFirstZipEntry(archive: Uint8Array): Uint8Array {
  const buffer = Buffer.from(archive.buffer, archive.byteOffset, archive.byteLength);
  // Prefer the central directory: local headers may omit sizes (data descriptors).
  for (let eocd = buffer.length - 22; eocd >= Math.max(0, buffer.length - 0xffff - 22); eocd -= 1) {
    if (buffer.readUInt32LE(eocd) !== END_OF_CENTRAL_DIRECTORY) continue;
    const entries = buffer.readUInt16LE(eocd + 10);
    let cursor = buffer.readUInt32LE(eocd + 16);
    for (let i = 0; i < entries; i += 1) {
      if (buffer.readUInt32LE(cursor) !== CENTRAL_DIRECTORY_HEADER) break;
      const method = buffer.readUInt16LE(cursor + 10);
      const compressedSize = buffer.readUInt32LE(cursor + 20);
      const nameLength = buffer.readUInt16LE(cursor + 28);
      const extraLength = buffer.readUInt16LE(cursor + 30);
      const commentLength = buffer.readUInt16LE(cursor + 32);
      const localOffset = buffer.readUInt32LE(cursor + 42);
      const name = buffer.toString('utf8', cursor + 46, cursor + 46 + nameLength);
      cursor += 46 + nameLength + extraLength + commentLength;
      if (name.endsWith('/')) continue; // Directory entry.

      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      return inflateEntry(method, buffer.subarray(start, start + compressedSize));
    }
    break;
  }

  // No usable central directory: fall back to the first local header.
  if (buffer.length >= 30 && buffer.readUInt32LE(0) === LOCAL_FILE_HEADER) {
    const method = buffer.readUInt16LE(8);
    const compressedSize = buffer.readUInt32LE(18);
    const start = 30 + buffer.readUInt16LE(26) + buffer.readUInt16LE(28);
    const end = compressedSize > 0 ? start + compressedSize : buffer.length;
    return inflateEntry(method, buffer.subarray(start, end));
  }

  throw new Error('Not a ZIP archive');
}

/** Decodes a TradingView compressed payload into JSON. */
export function decodeCompressed(data: string): unknown {
  const buffer = Buffer.from(normaliseBase64(data), 'base64');
  const readers: Array<() => Uint8Array> = [
    () => readFirstZipEntry(buffer),
    () => buffer,
    () => inflateSync(buffer),
    () => inflateRawSync(buffer),
    () => gunzipSync(buffer),
  ];

  let lastError: unknown;
  for (const read of readers) {
    try {
      return JSON.parse(Buffer.from(read()).toString('utf8'));
    } catch (error) {
      lastError = error;
    }
  }
  throw new TradingViewError('PARSE_ERROR', 'Unable to decode compressed payload', { cause: lastError });
}
