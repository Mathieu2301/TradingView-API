import { describe, it, expect } from 'vitest';
import TradingView from '../main';
import utils from './utils';

describe('Simple chart session', async () => {
  let client: TradingView.Client;
  let chart: InstanceType<typeof client.Session.Chart>;

  it('creates a client', () => {
    client = new TradingView.Client();
    expect(client).toBeDefined();
  });

  it('creates a chart session', () => {
    chart = new client.Session.Chart();
    expect(chart).toBeDefined();
  });

  it('sets market', async () => {
    chart.setMarket('BINANCE:BTCEUR', {
      timeframe: 'D',
    });

    while (
      chart.infos.full_name !== 'BINANCE:BTCEUR'
      || chart.periods.length < 10
    ) await utils.wait(100);

    expect(chart.infos.full_name).toBe('BINANCE:BTCEUR');
    expect(
      utils.calculateTimeGap(chart.periods),
    ).toBe(24 * 60 * 60);
  });

  it('sets timeframe', async () => {
    console.log('Waiting 1 second...');
    await utils.wait(1000);

    console.log('Setting timeframe to 15 minutes...');
    chart.setSeries('15');

    while (chart.periods.length < 10) await utils.wait(100);
    console.log('Chart timeframe set');

    expect(
      utils.calculateTimeGap(chart.periods),
    ).toBe(15 * 60);
  });

  it('sets chart type', async () => {
    console.log('Waiting 1 second...');
    await utils.wait(1000);

    console.log('Setting the chart type to "Heikin Ashi"...');
    chart.setMarket('BINANCE:ETHEUR', {
      timeframe: 'D',
      type: 'HeikinAshi',
    });

    while (chart.infos.full_name !== 'BINANCE:ETHEUR') await utils.wait(100);

    console.log('Chart type set');
    expect(chart.infos.full_name).toBe('BINANCE:ETHEUR');
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
