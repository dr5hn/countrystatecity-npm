import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../src/client';
import { TimeoutError } from '../../src/errors';
import { installMockCscApi } from './support/mockCscApi';

afterEach(() => {
  vi.unstubAllGlobals();
});

const BASE_URL = 'https://mock.test/v1';

describe('timeouts and cancellation, driven through the public API', () => {
  it('a response slower than the configured timeout surfaces TimeoutError', async () => {
    installMockCscApi({ '/v1/countries': { delayMs: 200, body: [] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: BASE_URL, timeout: 20, retry: { retries: 0 } });

    await expect(csc.countries.list()).rejects.toBeInstanceOf(TimeoutError);
  });

  it('a caller-supplied AbortSignal aborted mid-flight rejects with a native AbortError, not TimeoutError', async () => {
    installMockCscApi({ '/v1/countries': { delayMs: 5000, body: [] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: BASE_URL, timeout: 60_000 });
    const controller = new AbortController();

    const pending = csc.countries.list(undefined, { signal: controller.signal });
    setTimeout(() => controller.abort(), 10);

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('a response comfortably under the timeout still succeeds', async () => {
    installMockCscApi({ '/v1/countries': { delayMs: 5, body: [] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: BASE_URL, timeout: 1000 });

    await expect(csc.countries.list()).resolves.toMatchObject({ data: [] });
  });
});
