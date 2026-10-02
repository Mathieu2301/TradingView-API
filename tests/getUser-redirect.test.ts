// Project: https://github.com/Mathieu2301/TradingView-API
// Package: https://www.npmjs.com/package/@mathieuc/tradingview
import { describe, it, expect } from 'vitest';

describe('getUser redirect protection', () => {
  it('should not loop infinitely on repeated redirects', async () => {
    // Monkey-patch axios in the require cache to simulate redirect loop
    let callCount = 0;
    const axiosMock = {
      get: async (url: string) => {
        callCount += 1;
        const isA = url === 'https://www.tradingview.com/';
        return {
          data: '<html>no auth here</html>',
          headers: {
            location: isA
              ? 'https://www.tradingview.com/accounts/signin/'
              : 'https://www.tradingview.com/',
          },
        };
      },
    };

    const axiosPath = require.resolve('axios');
    const originalModule = require.cache[axiosPath];
    require.cache[axiosPath] = {
      id: axiosPath,
      filename: axiosPath,
      loaded: true,
      exports: axiosMock,
    } as any;

    const miscPath = require.resolve('../src/miscRequests');
    delete require.cache[miscPath];

    try {
      // eslint-disable-next-line global-require
      const misc = require('../src/miscRequests');
      await expect(
        misc.getUser('fake_session', 'fake_signature'),
      ).rejects.toThrow('Too many redirects');

      expect(callCount).toBeGreaterThan(0);
      expect(callCount).toBeLessThanOrEqual(10);
    } finally {
      if (originalModule) require.cache[axiosPath] = originalModule;
      else delete require.cache[axiosPath];
      delete require.cache[miscPath];
    }
  }, 5000);
});
