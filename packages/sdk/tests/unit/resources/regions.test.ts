import { describe, it, expect } from 'vitest';
import { RegionsResource } from '../../../src/resources/regions';
import { createFakeHttp } from '../support/fakeHttp';

describe('RegionsResource', () => {
  it('list() requests /regions', async () => {
    const http = createFakeHttp();
    await new RegionsResource(http).list();
    expect(http.request).toHaveBeenCalledWith(['regions'], { locale: undefined, include_translations: undefined }, undefined);
  });

  it('get() requests /regions/{id}', async () => {
    const http = createFakeHttp();
    await new RegionsResource(http).get(2);
    expect(http.request).toHaveBeenCalledWith(['regions', 2], { locale: undefined, include_translations: undefined }, undefined);
  });

  it('subregions() requests /regions/{id}/subregions', async () => {
    const http = createFakeHttp();
    await new RegionsResource(http).subregions(2);
    expect(http.request).toHaveBeenCalledWith(['regions', 2, 'subregions'], { locale: undefined, include_translations: undefined }, undefined);
  });

  it('list()/get()/subregions() pass an optional locale params object through as query params', async () => {
    const http = createFakeHttp();
    const resource = new RegionsResource(http);

    await resource.list({ locale: 'fr', includeTranslations: true });
    expect(http.request).toHaveBeenCalledWith(['regions'], { locale: 'fr', include_translations: true }, undefined);

    await resource.get(2, { locale: 'fr' });
    expect(http.request).toHaveBeenCalledWith(['regions', 2], { locale: 'fr', include_translations: undefined }, undefined);

    await resource.subregions(2, { includeTranslations: true });
    expect(http.request).toHaveBeenCalledWith(['regions', 2, 'subregions'], { locale: undefined, include_translations: true }, undefined);
  });
});
