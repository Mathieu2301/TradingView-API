import { defineConfig } from 'vitest/config';

// Live tests talk to TradingView servers. They are opt-in (`npm run test:live`)
// and never part of the default deterministic suite.
export default defineConfig({
  test: {
    include: ['tests/live/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 30_000,
    retry: 1,
    fileParallelism: false,
    env: { TV_LIVE: '1' },
  },
});
