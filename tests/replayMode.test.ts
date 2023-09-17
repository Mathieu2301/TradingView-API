import { describe, it, expect } from 'vitest';
import TradingView from '../main';
import utils from './utils';

describe('ReplayMode', () => {
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

  it('sets market', async () => {
    chart.setMarket('BINANCE:BTCEUR', {
      timeframe: 'D',
      replay: Math.round(Date.now() / 1000) - 86400 * 10,
      range: 1,
    });

    await new Promise((resolve) => {
      chart.onSymbolLoaded(() => {
        console.log('Chart loaded');
        resolve(true);
      });
    });

    expect(chart.infos.full_name).toBe('BINANCE:BTCEUR');
  });

  it('steps forward manually', async () => {
    let finished = false;

    async function step() {
      if (finished) return;
      await chart.replayStep(1);
      await utils.wait(100);
      console.log('Replay step');
      await step();
    }
    step();

    chart.onReplayPoint((p: number) => {
      console.log('Last point ->', p);
    });

    chart.onReplayEnd(async () => {
      console.log('Replay end');
      finished = true;
    });

    await new Promise((resolve) => {
      chart.onReplayEnd(() => {
        finished = true;
        resolve(true);
      });
    });

    expect(
      utils.calculateTimeGap(chart.periods),
    ).toBe(24 * 60 * 60);

    expect(chart.periods.length).toBeGreaterThanOrEqual(9);
    expect(chart.periods.length).toBeLessThanOrEqual(11);
  });

  it('sets market', async () => {
    chart.setMarket('BINANCE:BTCEUR', {
      timeframe: 'D',
      replay: Math.round(Date.now() / 1000) - 86400 * 10,
      range: 1,
    });

    await new Promise((resolve) => {
      chart.onSymbolLoaded(() => {
        console.log('Chart loaded');
        resolve(true);
      });
    });

    expect(chart.infos.full_name).toBe('BINANCE:BTCEUR');
  });

  it('steps forward automatically', async () => {
    console.log('Play replay mode');
    await chart.replayStart(200);

    chart.onUpdate(() => {
      console.log('Point ->', chart.periods[0].time);
    });

    await new Promise((resolve) => {
      chart.onReplayEnd(() => {
        console.log('Replay end');
        resolve(true);
      });
    });

    expect(
      utils.calculateTimeGap(chart.periods),
    ).toBe(24 * 60 * 60);

    expect(chart.periods.length).toBeGreaterThanOrEqual(9);
    expect(chart.periods.length).toBeLessThanOrEqual(11);
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
