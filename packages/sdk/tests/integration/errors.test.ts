import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../src/client';
import { installMockCscApi } from './support/mockCscApi';
import {
  AuthenticationError,
  ForbiddenError,
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
      '/v1/search/fuzzy': {
        status: 403,
        body: {
          status: 'error',
          message: 'Upgrade required',
          details: {
            feature: 'fuzzySearch',
            currentTier: 'community',
            requiredTier: 'professional',
            upgradeUrl: 'https://x/upgrade',
          },
        },
      },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: BASE_URL });

    try {
      await csc.search.fuzzy({ query: 'Mumbai' });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(FeatureRestrictedError);
      const fre = err as FeatureRestrictedError;
      expect(fre.feature).toBe('fuzzySearch');
      expect(fre.currentPlan).toBe('community');
      expect(fre.requiredPlan).toBe('professional');
      expect(fre.upgradeUrl).toBe('https://x/upgrade');
    }
  });

  it('non-plan 403 -> ForbiddenError without upgrade advice', async () => {
    installMockCscApi({
      '/v1/countries': { status: 403, body: { status: 'error', message: 'Domain not allowed' } },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: BASE_URL });

    await expect(csc.countries.list()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('429 with Retry-After -> RateLimitError carrying retryAfter, after respecting the header on retry', async () => {
    installMockCscApi({
      '/v1/countries': {
        status: 429,
        headers: { 'retry-after': '0' },
        body: {
          status: 'error',
          message: 'Daily limit reached',
          details: {
            limit: 1000,
            period: 'daily',
            resetAt: '2026-08-25T00:00:00.000Z',
            tier: 'community',
            upgradeUrl: 'https://countrystatecity.in/pricing',
          },
        },
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
      expect(rle.remaining).toBeUndefined();
      expect(rle.scope).toBe('daily');
      expect(rle.resetAt).toBe('2026-08-25T00:00:00.000Z');
      expect(rle.retryAfter).toBe(0);
      expect(rle.tier).toBe('community');
      expect(rle.upgradeUrl).toBe('https://countrystatecity.in/pricing');
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
