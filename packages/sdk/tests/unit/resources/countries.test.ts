import { describe, it, expect } from 'vitest';
import { CountriesResource } from '../../../src/resources/countries';
import { ValidationError } from '../../../src/errors';
import { createFakeHttp } from '../support/fakeHttp';
import type { ICountry } from '../../../src/types/entities';

describe('CountriesResource', () => {
  it('list() requests /countries with limit/offset', async () => {
    const http = createFakeHttp();
    const resource = new CountriesResource(http);

    await resource.list({ limit: 10, offset: 5 });

    expect(http.request).toHaveBeenCalledWith(['countries'], { limit: 10, offset: 5 }, undefined);
  });

  it('list() joins fields/sort arrays into comma-separated query params', async () => {
    const http = createFakeHttp();
    const resource = new CountriesResource(http);

    await resource.list({ fields: ['name', 'iso2'], sort: ['name:asc'] });

    expect(http.request).toHaveBeenCalledWith(
      ['countries'],
      { limit: undefined, offset: undefined, fields: 'name,iso2', sort: 'name:asc' },
      undefined,
    );
  });

  it('list() omits fields/sort from the query when not provided', async () => {
    const http = createFakeHttp();
    const resource = new CountriesResource(http);

    await resource.list({ limit: 10 });

    expect(http.request).toHaveBeenCalledWith(['countries'], { limit: 10, offset: undefined }, undefined);
  });

  it('list() passes { data, meta } through untouched', async () => {
    const payload = { data: [{ id: 1 }] as unknown as ICountry[], meta: { retryCount: 0 } };
    const http = createFakeHttp(payload);
    const resource = new CountriesResource(http);

    const result = await resource.list();
    expect(result).toBe(payload);
  });

  it('get() normalizes iso2 and requests /countries/{code}', async () => {
    const http = createFakeHttp();
    const resource = new CountriesResource(http);

    await resource.get('in');

    expect(http.request).toHaveBeenCalledWith(['countries', 'IN'], { locale: undefined, include_translations: undefined }, undefined);
  });

  it('get() rejects a malformed country code before any request', async () => {
    const http = createFakeHttp();
    const resource = new CountriesResource(http);

    await expect(resource.get('INDIA')).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });

  it('list() passes locale/includeTranslations through as locale/include_translations', async () => {
    const http = createFakeHttp();
    const resource = new CountriesResource(http);

    await resource.list({ locale: 'pt-BR', includeTranslations: true });

    expect(http.request).toHaveBeenCalledWith(
      ['countries'],
      expect.objectContaining({ locale: 'pt-BR', include_translations: true }),
      undefined,
    );
  });

  it('get() passes an optional locale params object through as query params', async () => {
    const http = createFakeHttp();
    const resource = new CountriesResource(http);

    await resource.get('IN', { locale: 'hi', includeTranslations: true });

    expect(http.request).toHaveBeenCalledWith(
      ['countries', 'IN'],
      { locale: 'hi', include_translations: true },
      undefined,
    );
  });
});
