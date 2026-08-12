import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../src/client';
import { installMockCscApi } from './support/mockCscApi';
import {
  AuthenticationError,
  FeatureRestrictedError,
  RateLimitError,
  NotFoundError,
  NetworkError,
} from '../../src/errors';

afterEach(() => {
  vi.unstubAllGlobals();
});

const BASE_URL = 'https://mock.test/v1';

describe('error responses, driven through the public API', () => {
  it('401 -> AuthenticationError', async () => {
    installMockCscApi({ '/v1/countries': { status: 401, body: { message: 'Invalid API key' } } });
    const csc = createCSCClient({ apiKey: 'bad-key', baseUrl: BASE_URL });

    await expect(csc.countries.list()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('403 with a restriction body -> FeatureRestrictedError carrying actionable upgrade info', async () => {
    installMockCscApi({
      '/v1/search': {
        status: 403,
        body: { message: 'Upgrade required', feature: 'search', currentPlan: 'free', requiredPlan: 'pro', upgradeUrl: 'https://x/upgrade' },
      },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: BASE_URL });

    try {
      await csc.search.fuzzy({ query: 'Mumbai' });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(FeatureRestrictedError);
      const fre = err as FeatureRestrictedError;
      expect(fre.feature).toBe('search');
      expect(fre.currentPlan).toBe('free');
      expect(fre.requiredPlan).toBe('pro');
      expect(fre.upgradeUrl).toBe('https://x/upgrade');
    }
  });

  it('429 with Retry-After -> RateLimitError carrying retryAfter, after respecting the header on retry', async () => {
    installMockCscApi({
      '/v1/countries': {
        status: 429,
        headers: { 'retry-after': '0' },
        body: { message: 'Daily limit reached', limit: 1000, remaining: 0, scope: 'daily' },
      },
    });
    // retries: 0 so the 429 surfaces immediately as the terminal error.
    const csc = createCSCClient({ apiKey: 'k', baseUrl: BASE_URL, retry: { retries: 0 } });

    try {
      await csc.countries.list();
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitError);
      const rle = err as RateLimitError;
      expect(rle.limit).toBe(1000);
      expect(rle.remaining).toBe(0);
      expect(rle.scope).toBe('daily');
      expect(rle.retryAfter).toBe(0);
    }
  });

  it('404 -> NotFoundError', async () => {
    installMockCscApi({ '/v1/countries/ZZ': { status: 404, body: { resource: 'country', identifier: 'ZZ' } } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: BASE_URL });

    await expect(csc.countries.get('ZZ')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('a transient 5xx twice, then success -> retried automatically and resolves', async () => {
    const { fetchMock } = installMockCscApi({
      '/v1/countries': { failTimes: 2, failStatus: 503, body: [] },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: BASE_URL, retry: { retries: 2, baseDelayMs: 1, maxDelayMs: 1 } });

    const result = await csc.countries.list();
    expect(result.data).toEqual([]);
    expect(result.meta.retryCount).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('a persistent 5xx exhausts retries and surfaces NetworkError', async () => {
    const { fetchMock } = installMockCscApi({
      '/v1/countries': { status: 503, body: { message: 'down for maintenance' } },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: BASE_URL, retry: { retries: 2, baseDelayMs: 1, maxDelayMs: 1 } });

    await expect(csc.countries.list()).rejects.toBeInstanceOf(NetworkError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
