import type {
  Transport, TransportFactory, TransportHandlers, TransportRequest,
} from '../../src/client/transport.js';
import { decodeFrames, encodeFrame } from '../../src/protocol/framing.js';

export interface SentPacket {
  m: string;
  p: any[];
}

type Handler = (connection: FakeConnection, packet: SentPacket) => boolean | void;

/** In-memory websocket connection driven by `FakeServer`. */
export class FakeConnection implements Transport {
  isOpen = false;

  closed = false;

  readonly sent: SentPacket[] = [];

  readonly raw: string[] = [];

  readonly heartbeats: number[] = [];

  constructor(
    readonly server: FakeServer,
    readonly request: TransportRequest,
    readonly handlers: TransportHandlers,
  ) {}

  open(): void {
    this.isOpen = true;
    this.handlers.onOpen();
  }

  send(data: string): void {
    if (!this.isOpen) throw new Error('FakeConnection: send while closed');
    this.raw.push(data);
    for (const frame of decodeFrames(data)) {
      if (frame.type === 'heartbeat') this.heartbeats.push(frame.id);
      if (frame.type !== 'packet') continue;
      const packet = { m: frame.packet.m, p: frame.packet.p as any[] };
      this.sent.push(packet);
      this.server.handle(this, packet);
    }
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.isOpen = false;
    setTimeout(() => this.handlers.onClose(1000, ''), 0);
  }

  /** Server → client: one websocket message containing these frames. */
  push(...payloads: Array<object | string>): void {
    if (this.closed) return;
    this.handlers.onMessage(payloads.map((payload) => encodeFrame(payload)).join(''));
  }

  /** Server → client, asynchronously (like the network). */
  pushLater(...payloads: Array<object | string>): void {
    setTimeout(() => this.push(...payloads), 0);
  }

  /** Simulates a server-side disconnection. */
  drop(code = 1006, reason = 'Connection lost'): void {
    if (this.closed) return;
    this.closed = true;
    this.isOpen = false;
    this.handlers.onClose(code, reason);
  }

  /** Packets sent with a method. */
  packets(method: string): SentPacket[] {
    return this.sent.filter((packet) => packet.m === method);
  }
}

export interface FakeMarketOptions {
  /** Bars available per symbol. Default: 1000. */
  history?: number;
  /** Maximum bars returned per request (simulates server batches). */
  batchLimit?: number;
  /** Reason sent when history is exhausted. Default: `end`. */
  endReason?: 'end' | 'limit';
  /** Seconds between bars. Default: 86 400. */
  step?: number;
  /** Time of the newest bar. Default: 1 800 000 000 rounded to `step`. */
  now?: number;
  /** Symbols answered with `symbol_error`. */
  invalidSymbols?: string[];
  /** Plot count produced by studies. Default: 1. */
  studyPlots?: number;
  /** `ns.d` payload sent with study data (graphics, reports). */
  studyNs?: (studyType: string) => object | undefined;
  /** Error payload sent instead of study data. */
  studyError?: unknown;
  /** Number of replay steps before `replay_data_end`. Default: 3. */
  replaySteps?: number;
}

interface ChartState {
  symbols: Map<string, string>;
  seriesId?: string;
  symbol?: string;
  loaded: number;
  firstPosition: number;
  studies: Map<string, string>;
}

/**
 * Scriptable fake of the TradingView websocket server. Supports charts,
 * deep history, studies, quotes and replay with deterministic data.
 */
export class FakeServer {
  readonly connections: FakeConnection[] = [];

  autoOpen = true;

  /** When false, chart/quote commands get no answer (timeout tests). */
  respond = true;

  readonly options: Required<Omit<FakeMarketOptions, 'batchLimit' | 'studyNs' | 'studyError'>>
  & Pick<FakeMarketOptions, 'batchLimit' | 'studyNs' | 'studyError'>;

  readonly #handlers = new Map<string, Handler>();

  readonly #charts = new Map<string, ChartState>();

  readonly #replaySteps = new Map<string, number>();

  constructor(options: FakeMarketOptions = {}) {
    const step = options.step ?? 86_400;
    this.options = {
      history: options.history ?? 1000,
      batchLimit: options.batchLimit,
      endReason: options.endReason ?? 'end',
      step,
      now: options.now ?? Math.floor(1_800_000_000 / step) * step,
      invalidSymbols: options.invalidSymbols ?? ['XXXXX'],
      studyPlots: options.studyPlots ?? 1,
      studyNs: options.studyNs,
      studyError: options.studyError,
      replaySteps: options.replaySteps ?? 3,
    };
  }

