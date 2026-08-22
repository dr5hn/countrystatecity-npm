import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../../src/client';
import { installMockCscApi } from '../support/mockCscApi';
import { USAGE_HEADERS } from '../support/fixtures';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('usage — integration', () => {
  it('falls back to a bootstrap request when no prior call exists on the client', async () => {
    const { fetchMock } = installMockCscApi({
      '/v1/usage': { body: { dailyUsed: 12, dailyLimit: 1000, monthlyUsed: 340, monthlyLimit: 30000 } },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    const usage = await csc.usage.get();
    expect(usage.data).toEqual({ dailyUsed: 12, dailyLimit: 1000, monthlyUsed: 340, monthlyLimit: 30000 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reuses cached rate-limit headers from a prior call at zero extra network cost', async () => {
    const { fetchMock } = installMockCscApi({
      '/v1/countries': { body: [], headers: USAGE_HEADERS },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await csc.countries.list();
    const usage = await csc.usage.get();

    expect(usage.data).toEqual({ dailyUsed: 12, dailyLimit: 1000, monthlyUsed: 340, monthlyLimit: 30000 });
    expect(fetchMock).toHaveBeenCalledTimes(1); // only the countries.list() call — usage.get() made no request
  });
});
