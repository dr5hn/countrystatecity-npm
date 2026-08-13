import { describe, it, expect } from 'vitest';
import { SearchResource } from '../../../src/resources/search';
import { ValidationError } from '../../../src/errors';
import { createFakeHttp } from '../support/fakeHttp';

describe('SearchResource.fuzzy', () => {
  it('requests /search/fuzzy with `q` (not `query`) and the given params', async () => {
    const http = createFakeHttp({ data: [], meta: { retryCount: 0 } });
    await new SearchResource(http).fuzzy({ query: 'Banglore', type: 'city', country: 'in', limit: 10 });
    expect(http.request).toHaveBeenCalledWith(
      ['search', 'fuzzy'],
      { q: 'Banglore', type: 'city', country: 'IN', limit: 10, threshold: undefined },
      undefined,
    );
  });

  it('defaults type to "city" when omitted, matching the API default', async () => {
    const http = createFakeHttp({ data: [], meta: { retryCount: 0 } });
    await new SearchResource(http).fuzzy({ query: 'Mumbai' });
    expect(http.request).toHaveBeenCalledWith(
      ['search', 'fuzzy'],
      { q: 'Mumbai', type: 'city', country: undefined, limit: undefined, threshold: undefined },
      undefined,
    );
  });

  it('injects `type` into every result row, since the wire response has none', async () => {
    const http = createFakeHttp({
      data: [{ id: 1, name: 'Mumbai', match_score: 0.98, matched_alias: null }],
      meta: { retryCount: 0 },
    });
    const result = await new SearchResource(http).fuzzy({ query: 'Mumbai', type: 'city' });
    expect(result.data).toEqual([{ id: 1, name: 'Mumbai', match_score: 0.98, matched_alias: null, type: 'city' }]);
  });

  it('rejects an empty query before any request', async () => {
    const http = createFakeHttp();
    await expect(new SearchResource(http).fuzzy({ query: '   ' })).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range limit before any request (fuzzy search caps at 50, not the usual 100)', async () => {
    const http = createFakeHttp();
    await expect(new SearchResource(http).fuzzy({ query: 'x', limit: 75 })).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range threshold before any request', async () => {
    const http = createFakeHttp();
    await expect(new SearchResource(http).fuzzy({ query: 'x', threshold: 1.5 })).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });
});
