import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TradingViewClient } from '../../src/client/client.js';
import { applyGraphicsCommands, parseGraphics } from '../../src/chart/graphics.js';
import { BuiltInIndicator } from '../../src/indicators/builtin-indicator.js';
import { FakeServer, until } from '../helpers/fake-server.js';
import { makePine } from '../helpers/indicators.js';

const compressed = JSON.parse(readFileSync(new URL('../fixtures/compressed-report.json', import.meta.url), 'utf8'));

async function setup(options: ConstructorParameters<typeof FakeServer>[0] = {}) {
  const server = new FakeServer({ history: 10, ...options });
  const client = new TradingViewClient({ transport: server.transport });
  await client.ready;
  const chart = client.createChart();
  chart.setMarket('BINANCE:BTCEUR', { count: 5 });
  return { server, client, chart, connection: server.last };
}

describe('Study', () => {
  it('creates a Pine study, names plots and keeps duplicates under plot_N', async () => {
    const { client, chart, connection, server } = await setup({ studyPlots: 3 });
    const pine = makePine();
    const study = chart.createStudy(pine);
    const events: string[] = [];
    study.onAny((event) => { events.push(event); });
    await until(() => study.isReady);

    expect(connection.packets('create_study')[0].p).toEqual([
      chart.id, study.id, 'st1', '$prices', 'Script@tv-scripting-101!', pine.toStudyInputs(),
    ]);
    expect(study.values).toHaveLength(5);
    expect(study.values.at(-1)).toEqual({
      $time: server.barTime(9), Value: 9, plot_1: 9.1, Signal: 9.2,
    });
    expect(events).toEqual(['loading', 'update', 'ready']);
    expect(chart.studies).toEqual([study]);
    await client.close();
  });

  it('modifies and removes a study', async () => {
    const { client, chart, connection } = await setup();
    const study = chart.createStudy(new BuiltInIndicator('Volume@tv-basicstudies-241'));
    const updated = new BuiltInIndicator('Volume@tv-basicstudies-241', { length: 50 });
    study.setIndicator(updated);
    expect(connection.packets('modify_study')[0].p).toEqual([chart.id, study.id, 'st1', { length: 50, col_prev_close: false }]);
    expect(study.indicator).toBe(updated);
    expect(() => study.setIndicator({} as any)).toThrow(/PineIndicator/);
    study.remove();
    study.remove();
    expect(connection.packets('remove_study')).toEqual([{ m: 'remove_study', p: [chart.id, study.id] }]);
    expect(chart.studies).toEqual([]);
    expect(() => chart.createStudy('STD;RSI' as any)).toThrow(/PineIndicator/);
    await client.close();
  });

  it('formats study errors with their context', async () => {
    const { client, chart } = await setup({
      studyError: {
        error: "Invalid value of the '{argName}' argument ({value}) in the '{funName}' function.",
        ctx: { argName: 'factor', value: -1, funName: 'supertrend' },
      },
    });
    const study = chart.createStudy(makePine());
    const error = await new Promise<any>((resolve) => { study.on('error', resolve); });
    expect(error.code).toBe('STUDY_ERROR');
    expect(error.message).toBe("Study error: Invalid value of the 'factor' argument (-1) in the 'supertrend' function.");
    await client.close();
  });

  it('reads graphics commands and positions them in bars back from the latest bar', async () => {
    const { client, chart, server } = await setup({
      studyNs: () => ({
        graphicsCmds: {
          create: {
            dwglabels: [{ data: [{ id: 1, x: 0, y: 10, yl: 'ab', t: 'Hi', st: 'lup', ci: 1, tci: 2, sz: 'small', ta: 'center', tt: 'tip' }] }],
            dwglines: [{ data: [{ id: 2, x1: 1, y1: 1, x2: 2, y2: 2, ex: 'r', st: 'dsh', ci: 3, w: 1 }] }],
            dwgboxes: [{ data: [{ id: 3, x1: 0, y1: 1, x2: 2, y2: 0, c: 1, bc: 2, ex: 'n', st: 'dot', w: 2, t: 'Box', ts: 'auto', tc: 3, tva: 'top', tha: 'left', tw: 'none' }] }],
            dwgtables: [{ data: [{ id: 4, pos: 'top_right', rows: 1, cols: 2, bgc: 1, frmc: 2, frmw: 1, brdc: 3, brdw: 1 }] }],
            dwgtablecells: [{ data: [
              { id: 5, tid: 4, row: 0, col: 1, t: 'B', w: 0, h: 0, tc: 1, tha: 'center', tva: 'center', ts: 'auto', bgc: 2 },
              { id: 6, tid: 4, row: 0, col: 0, t: 'A', w: 0, h: 0, tc: 1, tha: 'center', tva: 'center', ts: 'auto', bgc: 2 },
            ] }],
            hhists: [{ data: [{ id: 7, priceLow: 1, priceHigh: 2, firstBarTime: 0, lastBarTime: 2, rate: [1, 2] }] }],
            horizlines: [{ data: [{ id: 8, level: 5, startIndex: 0, endIndex: 1, extendLeft: false, extendRight: true }] }],
            polygons: [{ data: [{ id: 9, points: [{ index: 1, level: 3 }] }] }],
          },
        },
      }),
    });
    const study = chart.createStudy(makePine());
    await until(() => study.isReady && chart.candles.length === 5);
    // Fake graphic indexes [0, 1, 2] map to bar indexes 0..2 = the 5th, 4th and 3rd most recent bars.
    const { graphics } = study;
    expect(graphics.labels).toEqual([{
      id: 1, x: 4, y: 10, yLoc: 'abovebar', text: 'Hi', style: 'label_up', color: 1, textColor: 2, size: 'small', textAlign: 'center', toolTip: 'tip',
    }]);
    expect(graphics.lines[0]).toMatchObject({ x1: 3, x2: 2, extend: 'right', style: 'dashed' });
    expect(graphics.boxes[0]).toMatchObject({ x1: 4, x2: 2, extend: 'none', style: 'dotted', text: 'Box' });
    expect(graphics.tables[0]).toMatchObject({ position: 'top_right', columns: 2 });
    expect(graphics.tables[0].cells.map((row) => row.map((cell) => cell.text))).toEqual([['A', 'B']]);
    expect(graphics.horizHists[0]).toMatchObject({ firstBarTime: 4, lastBarTime: 2, rate: [1, 2] });
    expect(graphics.horizLines[0]).toMatchObject({ startIndex: 4, endIndex: 3, extendRight: true });
    expect(graphics.polygons[0].points).toEqual([{ index: 3, level: 3 }]);
    expect(Object.keys(graphics.raw)).toContain('dwglabels');
    expect(server.options.history).toBe(10);
    await client.close();
  });

  it('applies erase commands', () => {
    const raw: any = {};
    applyGraphicsCommands(raw, { create: { dwglabels: [{ data: [{ id: 1 }, { id: 2 }] }], dwglines: [{ data: [{ id: 3 }] }] } });
    applyGraphicsCommands(raw, { erase: [{ action: 'one', type: 'dwglabels', id: 1 }, { action: 'one', id: 99 }] });
    expect(Object.keys(raw.dwglabels)).toEqual(['2']);
    applyGraphicsCommands(raw, { erase: [{ action: 'all', type: 'dwglines' }] });
    expect(raw.dwglines).toBeUndefined();
    applyGraphicsCommands(raw, { erase: [{ action: 'all' }] });
    expect(raw).toEqual({ dwglabels: {} });
    expect(parseGraphics(raw).labels).toEqual([]);
  });

  it('decodes plain and compressed strategy reports', async () => {
    const plainReport = { report: { currency: 'USD', performance: { all: { totalTrades: 1 } } } };
    for (const ns of [{ data: plainReport }, { dataCompressed: compressed.zipDeflated }]) {
      const { client, chart } = await setup({ studyNs: () => ns });
      const study = chart.createStudy(makePine().setType('StrategyScript@tv-scripting-101!'));
      const changes: string[][] = [];
      study.on('update', (c) => changes.push(c));
      await until(() => study.isReady);
      if ('data' in ns) {
        expect(study.strategyReport).toMatchObject({ currency: 'USD', performance: { all: { totalTrades: 1 } } });
        expect(changes[0]).toEqual(['plots', 'report.currency', 'report.perf']);
      } else {
        const report = study.strategyReport;
        expect(report.currency).toBe('EUR');
        expect(report.settings?.dateRange?.backtest).toEqual({ from: 1, to: 2 });
        expect(report.trades.map((t) => t.entry.type)).toEqual(['short', 'long']);
        expect(report.trades[0]).toMatchObject({
          entry: { name: 'Short', value: 110 }, exit: { name: '', value: 105 }, quantity: 2, profit: { v: 10, p: 0.05 },
        });
        expect(report.history.equity).toEqual([1, 2]);
        expect(changes[0]).toEqual(['plots', 'report.currency', 'report.settings', 'report.perf', 'report.trades', 'report.history']);
      }
      await client.close();
    }
  });

  it('reports undecodable strategy reports as PARSE_ERROR', async () => {
    const { client, chart } = await setup({ studyNs: () => ({ dataCompressed: 'bm90IGpzb24' }) });
    const study = chart.createStudy(makePine());
    const error = await new Promise<any>((resolve) => { study.on('error', resolve); });
    expect(error.code).toBe('PARSE_ERROR');
    await client.close();
  });
});
