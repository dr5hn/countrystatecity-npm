import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../../src/client';
import { ValidationError } from '../../../src/errors';
import { installMockCscApi } from '../support/mockCscApi';
import { INR } from '../support/fixtures';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('currencies — integration', () => {
  it('resolves currency lookups end-to-end', async () => {
    installMockCscApi({
      '/v1/currencies': { body: [INR] },
      '/v1/currencies/INR': { body: INR },
      '/v1/countries/IN/currencies': { body: [INR] },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    expect((await csc.currencies.list()).data).toEqual([INR]);
    expect((await csc.currencies.get('inr')).data).toEqual(INR);
    expect((await csc.currencies.byCountry('in')).data).toEqual([INR]);
  });

  it('rejects a malformed currency code before any network call', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/currencies/USD': { body: {} } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.currencies.get('US')).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
