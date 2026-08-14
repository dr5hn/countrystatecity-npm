import { describe, it, expect } from 'vitest';
import { CitiesResource } from '../../../src/resources/cities';
import { ValidationError } from '../../../src/errors';
import { createFakeHttp } from '../support/fakeHttp';

describe('CitiesResource', () => {
  it('rejects list() with no country before any request — the API has no bare GET /cities route', async () => {
    const http = createFakeHttp();
    // @ts-expect-error — country is required; this exercises non-TypeScript callers too.
    await expect(new CitiesResource(http).list({})).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });

  it('list({ country }) requests /countries/{code}/cities', async () => {
    const http = createFakeHttp();
    await new CitiesResource(http).list({ country: 'in', kind: 'settlement' });
    expect(http.request).toHaveBeenCalledWith(
      ['countries', 'IN', 'cities'],
      { kind: 'settlement', limit: undefined, offset: undefined },
      undefined,
    );
  });

  it('list({ country, state }) requests the full hierarchy path', async () => {
    const http = createFakeHttp();
    await new CitiesResource(http).list({ country: 'in', state: 'mh' });
    expect(http.request).toHaveBeenCalledWith(
      ['countries', 'IN', 'states', 'MH', 'cities'],
      { kind: undefined, limit: undefined, offset: undefined },
      undefined,
    );
  });

  it('list() joins fields/sort arrays into comma-separated query params', async () => {
    const http = createFakeHttp();
    await new CitiesResource(http).list({ country: 'in', state: 'mh', fields: ['name', 'population'], sort: ['population:desc'] });
    expect(http.request).toHaveBeenCalledWith(
      ['countries', 'IN', 'states', 'MH', 'cities'],
      { kind: undefined, limit: undefined, offset: undefined, fields: 'name,population', sort: 'population:desc' },
      undefined,
    );
  });

  it('rejects state without country before any request', async () => {
    const http = createFakeHttp();
    await expect(new CitiesResource(http).list({ state: 'mh' })).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });

  it('get() always rejects — the API has no single-city-by-ID endpoint', async () => {
    const http = createFakeHttp();
    await expect(new CitiesResource(http).get('in', 'mh', 132)).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });

  it('list() passes locale/includeTranslations through as locale/include_translations', async () => {
    const http = createFakeHttp();
    await new CitiesResource(http).list({ country: 'in', state: 'mh', locale: 'mr', includeTranslations: true });
    expect(http.request).toHaveBeenCalledWith(
      ['countries', 'IN', 'states', 'MH', 'cities'],
      expect.objectContaining({ locale: 'mr', include_translations: true }),
      undefined,
    );
  });
});
