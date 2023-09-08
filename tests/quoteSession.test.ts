import { describe, it, expect } from 'vitest';
import TradingView from '../main';

describe('Quote session', () => {
  let client: TradingView.Client;
  let quoteSession: any;
  let BTC: any;

  it('creates client', () => {
    client = new TradingView.Client();
    expect(client).toBeDefined();
  });

  it('creates quote session', () => {
    quoteSession = new client.Session.Quote({ fields: 'all' });
    expect(quoteSession).toBeDefined();
  });

  it('asks for market BTCEUR', () => {
    BTC = new quoteSession.Market('BTCEUR');
    expect(BTC).toBeDefined();

    expect(new Promise((resolve) => {
      BTC.onLoaded(() => {
        console.log('BTCEUR quote loaded');
        resolve(true);
      });
    })).resolves.toBe(true);
  });

  it('data has all properties', () => {
    expect(new Promise((resolve) => {
      BTC.onData((data) => {
        const rsKeys = Object.keys(data);
        console.log('BTCEUR data received');
        if (rsKeys.length <= 2) return;
        resolve(rsKeys.sort());
      });
    })).resolves.toEqual(
      [
        'ask', 'bid', 'format',
        'volume', 'update_mode', 'type', 'timezone',
        'short_name', 'rtc_time', 'rtc', 'rchp', 'ch',
        'rch', 'provider_id', 'pro_name', 'pricescale',
        'prev_close_price', 'original_name', 'lp',
        'open_price', 'minmove2', 'minmov', 'lp_time',
        'low_price', 'is_tradable', 'high_price',
        'fractional', 'exchange', 'description',
        'current_session', 'currency_code', 'chp',
        'currency-logoid', 'base-currency-logoid',
      ].sort(),
    );
  });

  it('closes quote session', () => {
    BTC.close();
  });

  it('closes client', () => {
    client.end();
  });
});
