import { describe, it, expect } from 'vitest';
import TradingView from '../main';
import utils from './utils';

describe('BuiltInIndicator', () => {
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
      timeframe: '60',
    });

    await new Promise((resolve) => {
      chart.onSymbolLoaded(() => {
        console.log('Chart loaded');
        resolve(true);
      });
    });

    expect(chart.infos.full_name).toBe('BINANCE:BTCEUR');
  });

  it('gets volume profile', async () => {
    const volumeProfile = new TradingView.BuiltInIndicator('VbPFixed@tv-basicstudies-241!');
    volumeProfile.setOption('first_bar_time', Date.now() - 10 ** 8);

    const VOL = new chart.Study(volumeProfile);

    while (!VOL.graphic?.horizHists?.length) await utils.wait(100);
    expect(VOL.graphic?.horizHists).toBeDefined();

    const hists = VOL.graphic.horizHists
      .filter((h) => h.lastBarTime === 0) // We only keep recent volume infos
      .sort((a, b) => b.priceHigh - a.priceHigh);

    expect(hists.length).toBeGreaterThan(15);

    for (const hist of hists) {
      console.log(
        `~ ${Math.round((hist.priceHigh + hist.priceLow) / 2)} € :`,
        `${'_'.repeat(hist.rate[0] / 3)}${'_'.repeat(hist.rate[1] / 3)}`,
      );
    }
  });

  it('removes chart', () => {
    console.log('Closing the chart...');
    chart.delete();
  });

  it('removes client', async () => {
    console.log('Closing the client...');
    await client.end();
  });
});
