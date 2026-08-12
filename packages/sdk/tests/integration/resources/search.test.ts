import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../../src/client';
import { ValidationError } from '../../../src/errors';
import { installMockCscApi } from '../support/mockCscApi';
import { MUMBAI_SEARCH_RESULT } from '../support/fixtures';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('search.fuzzy — integration', () => {
  it('resolves fuzzy matches end-to-end', async () => {
    installMockCscApi({ '/v1/search': { body: [MUMBAI_SEARCH_RESULT] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    const result = await csc.search.fuzzy({ query: 'Banglore', type: 'city', country: 'IN', limit: 10 });
    expect(result.data).toEqual([MUMBAI_SEARCH_RESULT]);
  });

  it('rejects an empty query before any network call', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/search': { body: [] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.search.fuzzy({ query: '  ' })).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
