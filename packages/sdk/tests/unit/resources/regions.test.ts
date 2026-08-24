import { describe, it, expect } from 'vitest';
import { RegionsResource } from '../../../src/resources/regions';
import { createFakeHttp } from '../support/fakeHttp';

describe('RegionsResource', () => {
  it('list() requests /regions', async () => {
    const http = createFakeHttp();
    await new RegionsResource(http).list();
    expect(http.request).toHaveBeenCalledWith(['regions'], undefined, undefined);
  });

  it('get() requests /regions/{id}', async () => {
    const http = createFakeHttp();
    await new RegionsResource(http).get(2);
    expect(http.request).toHaveBeenCalledWith(['regions', 2], undefined, undefined);
  });

  it('subregions() requests /regions/{id}/subregions', async () => {
    const http = createFakeHttp();
    await new RegionsResource(http).subregions(2);
    expect(http.request).toHaveBeenCalledWith(['regions', 2, 'subregions'], undefined, undefined);
  });

  it('getSubregion()/countries() request the subregion routes with localization', async () => {
    const http = createFakeHttp();
    const resource = new RegionsResource(http);

    await resource.getSubregion(14, { locale: 'PT-br' });
    await resource.countries(14, { includeTranslations: true });

    expect(http.request).toHaveBeenNthCalledWith(1, ['subregions', 14], { locale: 'pt-BR' }, undefined);
    expect(http.request).toHaveBeenNthCalledWith(2, ['subregions', 14, 'countries'], { include_translations: true }, undefined);
  });

  it('list()/get()/subregions() pass an optional locale params object through as query params', async () => {
    const http = createFakeHttp();
    const resource = new RegionsResource(http);

    await resource.list({ locale: 'fr', includeTranslations: true });
    expect(http.request).toHaveBeenCalledWith(['regions'], { locale: 'fr', include_translations: true }, undefined);

    await resource.get(2, { locale: 'fr' });
    expect(http.request).toHaveBeenCalledWith(['regions', 2], { locale: 'fr' }, undefined);

    await resource.subregions(2, { includeTranslations: true });
    expect(http.request).toHaveBeenCalledWith(['regions', 2, 'subregions'], { include_translations: true }, undefined);
  });

  it('keeps the old request-options positions working', async () => {
    const http = createFakeHttp();
    const resource = new RegionsResource(http);
    const opts = { timeout: 250 };

    await resource.list(opts);
    await resource.get(2, opts);
    await resource.subregions(2, opts);

    expect(http.request).toHaveBeenNthCalledWith(1, ['regions'], undefined, opts);
    expect(http.request).toHaveBeenNthCalledWith(2, ['regions', 2], undefined, opts);
    expect(http.request).toHaveBeenNthCalledWith(3, ['regions', 2, 'subregions'], undefined, opts);
  });
});
