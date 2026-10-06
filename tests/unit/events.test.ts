import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import { Emitter } from '../../src/events.js';

type Events = { [k: string]: unknown[]; tick: [n: number]; error: [error: Error] };

class TestEmitter extends Emitter<Events> {
  fire<K extends keyof Events & string>(event: K, ...args: Events[K]) {
    this.emit(event, ...args);
  }
}

afterEach(() => { vi.restoreAllMocks(); });

describe('Emitter', () => {
  it('supports on, once, off, onAny and unsubscribe functions', () => {
    const emitter = new TestEmitter();
    const seen: string[] = [];
    const off = emitter.on('tick', (n) => seen.push(`on${n}`));
    emitter.once('tick', (n) => seen.push(`once${n}`));
    const offAny = emitter.onAny((event, ...args) => { seen.push(`any:${event}:${args[0]}`); });
    emitter.fire('tick', 1);
    emitter.fire('tick', 2);
    off();
    offAny();
    emitter.fire('tick', 3);
    expect(seen).toEqual(['on1', 'once1', 'any:tick:1', 'on2', 'any:tick:2']);
    expect(emitter.listenerCount('tick')).toBe(0);
  });

  it('logs unhandled errors instead of dropping them', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    new TestEmitter().fire('error', new Error('boom'));
    expect(spy).toHaveBeenCalledWith('[tradingview]', new Error('boom'));
  });

  it('handles async listener rejections, including once and catch-all listeners', async () => {
    const emitter = new TestEmitter();
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const after = vi.fn();
    emitter.on('tick', async () => { throw new Error('async on'); });
    emitter.once('tick', async () => { throw new Error('async once'); });
    emitter.onAny(async () => { throw new Error('async any'); });
    emitter.on('tick', after);
    emitter.fire('tick', 1);
    await vi.waitFor(() => expect(logged).toHaveBeenCalledTimes(3));
    expect(after).toHaveBeenCalledWith(1);
    expect(logged).toHaveBeenCalledWith('[tradingview] Listener threw:', expect.objectContaining({ message: 'async on' }));
    expect(logged).toHaveBeenCalledWith('[tradingview] Listener threw:', expect.objectContaining({ message: 'async once' }));
    expect(logged).toHaveBeenCalledWith('[tradingview] Listener threw:', expect.objectContaining({ message: 'async any' }));
  });

  it('isolates throwing listeners from the emitter', () => {
    const emitter = new TestEmitter();
    const after = vi.fn();
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    emitter.on('tick', () => { throw new Error('listener bug'); });
    emitter.on('tick', after);
    emitter.fire('tick', 1);
    expect(after).toHaveBeenCalledWith(1);
    expect(logged).toHaveBeenCalledWith('[tradingview] Listener threw:', expect.objectContaining({ message: 'listener bug' }));
  });
});
