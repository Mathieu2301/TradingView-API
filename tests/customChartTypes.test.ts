import { describe, it, expect } from 'vitest';
import TradingView from '../main';
import utils from './utils';

describe('CustomChartTypes', () => {
  let client: TradingView.Client;
  let chart: InstanceType<typeof client.Session.Chart>;

  it('creates a client', async () => {
    client = new TradingView.Client();
    expect(client).toBeDefined();
  });

  it('creates a chart', async () => {
    chart = new client.Session.Chart();
    expect(chart).toBeDefined();
  });

  it('sets chart type to HeikinAshi', async () => {
    console.log('Setting chart type to: HeikinAshi');

    chart.setMarket('BINANCE:BTCEUR', {
      type: 'HeikinAshi',
      timeframe: 'D',
    });

    while (
      chart.infos.full_name !== 'BINANCE:BTCEUR'
      || !chart.periods.length
    ) await utils.wait(100);

    expect(chart.infos.full_name).toBe('BINANCE:BTCEUR');
    expect(chart.periods.length).toBe(100);
    expect(
      utils.calculateTimeGap(chart.periods),
    ).toBe(86400);
  });

  it('sets chart type to Renko', async () => {
    console.log('Setting chart type to: Renko');

    chart.setMarket('BINANCE:ETHEUR', {
      type: 'Renko',
      timeframe: 'D',
      inputs: {
        source: 'close',
        sources: 'Close',
        boxSize: 3,
        style: 'ATR',
        atrLength: 14,
        wicks: true,
      },
    });

    while (
      chart.infos.full_name !== 'BINANCE:ETHEUR'
      || !chart.periods.length
    ) await utils.wait(100);

    expect(chart.infos.full_name).toBe('BINANCE:ETHEUR');
  });

  it('sets chart type to LineBreak', async () => {
    console.log('Setting chart type to: LineBreak');

    chart.setMarket('BINANCE:BTCEUR', {
      type: 'LineBreak',
      timeframe: 'D',
      inputs: {
        source: 'close',
        lb: 3,
      },
    });

    while (
      chart.infos.full_name !== 'BINANCE:BTCEUR'
      || !chart.periods.length
    ) await utils.wait(100);

    expect(chart.infos.full_name).toBe('BINANCE:BTCEUR');
    expect(chart.periods.length).toBeGreaterThan(0);
  });

  it('sets chart type to Kagi', async () => {
    console.log('Setting chart type to: Kagi');

    chart.setMarket('BINANCE:ETHEUR', {
      type: 'Kagi',
      timeframe: 'D',
      inputs: {
        source: 'close',
        style: 'ATR',
        atrLength: 14,
        reversalAmount: 1,
      },
    });

    while (
      chart.infos.full_name !== 'BINANCE:ETHEUR'
      || !chart.periods.length
    ) await utils.wait(100);

    expect(chart.infos.full_name).toBe('BINANCE:ETHEUR');
    expect(chart.periods.length).toBeGreaterThan(0);
  });

  it('sets chart type to PointAndFigure', async () => {
    console.log('Setting chart type to: PointAndFigure');

    chart.setMarket('BINANCE:BTCEUR', {
      type: 'PointAndFigure',
      timeframe: 'D',
      inputs: {
        sources: 'Close',
        reversalAmount: 3,
        boxSize: 1,
        style: 'ATR',
        atrLength: 14,
        oneStepBackBuilding: false,
      },
    });

    while (
      chart.infos.full_name !== 'BINANCE:BTCEUR'
      || !chart.periods.length
    ) await utils.wait(100);

    expect(chart.infos.full_name).toBe('BINANCE:BTCEUR');
    expect(chart.periods.length).toBeGreaterThan(0);
  });

  it('sets chart type to Range', async () => {
    console.log('Setting chart type to: Range');

    chart.setMarket('BINANCE:ETHEUR', {
      type: 'Range',
      timeframe: 'D',
      inputs: {
        range: 1,
        phantomBars: false,
      },
    });

    while (
      chart.infos.full_name !== 'BINANCE:ETHEUR'
      || !chart.periods.length
    ) await utils.wait(100);

    expect(chart.infos.full_name).toBe('BINANCE:ETHEUR');
    expect(chart.periods.length).toBeGreaterThanOrEqual(99);
    expect(chart.periods.length).toBeLessThanOrEqual(101);
  });

  it('closes chart', async () => {
    console.log('Waiting 1 second...');
    await utils.wait(1000);
    console.log('Closing the chart...');
    chart.delete();
  });

  it('closes client', async () => {
    console.log('Waiting 1 second...');
    await utils.wait(1000);
    console.log('Closing the client...');
    await client.end();
  });
});
