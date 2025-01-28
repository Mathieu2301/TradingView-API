import { describe, it, expect } from 'vitest';
import TradingView from '../main';

const token = <string>process.env.SESSION;
const signature = <string>process.env.SIGNATURE;

describe('Indicators', () => {
  const indicators: { [name: string]: TradingView.PineIndicator } = {};

  it('gets Supertrend strategy', async () => {
    indicators.SuperTrend = await TradingView.getIndicator('STD;Supertrend%Strategy');
    expect(indicators.SuperTrend).toBeDefined();
    expect(indicators.SuperTrend.description).toBe('Supertrend Strategy');

    indicators.SuperTrend.setOption('commission_type', 'percent');
    indicators.SuperTrend.setOption('commission_value', 0);
    indicators.SuperTrend.setOption('initial_capital', 25000);
    indicators.SuperTrend.setOption('default_qty_value', 20);
    indicators.SuperTrend.setOption('default_qty_type', 'percent_of_equity');
    indicators.SuperTrend.setOption('currency', 'EUR');
    indicators.SuperTrend.setOption('pyramiding', 10);

    expect(indicators.SuperTrend).toBeDefined();
  });

  it('gets MarketCipher B study', async () => {
    indicators.CipherB = await TradingView.getIndicator('PUB;uA35GeckoTA2EfgI63SD2WCSmca4njxp');
    expect(indicators.CipherB).toBeDefined();
    expect(indicators.CipherB.description).toBe('VuManChu B Divergences');

    indicators.CipherB.setOption('Show_WT_Hidden_Divergences', true);
    indicators.CipherB.setOption('Show_Stoch_Regular_Divergences', true);
    indicators.CipherB.setOption('Show_Stoch_Hidden_Divergences', true);

    expect(indicators.CipherB).toBeDefined();
  });

  let client: TradingView.Client;
  let chart: InstanceType<typeof client.Session.Chart>;

  const noAuth = !token || !signature;

  it.skipIf(noAuth)('creates a client', async () => {
    client = new TradingView.Client({ token, signature });
    expect(client).toBeDefined();
  });

  it.skipIf(noAuth)('creates a chart', async () => {
    chart = new client.Session.Chart();
    expect(chart).toBeDefined();
  });

  it.skipIf(noAuth)('sets market', async () => {
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

  it.skipIf(noAuth).concurrent('gets performance data from SuperTrend strategy', async () => {
    const SuperTrend = new chart.Study(indicators.SuperTrend);

    let QTY = 10;
    const perfResult = await new Promise((resolve) => {
      SuperTrend.onUpdate(() => {
        // SuperTrend is a strategy so it sends a strategy report
        const perfReport = SuperTrend.strategyReport.performance;

        console.log('Performances:', {
          total: {
            trades: perfReport?.all?.totalTrades,
            perf: `${Math.round((
              perfReport?.all?.netProfitPercent || 0
            ) * 10000) / 100} %`,
          },
          buy: {
            trades: perfReport?.long?.totalTrades,
            perf: `${Math.round((
              perfReport?.long?.netProfitPercent || 0
            ) * 10000) / 100} %`,
          },
          sell: {
            trades: perfReport?.short?.totalTrades,
            perf: `${Math.round((
              perfReport?.short?.netProfitPercent || 0
            ) * 10000) / 100} %`,
          },
        });

        if (QTY >= 50) {
          resolve(true);
          return;
        }

        QTY += 10;
        console.log('TRY WITH', QTY, '%');
        setTimeout(() => {
          indicators.SuperTrend.setOption('default_qty_value', QTY);
          SuperTrend.setIndicator(indicators.SuperTrend);
        }, 1000);
      });
    });

    expect(perfResult).toBe(true);

    SuperTrend.remove();
  }, 10000);

  it.skipIf(noAuth).concurrent('gets data from MarketCipher B study', async () => {
    const CipherB = new chart.Study(indicators.CipherB);

    const lastResult: any = await new Promise((resolve) => {
      CipherB.onUpdate(() => {
        resolve(CipherB.periods[0]);
      });
    });

    console.log('MarketCipher B last values:', {
      VWAP: Math.round(lastResult.VWAP * 1000) / 1000,
      moneyFlow: (lastResult.rsiMFI >= 0) ? 'POSITIVE' : 'NEGATIVE',
      buyCircle: lastResult.Buy_and_sell_circle && lastResult.VWAP > 0,
      sellCircle: lastResult.Buy_and_sell_circle && lastResult.VWAP < 0,
    });

    expect(lastResult.VWAP).toBeTypeOf('number');
    expect(lastResult.rsiMFI).toBeTypeOf('number');
    expect(lastResult.Buy_and_sell_circle).toBeTypeOf('number');

    CipherB.remove();
  });

  it.skipIf(noAuth)('removes chart', () => {
    console.log('Closing the chart...');
    chart.delete();
  });

  it.skipIf(noAuth)('removes client', async () => {
    console.log('Closing the client...');
    await client.end();
  });
});
