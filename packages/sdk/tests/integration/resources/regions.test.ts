import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../../src/client';
import { installMockCscApi } from '../support/mockCscApi';
import { ASIA_REGION, SOUTHERN_ASIA_SUBREGION } from '../support/fixtures';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('regions — integration', () => {
  it('lists regions, gets one by id, and lists its subregions', async () => {
    installMockCscApi({
      '/v1/regions': { body: [ASIA_REGION] },
      '/v1/regions/3': { body: ASIA_REGION },
      '/v1/regions/3/subregions': { body: [SOUTHERN_ASIA_SUBREGION] },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    expect((await csc.regions.list()).data).toEqual([ASIA_REGION]);
    expect((await csc.regions.get(3)).data).toEqual(ASIA_REGION);
    expect((await csc.regions.subregions(3)).data).toEqual([SOUTHERN_ASIA_SUBREGION]);
  });

  it('surfaces NotFoundError for an unknown region id', async () => {
    installMockCscApi({ '/v1/regions/999': { status: 404, body: { resource: 'region', identifier: '999' } } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.regions.get(999)).rejects.toMatchObject({ name: 'NotFoundError' });
  });
});