  readonly transport: TransportFactory = (request, handlers) => {
    const connection = new FakeConnection(this, request, handlers);
    this.connections.push(connection);
    if (this.autoOpen) setTimeout(() => connection.open(), 0);
    return connection;
  };

  get last(): FakeConnection {
    const connection = this.connections.at(-1);
    if (!connection) throw new Error('No connection yet');
    return connection;
  }

  /** Overrides the answer to a method. Return `false` to fall back to the default. */
  on(method: string, handler: Handler): void {
    this.#handlers.set(method, handler);
  }

  /** Bar time at a position in the full history (0 = oldest). */
  barTime(position: number): number {
    return this.options.now - (this.options.history - 1 - position) * this.options.step;
  }

  bar(position: number): number[] {
    const close = 100 + position;
    return [this.barTime(position), close - 1, close + 2, close - 3, close, 10 + position];
  }

  handle(connection: FakeConnection, packet: SentPacket): void {
    const custom = this.#handlers.get(packet.m);
    if (custom && custom(connection, packet) !== false) return;
    if (!this.respond) return;
    const method = `on_${packet.m}` as keyof this;
    const fn = this[method];
    if (typeof fn === 'function') fn.call(this, connection, packet.p);
  }

  #symbolOf(init: string): string {
    const parsed = JSON.parse(init.slice(1));
    return typeof parsed.symbol === 'string' ? parsed.symbol : parsed.symbol.symbol;
  }

  #pricesUpdate(chart: string, from: number, to: number, state: ChartState) {
    const bars = [];
    for (let position = from; position < to; position += 1) {
      bars.push({ i: position - state.firstPosition, v: this.bar(position) });
    }
    return { m: 'timescale_update', p: [chart, { $prices: { s: bars, ns: { d: '', indexes: [] }, t: 's1' } }, {}] };
  }

  #studyUpdate(chart: string, studyId: string, type: string, state: ChartState) {
    if (this.options.studyError !== undefined) {
      return { m: 'study_error', p: [chart, studyId, 's1_st1', this.options.studyError, 'node'] };
    }
    const first = this.options.history - state.loaded;
    const rows = [];
    for (let position = first; position < this.options.history; position += 1) {
      const values = Array.from({ length: this.options.studyPlots }, (_, plot) => position + plot / 10);
      rows.push({ i: position - state.firstPosition, v: [this.barTime(position), ...values] });
    }
    const ns = this.options.studyNs?.(type);
    return {
      m: 'du',
      p: [chart, { [studyId]: { st: rows, ns: { d: ns ? JSON.stringify(ns) : '', indexes: ns ? [0, 1, 2] : [] } } }],
    };
  }

  #completed(chart: string, state: ChartState, status = 'streaming') {
    const details: Record<string, unknown> = { rt_update_period: 5 };
    if (state.loaded >= this.options.history) details.data_completed = this.options.endReason;
    return { m: 'series_completed', p: [chart, '$prices', status, 's1', details] };
  }

  on_chart_create_session(_c: FakeConnection, [chart]: any[]) {
    this.#charts.set(chart, {
      symbols: new Map(), loaded: 0, firstPosition: 0, studies: new Map(),
    });
  }

  on_resolve_symbol(c: FakeConnection, [chart, seriesId, init]: any[]) {
    const state = this.#charts.get(chart);
    if (!state) return;
    const symbol = this.#symbolOf(init);
    if (this.options.invalidSymbols.includes(symbol)) {
      c.pushLater({ m: 'symbol_error', p: [chart, seriesId, 'invalid symbol'] });
      return;
    }
    state.symbols.set(seriesId, symbol);
    c.pushLater({
      m: 'symbol_resolved',
      p: [chart, seriesId, {
        name: symbol.split(':').pop(), full_name: symbol, pro_name: symbol, description: `Fake ${symbol}`,
        exchange: symbol.split(':')[0], currency_code: 'EUR', type: 'spot', pricescale: 100, minmov: 1,
        timezone: 'Etc/UTC', session: '24x7', has_intraday: true, fractional: false, is_tradable: true,
      }],
    });
  }

  on_create_series(c: FakeConnection, [chart, , , seriesId, , range]: any[]) {
    const state = this.#charts.get(chart);
    if (!state || !state.symbols.has(seriesId)) return;
    const count = Array.isArray(range) ? Math.abs(range[2]) : range;
    state.seriesId = seriesId;
    state.loaded = Math.min(count, this.options.history, this.options.batchLimit ?? Infinity);
    state.firstPosition = this.options.history - state.loaded;
    c.pushLater(
      { m: 'series_loading', p: [chart, '$prices', 's1'] },
      this.#pricesUpdate(chart, state.firstPosition, this.options.history, state),
      this.#completed(chart, state),
    );
  }

  on_modify_series(c: FakeConnection, [chart, , , seriesId]: any[]) {
    const state = this.#charts.get(chart);
    if (!state || !state.symbols.has(seriesId)) return;
    c.pushLater(
      this.#pricesUpdate(chart, this.options.history - state.loaded, this.options.history, state),
      this.#completed(chart, state),
    );
  }

  on_request_more_data(c: FakeConnection, [chart, , count]: any[]) {
    const state = this.#charts.get(chart);
    if (!state) return;
    const add = Math.max(0, Math.min(count, this.options.batchLimit ?? Infinity, this.options.history - state.loaded));
    const first = this.options.history - state.loaded - add;
    const end = this.options.history - state.loaded;
    state.loaded += add;
    const payloads: object[] = [{ m: 'series_loading', p: [chart, '$prices', 's1'] }];
    if (add > 0) payloads.push(this.#pricesUpdate(chart, first, end, state));
    for (const [studyId, type] of state.studies) {
      payloads.push(
        { m: 'study_loading', p: [chart, studyId, 's1_st1'] },
        this.#studyUpdate(chart, studyId, type, state),
        { m: 'study_completed', p: [chart, studyId, 's1_st1'] },
      );
    }
    payloads.push(this.#completed(chart, state));
    c.pushLater(...payloads);
  }

  on_create_study(c: FakeConnection, [chart, studyId, , , type]: any[]) {
    const state = this.#charts.get(chart);
    if (!state) return;
    state.studies.set(studyId, type);
    const update = this.#studyUpdate(chart, studyId, type, state);
    c.pushLater(
      { m: 'study_loading', p: [chart, studyId, 's1_st1'] },
      update,
      ...(update.m === 'study_error' ? [] : [{ m: 'study_completed', p: [chart, studyId, 's1_st1'] }]),
    );
  }

  on_quote_add_symbols(c: FakeConnection, [session, ...keys]: any[]) {
    for (const key of keys) {
      const symbol = key.startsWith('=') ? JSON.parse(key.slice(1)).symbol : key;
      if (this.options.invalidSymbols.includes(symbol)) {
        c.pushLater({ m: 'qsd', p: [session, { n: key, s: 'error', errmsg: 'no_such_symbol', v: {} }] });
        continue;
      }
      c.pushLater(
        {
          m: 'qsd',
          p: [session, {
            n: key, s: 'ok', v: { lp: 100, ch: 1, description: `Fake ${symbol}`, currency_code: 'EUR' },
          }],
        },
        { m: 'quote_completed', p: [session, key] },
      );
    }
  }

  on_replay_add_series(c: FakeConnection, [replay, request]: any[]) {
    c.pushLater({ m: 'replay_ok', p: [replay, request] });
  }

  on_replay_reset(c: FakeConnection, [replay, request, time]: any[]) {
    this.#replaySteps.set(replay, 0);
    c.pushLater(
      { m: 'replay_instance_id', p: [replay, 'replay-instance-1'] },
      { m: 'replay_ok', p: [replay, request] },
      { m: 'replay_point', p: [replay, time] },
      { m: 'replay_resolutions', p: [replay, '1D', '1S'] },
    );
  }

  on_replay_step(c: FakeConnection, [replay, request, count]: any[]) {
    const steps = (this.#replaySteps.get(replay) ?? 0) + count;
    this.#replaySteps.set(replay, steps);
    const payloads: object[] = [
      { m: 'replay_ok', p: [replay, request] },
      { m: 'replay_point', p: [replay, this.barTime(steps)] },
    ];
    if (steps >= this.options.replaySteps) payloads.push({ m: 'replay_data_end', p: [replay] });
    c.pushLater(...payloads);
  }

  on_replay_start(c: FakeConnection, [replay, request]: any[]) {
    c.pushLater({ m: 'replay_ok', p: [replay, request] });
  }

  on_replay_stop(c: FakeConnection, [replay, request]: any[]) {
    c.pushLater({ m: 'replay_ok', p: [replay, request] });
  }
}

/** Waits for pending timers/microtasks (fake server answers use `setTimeout(0)`). */
export const flush = (rounds = 3) => (async () => {
  for (let i = 0; i < rounds; i += 1) await new Promise((resolve) => { setTimeout(resolve, 0); });
})();

/** Polls until `predicate` is true. */
export async function until(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('until: timed out');
    await new Promise((resolve) => { setTimeout(resolve, 1); });
  }
}
