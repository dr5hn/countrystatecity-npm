import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCountries,
  getCountryByCode,
  getStatesOfCountry,
  getStateByCode,
  getCitiesOfState,
  getCityById,
  getAllCitiesOfCountry,
  getAllCitiesInWorld,
  clearCache,
} from '../../src/loaders';
import { configure, resetConfiguration } from '../../src/config';

function mockFetch(responses: Record<string, unknown>) {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    for (const [pattern, data] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        });
      }
    }
    return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
  }));
}

const mockCountries = [
  { id: 1, name: 'TestCountry', iso2: 'TC', iso3: 'TST', numeric_code: '001', phonecode: '1', capital: 'TestCity', currency: 'TCD', currency_name: 'Test Dollar', currency_symbol: '$', tld: '.tc', native: 'TestCountry', region: 'TestRegion', subregion: 'TestSub', nationality: 'Tester', latitude: '0.00', longitude: '0.00', emoji: '🏳️', emojiU: 'U+1F3F3' },
];

const mockMeta = {
  ...mockCountries[0],
  timezones: [{ zoneName: 'Test/Zone', gmtOffset: 0, gmtOffsetName: 'UTC+00:00', abbreviation: 'TZ', tzName: 'Test Zone' }],
  translations: { en: 'TestCountry' },
};

const mockStates = [
  { id: 10, name: 'TestState', country_id: 1, country_code: 'TC', fips_code: null, iso2: 'TS', type: 'state', latitude: '1.00', longitude: '1.00', native: null, timezone: 'Test/Zone', translations: {} },
  { id: 11, name: 'OtherState', country_id: 1, country_code: 'TC', fips_code: null, iso2: 'OS', type: 'state', latitude: '2.00', longitude: '2.00', native: null, timezone: 'Test/Zone', translations: {} },
];

const mockCities = [
  { id: 100, name: 'TestVille', state_id: 10, state_code: 'TS', country_id: 1, country_code: 'TC', latitude: '1.10', longitude: '1.10', native: null, timezone: 'Test/Zone', translations: {} },
  { id: 101, name: 'OtherVille', state_id: 10, state_code: 'TS', country_id: 1, country_code: 'TC', latitude: '1.20', longitude: '1.20', native: null, timezone: 'Test/Zone', translations: {} },
];

const mockOtherCities = [
  { id: 200, name: 'AnotherCity', state_id: 11, state_code: 'OS', country_id: 1, country_code: 'TC', latitude: '2.10', longitude: '2.10', native: null, timezone: 'Test/Zone', translations: {} },
];

describe('loaders', () => {
  beforeEach(() => {
    resetConfiguration();
    configure({ baseURL: 'https://cdn.test.com' });
    clearCache();
    vi.restoreAllMocks();
    mockFetch({
      'countries.json': mockCountries,
      'country/TC.json': mockMeta,
      'states/TC.json': mockStates,
      'cities/TC-TS.json': mockCities,
      'cities/TC-OS.json': mockOtherCities,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCountries', () => {
    it('returns list of countries', async () => {
      const result = await getCountries();
      expect(result).toEqual(mockCountries);
    });

    it('caches result on second call', async () => {
      await getCountries();
      await getCountries();
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCountryByCode', () => {
    it('returns country meta for valid code', async () => {
      const result = await getCountryByCode('TC');
      expect(result).toEqual(mockMeta);
    });

    it('returns null for invalid code', async () => {
      const result = await getCountryByCode('XX');
      expect(result).toBeNull();
    });

    it('returns null for empty string', async () => {
      const result = await getCountryByCode('');
      expect(result).toBeNull();
    });
  });

  describe('getStatesOfCountry', () => {
    it('returns states for valid country code', async () => {
      const result = await getStatesOfCountry('TC');
      expect(result).toEqual(mockStates);
    });

    it('returns empty array for invalid code', async () => {
      const result = await getStatesOfCountry('XX');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty string', async () => {
      const result = await getStatesOfCountry('');
      expect(result).toEqual([]);
    });
  });

  describe('getStateByCode', () => {
    it('returns state for valid codes', async () => {
      const result = await getStateByCode('TC', 'TS');
      expect(result?.name).toBe('TestState');
    });

    it('returns null for invalid state code', async () => {
      const result = await getStateByCode('TC', 'ZZ');
      expect(result).toBeNull();
    });
  });

  describe('getCitiesOfState', () => {
    it('returns cities for valid codes', async () => {
      const result = await getCitiesOfState('TC', 'TS');
      expect(result).toEqual(mockCities);
    });

    it('returns empty array for invalid codes', async () => {
      const result = await getCitiesOfState('XX', 'YY');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty strings', async () => {
      const result = await getCitiesOfState('', '');
      expect(result).toEqual([]);
    });
  });

  describe('getCityById', () => {
    it('returns city for valid id', async () => {
      const result = await getCityById('TC', 'TS', 100);
      expect(result?.name).toBe('TestVille');
    });

    it('returns null for invalid id', async () => {
      const result = await getCityById('TC', 'TS', 999);
      expect(result).toBeNull();
    });
  });

  describe('getAllCitiesOfCountry', () => {
    it('loads cities from all states', async () => {
      const result = await getAllCitiesOfCountry('TC');
      expect(result).toHaveLength(3);
      expect(result.map(c => c.name)).toContain('TestVille');
      expect(result.map(c => c.name)).toContain('AnotherCity');
    });
  });

  describe('getAllCitiesInWorld', () => {
    it('loads cities from all countries', async () => {
      const result = await getAllCitiesInWorld();
      expect(result).toHaveLength(3);
    });
  });
});
