import { describe, it, expect } from 'vitest';
import { SearchResource } from '../../../src/resources/search';
import { ValidationError } from '../../../src/errors';
import { createFakeHttp } from '../support/fakeHttp';

describe('SearchResource.fuzzy', () => {
  it('requests /search with the given params', async () => {
    const http = createFakeHttp();
    await new SearchResource(http).fuzzy({ query: 'Banglore', type: 'city', country: 'in', limit: 10 });
    expect(http.request).toHaveBeenCalledWith(
      ['search'],
      { query: 'Banglore', type: 'city', country: 'IN', limit: 10, offset: undefined },
      undefined,
    );
  });

  it('rejects an empty query before any request', async () => {
    const http = createFakeHttp();
    await expect(new SearchResource(http).fuzzy({ query: '   ' })).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range limit before any request', async () => {
    const http = createFakeHttp();
    await expect(new SearchResource(http).fuzzy({ query: 'x', limit: 1000 })).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });
});
