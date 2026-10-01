import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';

// Spy on the same axios instance required by the CommonJS library.
const axios = require('axios');
const misc = require('../src/miscRequests');

const chartURL = 'https://www.tradingview.com/chart/';
const authenticatedResponse = {
  status: 200,
  data: JSON.stringify({ id: 123, username: 'test_user', auth_token: 'test_auth_token' }),
  headers: {},
};

describe('getUser authentication and redirects', () => {
  let get;

  beforeEach(() => {
    get = vi.spyOn(axios, 'get');
    get.mockRejectedValue(new Error('Unexpected HTTP request'));
  });
  afterEach(() => vi.restoreAllMocks());

  it('authenticates against the chart page by default', async () => {
    get.mockImplementation(async (url) => (url === chartURL
      ? authenticatedResponse
      : { status: 200, data: '<html>homepage without token</html>', headers: {} }));

    await expect(misc.getUser('fake_session', 'fake_signature')).resolves.toMatchObject({
      id: '123',
      username: 'test_user',
      authToken: 'test_auth_token',
      session: 'fake_session',
      signature: 'fake_signature',
    });
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(chartURL, expect.objectContaining({
      headers: { cookie: 'sessionid=fake_session;sessionid_sign=fake_signature' },
      maxRedirects: 0,
    }));
  });

  it('preserves an explicit location and optional signature', async () => {
    get.mockResolvedValue(authenticatedResponse);
    const location = 'https://fr.tradingview.com/chart/';
    await misc.getUser('fake_session', undefined, location);
    expect(get).toHaveBeenCalledWith(location, expect.objectContaining({
      headers: { cookie: 'sessionid=fake_session' },
    }));
  });

  it.each([200, 401, 403])('does not retry HTTP %i without Location', async (status) => {
    get.mockResolvedValue({ status, data: '<html>no token</html>', headers: {} });
    await expect(misc.getUser('fake_session', 'fake_signature'))
      .rejects.toThrow('Wrong or expired sessionid/signature');
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('ignores Location on a successful non-redirect response', async () => {
    get.mockResolvedValue({
      status: 200, data: '<html>no token</html>', headers: { location: '/chart/' },
    });
    await expect(misc.getUser('fake_session', 'fake_signature'))
      .rejects.toThrow('Wrong or expired sessionid/signature');
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('does not retry a redirect without Location', async () => {
    get.mockResolvedValue({ status: 302, data: '', headers: {} });
    await expect(misc.getUser('fake_session', 'fake_signature'))
      .rejects.toThrow('Wrong or expired sessionid/signature');
    expect(get).toHaveBeenCalledTimes(1);
  });

  it.each([301, 302, 303, 307, 308])('follows an HTTP %i redirect', async (status) => {
    const location = 'https://fr.tradingview.com/chart/';
    get.mockResolvedValueOnce({ status, data: '', headers: { location } })
      .mockResolvedValueOnce(authenticatedResponse);
    await expect(misc.getUser('fake_session', 'fake_signature'))
      .resolves.toHaveProperty('authToken', 'test_auth_token');
    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenLastCalledWith(location, expect.objectContaining({
      headers: { cookie: 'sessionid=fake_session;sessionid_sign=fake_signature' },
    }));
  });

  it.each([
    ['/chart/redirected/', 'https://www.tradingview.com/chart/redirected/'],
    ['next/', 'https://www.tradingview.com/chart/next/'],
    ['//fr.tradingview.com/chart/', 'https://fr.tradingview.com/chart/'],
  ])('resolves %s against the current URL', async (location, expectedURL) => {
    get.mockResolvedValueOnce({ status: 302, data: '', headers: { location } })
      .mockResolvedValueOnce(authenticatedResponse);
    await misc.getUser('fake_session', 'fake_signature');
    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenLastCalledWith(expectedURL, expect.any(Object));
  });

  it.each([
    'https://example.com/chart/',
    'https://tradingview.com.example.com/chart/',
    'https://nottradingview.com/chart/',
    'http://www.tradingview.com/chart/',
  ])('rejects %s before forwarding cookies', async (location) => {
    get.mockResolvedValue({ status: 302, data: '', headers: { location } });
    await expect(misc.getUser('fake_session', 'fake_signature'))
      .rejects.toThrow('Unexpected authentication redirect destination');
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('allows authentication after five redirects', async () => {
    get.mockImplementation(async () => (get.mock.calls.length <= 5
      ? { status: 302, data: '', headers: { location: chartURL } }
      : authenticatedResponse));
    await expect(misc.getUser('fake_session', 'fake_signature'))
      .resolves.toHaveProperty('authToken', 'test_auth_token');
    expect(get).toHaveBeenCalledTimes(6);
  });

  it('bounds a real redirect loop to six requests', async () => {
    get.mockResolvedValue({ status: 302, data: '', headers: { location: chartURL } });
    await expect(misc.getUser('fake_session', 'fake_signature'))
      .rejects.toThrow('Too many redirects');
    expect(get).toHaveBeenCalledTimes(6);
  });

  it('propagates network errors without retrying', async () => {
    const error = new Error('Connection failed');
    get.mockRejectedValue(error);
    await expect(misc.getUser('fake_session', 'fake_signature')).rejects.toBe(error);
    expect(get).toHaveBeenCalledTimes(1);
  });
});
