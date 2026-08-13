import { describe, it, expect } from 'vitest';
import { CitiesResource } from '../../../src/resources/cities';
import { ValidationError } from '../../../src/errors';
import { createFakeHttp } from '../support/fakeHttp';

describe('CitiesResource', () => {
  it('list() with neither country nor state requests /cities', async () => {
    const http = createFakeHttp();
    await new CitiesResource(http).list();
    expect(http.request).toHaveBeenCalledWith(['cities'], { kind: undefined, limit: undefined, offset: undefined }, undefined);
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

  it('get() requests the full hierarchy path with the city id', async () => {
    const http = createFakeHttp();
    await new CitiesResource(http).get('in', 'mh', 132);
    expect(http.request).toHaveBeenCalledWith(['countries', 'IN', 'states', 'MH', 'cities', 132], undefined, undefined);
  });
});
