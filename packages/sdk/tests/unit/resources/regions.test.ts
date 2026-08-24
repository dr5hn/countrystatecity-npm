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
});
