import { EventEmitter } from 'events';
import { Module } from 'module';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';

const axios = require('axios');

const chartURL = 'https://www.tradingview.com/chart/';

describe('Client authentication location', () => {
  const wsPath = require.resolve('ws');
  const clientPath = require.resolve('../src/client');
  let originalWS;
  let originalClient;
  let socket;
  let get;
  let Client;

  beforeEach(() => {
    originalWS = require.cache[wsPath];
    originalClient = require.cache[clientPath];
    class FakeWebSocket extends EventEmitter {
      OPEN = 1;

      readyState = 1;

      send = vi.fn();

      close = vi.fn();

      constructor() {
        super();
        socket = this;
      }
    }
    const wsModule = new Module(wsPath);
    wsModule.exports = FakeWebSocket;
    wsModule.loaded = true;
    require.cache[wsPath] = wsModule;
    delete require.cache[clientPath];
    // Load Client after replacing its CommonJS WebSocket dependency.
    // eslint-disable-next-line global-require
    Client = require('../src/client');
    get = vi.spyOn(axios, 'get').mockImplementation(async (url) => ({
      status: 200,
      data: url.endsWith('/chart/')
        ? '{"id":123,"username":"test_user","auth_token":"test_auth_token"}'
        : '<html>homepage without token</html>',
      headers: {},
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWS) require.cache[wsPath] = originalWS;
    else delete require.cache[wsPath];
    if (originalClient) require.cache[clientPath] = originalClient;
    else delete require.cache[clientPath];
  });

  const locations = [undefined, '', 'https://fr.tradingview.com/chart/'];
  it.each(locations)('authenticates with location %s', async (location) => {
    const client = new Client({ token: 'fake_session', signature: 'fake_signature', location });
    const onError = vi.fn();
    client.onError(onError);
    await new Promise((resolve) => { setImmediate(resolve); });

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(location || chartURL, expect.any(Object));
    expect(client.isLogged).toBe(true);
    expect(socket.send).toHaveBeenCalledWith(expect.stringContaining(
      '"m":"set_auth_token","p":["test_auth_token"]',
    ));
    expect(onError).not.toHaveBeenCalled();
    await client.end();
  });

  it('does not request account information for a public client', async () => {
    const client = new Client();
    expect(get).not.toHaveBeenCalled();
    expect(socket.send).toHaveBeenCalledWith(expect.stringContaining('unauthorized_user_token'));
    await client.end();
  });
});
