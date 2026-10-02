/**
 * https://github.com/Mathieu2301/TradingView-API
 * https://www.npmjs.com/package/@mathieuc/tradingview
 */
import {
  describe, expect, it, vi,
} from 'vitest';
import { fetchCandles, TradingViewProvider, watchCandles } from '../agent.ts';

const bar = (time: number, close: number) => ({
  time, open: close - 1, max: close + 1, min: close - 2, close, volume: 3,
});

function transport() {
  let chart: any;
  let client: any;
  class Chart {
    periods: ReturnType<typeof bar>[] = [];

    symbolLoaded?: () => void;

    update?: () => void;

    error?: (...messages: unknown[]) => void;

    delete = vi.fn();

    setMarket = vi.fn();

    onSymbolLoaded(cb: () => void) { this.symbolLoaded = cb; }

    onUpdate(cb: () => void) { this.update = cb; }

    onError(cb: (...messages: unknown[]) => void) { this.error = cb; }

    constructor() { chart = this; }
  }
  class Client {
    Session = { Chart };

    disconnected?: () => void;

    error?: (...messages: unknown[]) => void;

    end = vi.fn(async () => {});

    onDisconnected(cb: () => void) { this.disconnected = cb; }

    onError(cb: (...messages: unknown[]) => void) { this.error = cb; }

    constructor() { client = this; }
  }
  const provider = new TradingViewProvider({ clientFactory: () => new Client() as any });
  return {
    provider,
    get chart() { return chart as Chart; },
    get client() { return client as Client; },
  };
}

describe('agent-friendly candles API', () => {
  it('fetches one snapshot and releases both resources', async () => {
    const fake = transport();
    const pending = fetchCandles({ symbol: 'BINANCE:BTCUSDT', timeframe: 'D', limit: 2 }, fake.provider);
    fake.chart.periods = [bar(200, 20), bar(100, 10)];
    fake.chart.symbolLoaded?.();
    const candles = await pending;
    expect(candles).toEqual([
      {
        time: 100, open: 9, high: 11, low: 8, close: 10, volume: 3,
      },
      {
        time: 200, open: 19, high: 21, low: 18, close: 20, volume: 3,
      },
    ]);
    expect(fake.chart.setMarket).toHaveBeenCalledWith('BINANCE:BTCUSDT', { timeframe: 'D', range: 2 });
    expect(fake.chart.delete).toHaveBeenCalledTimes(1);
    expect(fake.client.end).toHaveBeenCalledTimes(1);
  });

  it('keeps a worker running until an idempotent stop', async () => {
    const fake = transport();
    const received: number[] = [];
    const pending = watchCandles({ symbol: 'BINANCE:BTCUSDT' }, {
      onData: (candles) => received.push(candles[candles.length - 1].close),
    }, fake.provider);
    fake.chart.symbolLoaded?.();
    fake.chart.periods = [bar(100, 10)];
    fake.chart.update?.();
    const worker = await pending;
    expect(worker.latest[worker.latest.length - 1]?.close).toBe(10);
    fake.chart.periods = [bar(200, 20)];
    fake.chart.update?.();
    expect(received).toEqual([10, 20]);
    await Promise.all([worker.stop(), worker.stop()]);
    fake.chart.update?.();
    expect(received).toEqual([10, 20]);
    expect(fake.chart.delete).toHaveBeenCalledTimes(1);
    expect(fake.client.end).toHaveBeenCalledTimes(1);
  });

  it('times out and cleans up if the first snapshot never arrives', async () => {
    const fake = transport();
    const pending = fetchCandles({ symbol: 'BINANCE:BTCUSDT', timeoutMs: 5 }, fake.provider);
    await expect(pending).rejects.toThrow('Timed out');
    expect(fake.chart.delete).toHaveBeenCalledTimes(1);
    expect(fake.client.end).toHaveBeenCalledTimes(1);
  });

  it('rejects and cleans up on disconnect before the first snapshot', async () => {
    const fake = transport();
    const pending = fetchCandles({ symbol: 'BINANCE:BTCUSDT' }, fake.provider);
    fake.client.disconnected?.();
    await expect(pending).rejects.toThrow('disconnected');
    expect(fake.chart.delete).toHaveBeenCalledTimes(1);
  });

  const abortTest = typeof AbortController === 'undefined' ? it.skip : it;
  abortTest('aborts a pending request and releases the transport', async () => {
    const fake = transport();
    const controller = new AbortController();
    const pending = fetchCandles({ symbol: 'BINANCE:BTCUSDT', signal: controller.signal }, fake.provider);
    controller.abort();
    await expect(pending).rejects.toThrow(/abort/i);
    expect(fake.chart.delete).toHaveBeenCalledTimes(1);
    expect(fake.client.end).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid requests before opening a connection', async () => {
    const fake = transport();
    await expect(fetchCandles({ symbol: '', limit: 0 }, fake.provider)).rejects.toThrow('symbol');
    expect(fake.client).toBeUndefined();
  });
});
