import { readFileSync } from 'node:fs';
import { deflateRawSync, deflateSync, gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  createSessionId, decodeCompressed, decodeFrames, encodeFrame, encodeHeartbeat, encodePacket, normaliseBase64,
} from '../../src/protocol/index.js';
import { TradingViewError } from '../../src/errors.js';

const live = JSON.parse(readFileSync(new URL('../fixtures/live-session.json', import.meta.url), 'utf8'));
const compressed = JSON.parse(readFileSync(new URL('../fixtures/compressed-report.json', import.meta.url), 'utf8'));

describe('framing', () => {
  it('encodes packets with UTF-16 lengths', () => {
    expect(encodePacket('set_auth_token', ['token'])).toBe('~m~36~m~{"m":"set_auth_token","p":["token"]}');
    expect(encodeFrame('é€')).toBe('~m~2~m~é€');
    expect(encodeHeartbeat(42)).toBe('~m~5~m~~h~42');
  });

  it('decodes several frames, heartbeats and the greeting', () => {
    const message = encodeFrame({ session_id: 'abc', protocol: 'json' })
      + encodeFrame('~h~7')
      + encodePacket('qsd', ['qs_1', { n: 'X', s: 'ok', v: { lp: 1 } }]);
    expect(decodeFrames(message)).toEqual([
      { type: 'data', data: { session_id: 'abc', protocol: 'json' } },
      { type: 'heartbeat', id: 7 },
      { type: 'packet', packet: { m: 'qsd', p: ['qs_1', { n: 'X', s: 'ok', v: { lp: 1 } }] } },
    ]);
  });

  it('keeps payloads containing frame markers intact', () => {
    const tricky = { m: 'qsd', p: ['qs_1', { description: 'weird ~m~12~m~ text', unicode: '日本語' }] };
    const [frame] = decodeFrames(encodeFrame(tricky));
    expect(frame).toEqual({ type: 'packet', packet: tricky });
  });

  it('reports invalid JSON instead of throwing', () => {
    const [frame] = decodeFrames('~m~5~m~{nope');
    expect(frame.type).toBe('invalid');
  });

  it('falls back to splitting malformed input', () => {
    const frames = decodeFrames('garbage~m~4~m~~h~1');
    expect(frames.map((f) => f.type)).toEqual(['invalid', 'heartbeat']);
  });

  it('defaults a missing packet parameter list to []', () => {
    expect(decodeFrames(encodeFrame({ m: 'protocol_error' }))).toEqual([
      { type: 'packet', packet: { m: 'protocol_error', p: [] } },
    ]);
  });

  it('decodes every message of a captured live session', () => {
    const frames = live.messages.flatMap((message: string) => decodeFrames(message));
    expect(frames.some((frame: any) => frame.type === 'invalid')).toBe(false);
    const methods = frames.filter((f: any) => f.type === 'packet').map((f: any) => f.packet.m);
    expect(methods).toEqual(expect.arrayContaining([
      'series_loading', 'symbol_resolved', 'timescale_update', 'series_completed',
      'du', 'study_completed', 'qsd', 'quote_completed', 'symbol_error',
    ]));
  });
});

describe('compressed payloads', () => {
  const json = JSON.stringify(compressed.report);

  it('reads a deflated ZIP with an empty entry name (TradingView format)', () => {
    expect(decodeCompressed(compressed.zipDeflated)).toEqual(compressed.report);
  });

  it('reads a stored ZIP encoded as unpadded URL-safe base64', () => {
    expect(decodeCompressed(compressed.zipStored)).toEqual(compressed.report);
  });

  it('reads a streamed ZIP that uses data descriptors', () => {
    expect(decodeCompressed(compressed.zipStreamed)).toEqual(compressed.report);
  });

  it('reads zlib, raw deflate, gzip and plain JSON payloads', () => {
    for (const buffer of [deflateSync(json), deflateRawSync(json), gzipSync(json), Buffer.from(json)]) {
      expect(decodeCompressed(buffer.toString('base64'))).toEqual(compressed.report);
    }
  });

  it('throws a PARSE_ERROR for unknown data', () => {
    expect(() => decodeCompressed('bm90IGpzb24')).toThrow(TradingViewError);
    try {
      decodeCompressed('bm90IGpzb24');
    } catch (error) {
      expect((error as TradingViewError).code).toBe('PARSE_ERROR');
    }
  });

  it('normalises base64', () => {
    expect(normaliseBase64('a-_b')).toBe('a+/b');
    expect(normaliseBase64('abcde')).toBe('abcde===');
  });
});

describe('ids', () => {
  it('creates prefixed random IDs', () => {
    const id = createSessionId('cs');
    expect(id).toMatch(/^cs_[A-Za-z0-9]{12}$/);
    expect(createSessionId('cs')).not.toBe(id);
  });
});
