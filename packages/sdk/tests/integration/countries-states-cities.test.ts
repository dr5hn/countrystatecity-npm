import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../src/client';
import { installMockCscApi } from './support/mockCscApi';
import { INDIA, MAHARASHTRA, MUMBAI, USAGE_HEADERS } from './support/fixtures';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('full countries -> states -> cities hierarchy walk', () => {
  it('walks list+get at every level through the real client/http/retry code path', async () => {
    const { fetchMock } = installMockCscApi({
      '/v1/countries': { body: [INDIA], headers: USAGE_HEADERS },
      '/v1/countries/IN': { body: INDIA },
      '/v1/countries/IN/states': { body: [MAHARASHTRA] },
      '/v1/countries/IN/states/MH': { body: MAHARASHTRA },
      '/v1/countries/IN/states/MH/cities': { body: [MUMBAI] },
      '/v1/countries/IN/states/MH/cities/132649': { body: MUMBAI },
    });

    const csc = createCSCClient({ apiKey: 'test-key', baseUrl: 'https://mock.test/v1' });

    const countries = await csc.countries.list();
    expect(countries.data).toEqual([INDIA]);
    expect(countries.meta.rateLimit).toEqual({ dailyUsed: 12, dailyLimit: 1000, monthlyUsed: 340, monthlyLimit: 30000 });

    const india = await csc.countries.get('in');
    expect(india.data).toEqual(INDIA);

    const states = await csc.states.list({ country: 'IN' });
    expect(states.data).toEqual([MAHARASHTRA]);

    const maharashtra = await csc.states.get('IN', 'MH');
    expect(maharashtra.data).toEqual(MAHARASHTRA);

    const cities = await csc.cities.list({ country: 'IN', state: 'MH' });
    expect(cities.data).toEqual([MUMBAI]);

    const mumbai = await csc.cities.get('IN', 'MH', 132649);
    expect(mumbai.data).toEqual(MUMBAI);

    expect(fetchMock).toHaveBeenCalledTimes(6);

    // getLastResponseMeta() reflects the most recent call in the walk, end-to-end.
    expect(csc.getLastResponseMeta()?.rateLimit).toBeUndefined();
  });
});
