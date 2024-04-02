import { describe, it, expect } from 'vitest';
import TradingView from '../main';

const token = process.env.SESSION as string;
const signature = process.env.SIGNATURE as string;

describe('AllErrors', () => {
  const waitForError = (instance: any) => new Promise<string[]>((resolve) => {
    instance.onError((...error: string[]) => {
      resolve(error);
    });
  });

  it('throws an error when an invalid token is set', async () => {
    console.log('Testing "Credentials error" error:');

    const client = new TradingView.Client({
      token: 'FAKE_CREDENTIALS', // Set wrong credentials
    });

    const error = await waitForError(client);
    console.log('=> Client error:', error);

    expect(error).toBeDefined();
    expect(error[0]).toBe('Credentials error:');
    expect(error[1]).toBe('Wrong or expired sessionid/signature');
    expect(error.length).toBe(2);
  });

  it('throws an error when an invalid symbol is set', async () => {
    console.log('Testing "invalid symbol" error:');

    const client = new TradingView.Client();
    const chart = new client.Session.Chart();
    chart.setMarket('XXXXX');

    const error = await waitForError(chart);
    console.log('=> Chart error:', error);

    expect(error).toBeDefined();
    expect(error[0]).toBe('(ser_1) Symbol error:');
    expect(error[1]).toBe('invalid symbol');
    expect(error.length).toBe(2);
  });

  it('throws an error when an invalid timezome is set', async () => {
    console.log('Testing "invalid timezone" error:');

    const client = new TradingView.Client();
    const chart = new client.Session.Chart();
    chart.setMarket('BINANCE:BTCEUR');

    // @ts-expect-error
    chart.setTimezone('Nowhere/Nowhere');

    const error = await waitForError(chart);
    console.log('=> Chart error:', error);

    expect(error).toBeDefined();
    expect(error[0]).toBe('Critical error:');
    expect(error[1]).toBe('invalid timezone');
    expect(error[2]).toBe('method: switch_timezone. args: "[Nowhere/Nowhere]"');
    expect(error.length).toBe(3);
  });

  it('throws an error when a custom timeframe is set without premium', async () => {
    console.log('Testing "custom timeframe" error:');

    const client = new TradingView.Client();
    const chart = new client.Session.Chart();

    chart.setMarket('BINANCE:BTCEUR', { // Set a market
      // @ts-expect-error
      timeframe: '20', // Set a custom timeframe
      /*
        Timeframe '20' isn't available because we are
        not logged in as a premium TradingView account
      */
    });

    const error = await waitForError(chart);
    console.log('=> Chart error:', error);

    expect(error).toBeDefined();
    expect(error[0]).toBe('Series error:');
    expect(error[1]).toBe('custom_resolution');
    expect(error.length).toBe(2);
  });

  it('throws an error when an invalid timeframe is set', async () => {
    console.log('Testing "Invalid timeframe" error:');

    const client = new TradingView.Client();
    const chart = new client.Session.Chart();

    chart.setMarket('BINANCE:BTCEUR', { // Set a market
      // @ts-expect-error
      timeframe: 'XX', // Set an invalid timeframe
    });

    const error = await waitForError(chart);
    console.log('=> Chart error:', error);

    expect(error).toBeDefined();
    expect(error[0]).toBe('Critical error:');
    expect(error[1]).toBe('invalid parameters');
    expect(error[2]).toBe('method: create_series. args: "[$prices, s1, ser_1, XX, 100]"');
    expect(error.length).toBe(3);
  });

  it('throws an error when a premium chart type is set without premium', async () => {
    console.log('Testing "Study not auth" error:');

    const client = new TradingView.Client();
    const chart = new client.Session.Chart();

    chart.setMarket('BINANCE:BTCEUR', { // Set a market
      timeframe: '15',
      type: 'Renko',
    });

    const error = await waitForError(chart);
    console.log('=> Chart error:', error);

    expect(error).toBeDefined();
    expect(error[0]).toBe('Series error:');
    expect(error[1]).toMatch(/study_not_auth:BarSetRenko@tv-prostudies-\d+/);
    expect(error.length).toBe(2);
  });

  it('throws an error when series is edited before market is set', async () => {
    console.log('Testing "Set the market before..." error:');

    const client = new TradingView.Client();
    const chart = new client.Session.Chart();

    setImmediate(() => {
      chart.setSeries('15');
    });

    const error = await waitForError(chart);
    console.log('=> Chart error:', error);

    expect(error).toBeDefined();
    expect(error[0]).toBe('Please set the market before setting series');
    expect(error.length).toBe(1);
  });

  it('throws an error when getting a non-existent indicator', async () => {
    console.log('Testing "Inexistent indicator" error:');

    expect(
      TradingView.getIndicator('STD;XXXXXXX'),
    ).rejects.toThrow('Inexistent or unsupported indicator: "undefined"');
  });

  it('throws an error when setting an invalid study option value', async () => {
    console.log('Testing "Invalid value" error:');

    const client = new TradingView.Client();
    const chart = new client.Session.Chart();

    chart.setMarket('BINANCE:BTCEUR'); // Set a market

    const ST = await TradingView.getIndicator('STD;Supertrend');
    ST.setOption('Factor', -1); // This will cause an error

    const Supertrend = new chart.Study(ST);

    const error = await waitForError(Supertrend) as any;
    console.log('=> Study error:', error);

    expect(error).toEqual([
      {
        ctx: {
          length: -1,
          nameInvalidValue: 'factor',
          bar_index: 0,
          operation: '>',
          funName: '\'supertrend\'',
        },
        error: 'Error on bar {bar_index}: Invalid value of the \'{nameInvalidValue}\' argument ({length}) in the \'{funName}\' function. It must be {operation} 0.',
        stack_trace: [{ n: '#main', p: 7 }],
      },
      'undefined',
    ]);

    console.log('OK');
  });

  it.skipIf(
    !token || !signature,
  )('throws an error when getting user data without signature', async () => {
    console.log('Testing "Wrong or expired sessionid/signature" error using getUser method:');

    console.log('Trying with signaure');
    const userInfo = await TradingView.getUser(token, signature);

    console.log('Result:', {
      id: userInfo.id,
      username: userInfo.username,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      following: userInfo.following,
      followers: userInfo.followers,
      notifications: userInfo.notifications,
      joinDate: userInfo.joinDate,
    });

    expect(userInfo).toBeDefined();
    expect(userInfo.id).toBeDefined();

    console.log('Trying without signaure');
    expect(
      TradingView.getUser(token),
    ).rejects.toThrow('Wrong or expired sessionid/signature');

    console.log('OK');
  });

  it.skipIf(
    !token || !signature,
  )('throws an error when creating an authenticated client without signature', async () => {
    console.log('Testing "Wrong or expired sessionid/signature" error using client:');

    const client = new TradingView.Client({ token });

    const error = await waitForError(client);
    console.log('=> Client error:', error);

    expect(error).toBeDefined();
    expect(error[0]).toBe('Credentials error:');
    expect(error[1]).toBe('Wrong or expired sessionid/signature');
    expect(error.length).toBe(2);
  });
});
