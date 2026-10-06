import { describe, expect, it, vi } from 'vitest';
import { TradingViewClient } from '../../src/client/client.js';
import { runOperation, startWatcher } from '../../src/data/operation.js';
import { FakeServer } from '../helpers/fake-server.js';

function sharedClient() {
  const server = new FakeServer();
  return new TradingViewClient({ transport: server.transport });
}

describe('synchronous operation lifecycle', () => {
  it('runs cleanup before resolving a one-shot operation', async () => {
    const client = sharedClient();
    const cleanup = vi.fn();
    try {
      const value = await runOperation({ client }, 'immediate', ({ resolve }) => {
        resolve(42);
        return cleanup;
      });
      expect(value).toBe(42);
      expect(cleanup).toHaveBeenCalledOnce();
      expect(client.isClosed).toBe(false);
    } finally {
      await client.close();
    }
  });

  it('runs cleanup after a watcher becomes ready synchronously', async () => {
    const client = sharedClient();
    const cleanup = vi.fn();
    try {
      const watcher = await startWatcher({ client }, 'immediate', {}, ({ ready }) => {
        ready();
        return cleanup;
      }, (base) => base);
      await watcher.stop();
      await watcher.closed;
      expect(cleanup).toHaveBeenCalledOnce();
      expect(client.isClosed).toBe(false);
    } finally {
      await client.close();
    }
  });

  it('runs cleanup after a watcher fails synchronously', async () => {
    const client = sharedClient();
    const cleanup = vi.fn();
    try {
      await expect(startWatcher({ client }, 'immediate', {}, ({ fail }) => {
        fail(new Error('startup failed'));
        return cleanup;
      }, (base) => base)).rejects.toThrow('startup failed');
      expect(cleanup).toHaveBeenCalledOnce();
      expect(client.isClosed).toBe(false);
    } finally {
      await client.close();
    }
  });
});
