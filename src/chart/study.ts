import { TradingViewError } from '../errors.js';
import { Emitter } from '../events.js';
import { BuiltInIndicator } from '../indicators/builtin-indicator.js';
import type { Indicator } from '../indicators/index.js';
import { PineIndicator } from '../indicators/pine-indicator.js';
import { decodeCompressed } from '../protocol/compression.js';
import type { ServerPacket } from '../protocol/framing.js';
import { createSessionId } from '../protocol/ids.js';
import {
  applyGraphicsCommands, parseGraphics, type GraphicsData, type RawGraphics,
} from './graphics.js';
import {
  mergeStrategyReport, type StrategyReport, type StrategyReportChange,
} from './strategy.js';

/** One study row: `$time` (Unix seconds) plus one entry per plot. */
export interface StudyValue {
  $time: number;
  [plot: string]: number;
}

export type StudyChange = 'plots' | 'graphic' | StrategyReportChange;

export interface StudyEvents {
  [event: string]: unknown[];
  /** The server started (re)computing the study. */
  loading: [];
  /** The study finished computing over the loaded bars. */
  ready: [];
  update: [changes: StudyChange[]];
  error: [error: TradingViewError];
}

/** @internal Link between a study and its chart. */
export interface StudyBridge {
  chartId: string;
  send(method: string, params: unknown[]): void;
  barsBack(): Map<number, number>;
  log(...args: unknown[]): void;
  unregister(id: string): void;
}

function assertIndicator(indicator: unknown): asserts indicator is Indicator {
  if (!(indicator instanceof PineIndicator) && !(indicator instanceof BuiltInIndicator)) {
    throw new TradingViewError(
      'INVALID_ARGUMENT',
      'The indicator must be a PineIndicator (see getIndicator) or a BuiltInIndicator',
    );
  }
}

/** Formats a `study_error` payload into a readable message. */
function studyErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const { error: template, ctx } = error as { error: unknown; ctx?: Record<string, unknown> };
    if (typeof template === 'string') {
      return template.replace(/\{(\w+)\}/g, (all: string, key: string) => (ctx && key in ctx ? String(ctx[key]) : all));
    }
  }
  return typeof error === 'string' ? error : JSON.stringify(error);
}

/** An indicator running on a chart. Create it with `chart.createStudy(indicator)`. */
export class Study extends Emitter<StudyEvents> {
  readonly id = createSessionId('st');

  readonly #bridge: StudyBridge;

  readonly #values = new Map<number, StudyValue>();

  readonly #graphics: RawGraphics = {};

  #graphicIndexes: number[] = [];

  #strategyReport: StrategyReport = { trades: [], history: {}, performance: {} };

  #indicator: Indicator;

  #removed = false;

  #ready = false;

  /** @internal Use `chart.createStudy()`. */
  constructor(bridge: StudyBridge, indicator: Indicator) {
    super();
    assertIndicator(indicator);
    this.#bridge = bridge;
    this.#indicator = indicator;
  }

  /** @internal */
  create(): void {
    this.#bridge.send('create_study', [
      this.#bridge.chartId, this.id, 'st1', '$prices', this.#indicator.type, this.#indicator.toStudyInputs(),
    ]);
  }

  /** The indicator definition running in this study. */
  get indicator(): Indicator {
    return this.#indicator;
  }

  /** True after the first `study_completed`. */
  get isReady(): boolean {
    return this.#ready;
  }

  /** True after `remove()` or when the chart is gone. */
  get isRemoved(): boolean {
    return this.#removed;
  }

  /** Plot values, oldest first. */
  get values(): StudyValue[] {
    return [...this.#values.values()].sort((a, b) => a.$time - b.$time);
  }

  /** Drawings (labels, lines, boxes, tables...) produced by the indicator. */
  get graphics(): GraphicsData {
    const barsBack = this.#bridge.barsBack();
    return parseGraphics(this.#graphics, this.#graphicIndexes.map((index) => barsBack.get(index)));
  }

  /** Strategy report (Pine strategies only). */
  get strategyReport(): StrategyReport {
    return this.#strategyReport;
  }

  /** Replaces the indicator (typically the same script with new inputs). */
  setIndicator(indicator: Indicator): void {
    assertIndicator(indicator);
    if (this.#removed) throw new TradingViewError('INVALID_STATE', 'The study is removed');
    this.#indicator = indicator;
    this.#bridge.send('modify_study', [this.#bridge.chartId, this.id, 'st1', indicator.toStudyInputs()]);
  }

  /** Removes the study from the chart. Idempotent. */
  remove(): void {
    if (this.#removed) return;
    this.#bridge.send('remove_study', [this.#bridge.chartId, this.id]);
    this.#removed = true;
    this.#bridge.unregister(this.id);
  }

  /** @internal Called when the chart or connection is gone; `error` is reported if set. */
  dispose(error?: TradingViewError): void {
    if (this.#removed) return;
    this.#removed = true;
    if (error) this.emit('error', error);
  }

  /** @internal Packets addressed to this study (`study_*`). */
  onPacket(packet: ServerPacket): void {
    this.#bridge.log('study', this.id, packet);
    switch (packet.m) {
      case 'study_loading':
        this.emit('loading');
        return;
      case 'study_completed':
        this.#ready = true;
        this.emit('ready');
        return;
      case 'study_error':
        this.emit('error', new TradingViewError('STUDY_ERROR', `Study error: ${studyErrorMessage(packet.p[3])}`, {
          details: packet.p.slice(3),
        }));
        return;
      default:
    }
  }

  /** @internal Data from `timescale_update` / `du`. */
  onData(data: any): void {
    if (!data || typeof data !== 'object') return;
    const changes: StudyChange[] = [];

    if (Array.isArray(data.st) && data.st.length > 0) {
      const { plots } = this.#indicator instanceof PineIndicator ? this.#indicator : { plots: undefined };
      for (const row of data.st) {
        const value = {} as StudyValue;
        (row.v as number[]).forEach((plot, i) => {
          if (i === 0) {
            value.$time = plot;
            return;
          }
          const name = plots?.[`plot_${i - 1}`];
          if (name && !(name in value)) value[name] = plot;
          else value[`plot_${i - 1}`] = plot;
        });
        this.#values.set(value.$time, value);
      }
      changes.push('plots');
    }

    const ns = data.ns;
    if (ns?.d) {
      let parsed: any;
      try {
        parsed = JSON.parse(ns.d);
      } catch (error) {
        this.emit('error', new TradingViewError('PARSE_ERROR', 'Unable to parse study data', { cause: error }));
      }

      if (parsed?.graphicsCmds) {
        applyGraphicsCommands(this.#graphics, parsed.graphicsCmds);
        changes.push('graphic');
      }

      if (parsed?.dataCompressed) {
        try {
          const decoded = decodeCompressed(parsed.dataCompressed) as any;
          changes.push(...mergeStrategyReport(this.#strategyReport, decoded?.report));
        } catch (error) {
          this.emit('error', new TradingViewError('PARSE_ERROR', 'Unable to parse compressed strategy report', {
            cause: error,
          }));
        }
      }

      if (parsed?.data?.report) changes.push(...mergeStrategyReport(this.#strategyReport, parsed.data.report));
    }

    if (Array.isArray(ns?.indexes)) this.#graphicIndexes = ns.indexes;

    this.emit('update', changes);
  }
}
