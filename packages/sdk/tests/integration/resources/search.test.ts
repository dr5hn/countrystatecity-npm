import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../../src/client';
import { ValidationError } from '../../../src/errors';
import { installMockCscApi } from '../support/mockCscApi';
import {
  MUMBAI_SEARCH_ROW,
  MUMBAI_SEARCH_RESULT,
  BANGALORE_AUTOCOMPLETE_ROW,
  BANGALORE_AUTOCOMPLETE_RESULT,
  MUMBAI_NEARBY_ROW,
  MUMBAI_NEARBY_RESULT,
} from '../support/fixtures';

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

describe('search.autocomplete — integration', () => {
  it('resolves autocomplete matches end-to-end with the server-provided `type`', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/search/autocomplete': { body: [BANGALORE_AUTOCOMPLETE_ROW] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    const result = await csc.search.autocomplete({ query: 'Bang', type: 'city', country: 'IN', limit: 10 });
    expect(result.data).toEqual([BANGALORE_AUTOCOMPLETE_RESULT]);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('q=Bang');
    expect(url).not.toContain('query=');
  });

  it('rejects an empty query before any network call', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/search/autocomplete': { body: [] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.search.autocomplete({ query: '  ' })).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects state without country before any network call', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/search/autocomplete': { body: [] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.search.autocomplete({ query: 'Karnataka', type: 'state', state: 'KA' })).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('search.nearby — integration', () => {
  it('resolves nearby matches end-to-end, injecting `type` since the wire response has none', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/search/nearby': { body: [MUMBAI_NEARBY_ROW] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    const result = await csc.search.nearby({ lat: 19.076, lng: 72.877, type: 'city', kind: 'settlement', radius: 25 });
    expect(result.data).toEqual([MUMBAI_NEARBY_RESULT]);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('lat=19.076');
    expect(url).toContain('lng=72.877');
    expect(url).toContain('kind=settlement');
  });

  it('rejects an out-of-range latitude before any network call', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/search/nearby': { body: [] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.search.nearby({ lat: 190, lng: 72.877 })).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects state without country before any network call', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/search/nearby': { body: [] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.search.nearby({ lat: 19.076, lng: 72.877, type: 'state', state: 'KA' })).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
