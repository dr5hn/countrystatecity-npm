import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../../src/client';
import { ValidationError } from '../../../src/errors';
import { installMockCscApi } from '../support/mockCscApi';
import { MUMBAI_SEARCH_ROW, MUMBAI_SEARCH_RESULT } from '../support/fixtures';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('search.fuzzy — integration', () => {
  it('resolves fuzzy matches end-to-end, injecting `type` since the wire response has none', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/search/fuzzy': { body: [MUMBAI_SEARCH_ROW] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    const result = await csc.search.fuzzy({ query: 'Banglore', type: 'city', country: 'IN', limit: 10 });
    expect(result.data).toEqual([MUMBAI_SEARCH_RESULT]);

    const url = (fetchMock.mock.calls[0][0] as string);
    expect(url).toContain('q=Banglore');
    expect(url).not.toContain('query=');
  });

  it('rejects an empty query before any network call', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/search/fuzzy': { body: [] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.search.fuzzy({ query: '  ' })).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
