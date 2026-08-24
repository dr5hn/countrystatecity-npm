import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../src/client';
import { ValidationError } from '../../src/errors';
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

    // cities.get() always rejects client-side — there's no single-city-by-ID
    // route on the real API, so this never reaches the network.
    await expect(csc.cities.get('IN', 'MH', 132649)).rejects.toBeInstanceOf(ValidationError);

    expect(fetchMock).toHaveBeenCalledTimes(5);

    // getLastResponseMeta() reflects the most recent *successful network*
    // call in the walk — cities.get()'s client-side rejection above never
    // touches it.
    expect(csc.getLastResponseMeta()?.rateLimit).toBeUndefined();
  });
});

describe('locale / includeTranslations — integration', () => {
  it('sends locale/include_translations as query params and passes localized_name/matched_locale/translations through untouched', async () => {
    const MAHARASHTRA_LOCALIZED = {
      ...MAHARASHTRA,
      localized_name: 'महाराष्ट्र',
      matched_locale: 'hi',
      translations: JSON.stringify({ hi: 'महाराष्ट्र', fr: 'Maharashtra' }),
    };
    const { fetchMock } = installMockCscApi({
      '/v1/countries/IN/states/MH': { body: MAHARASHTRA_LOCALIZED },
    });
    const csc = createCSCClient({ apiKey: 'test-key', baseUrl: 'https://mock.test/v1' });

    const result = await csc.states.get('IN', 'MH', { locale: 'hi', includeTranslations: true });

    expect(result.data).toEqual(MAHARASHTRA_LOCALIZED);
    expect(result.data.name).toBe(MAHARASHTRA.name);
    expect(result.data.id).toBe(MAHARASHTRA.id);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('locale=hi');
    expect(url).toContain('include_translations=true');
  });
});
