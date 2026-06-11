import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidCountryCode,
  isValidStateCode,
  searchCitiesByName,
  getCountryNameByCode,
  getStateNameByCode,
  getTimezoneForCity,
  getCountryTimezones,
} from '../../src/utils';
import { configure, resetConfiguration } from '../../src/config';
import { clearCache } from '../../src/loaders';

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
  { id: 1, name: 'Testland', iso2: 'TL', iso3: 'TLD', numeric_code: '001', phonecode: '1', capital: 'TestCity', currency: 'TLD', currency_name: 'Test Dollar', currency_symbol: '$', tld: '.tl', native: 'Testland', region: 'Test', subregion: 'Test', nationality: 'Tester', latitude: '0.00', longitude: '0.00', emoji: '🏳️', emojiU: 'U+1F3F3' },
];

const mockMeta = {
  ...mockCountries[0],
  timezones: [
    { zoneName: 'Test/North', gmtOffset: 0, gmtOffsetName: 'UTC+00:00', abbreviation: 'TN', tzName: 'Test North' },
    { zoneName: 'Test/South', gmtOffset: 3600, gmtOffsetName: 'UTC+01:00', abbreviation: 'TS', tzName: 'Test South' },
  ],
  translations: { en: 'Testland' },
};

const mockStates = [
  { id: 10, name: 'Alpha State', country_id: 1, country_code: 'TL', fips_code: null, iso2: 'AS', type: 'state', latitude: '1.00', longitude: '1.00', native: null, timezone: 'Test/North', translations: {} },
];

const mockCities = [
  { id: 100, name: 'Springfield', state_id: 10, state_code: 'AS', country_id: 1, country_code: 'TL', latitude: '1.10', longitude: '1.10', native: null, timezone: 'Test/North', translations: {} },
  { id: 101, name: 'Springville', state_id: 10, state_code: 'AS', country_id: 1, country_code: 'TL', latitude: '1.20', longitude: '1.20', native: null, timezone: 'Test/South', translations: {} },
  { id: 102, name: 'Oaktown', state_id: 10, state_code: 'AS', country_id: 1, country_code: 'TL', latitude: '1.30', longitude: '1.30', native: null, timezone: 'Test/North', translations: {} },
];

describe('utils', () => {
  beforeEach(() => {
    resetConfiguration();
    configure({ baseURL: 'https://cdn.test.com' });
    clearCache();
    vi.restoreAllMocks();
    mockFetch({
      'countries.json': mockCountries,
      'country/TL.json': mockMeta,
      'states/TL.json': mockStates,
      'cities/TL-AS.json': mockCities,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidCountryCode', () => {
    it('returns true for valid code', async () => {
      expect(await isValidCountryCode('TL')).toBe(true);
    });
    it('returns false for invalid code', async () => {
      expect(await isValidCountryCode('ZZ')).toBe(false);
    });
  });

  describe('isValidStateCode', () => {
    it('returns true for valid state code', async () => {
      expect(await isValidStateCode('TL', 'AS')).toBe(true);
    });
    it('returns false for invalid state code', async () => {
      expect(await isValidStateCode('TL', 'ZZ')).toBe(false);
    });
  });

  describe('searchCitiesByName', () => {
    it('finds cities by partial name match', async () => {
      const results = await searchCitiesByName('TL', 'AS', 'spring');
      expect(results).toHaveLength(2);
      expect(results.map(c => c.name)).toEqual(['Springfield', 'Springville']);
    });
    it('returns empty array when no match', async () => {
      const results = await searchCitiesByName('TL', 'AS', 'nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('getCountryNameByCode', () => {
    it('returns country name for valid code', async () => {
      expect(await getCountryNameByCode('TL')).toBe('Testland');
    });
    it('returns null for invalid code', async () => {
      expect(await getCountryNameByCode('ZZ')).toBeNull();
    });
  });

  describe('getStateNameByCode', () => {
    it('returns state name for valid codes', async () => {
      expect(await getStateNameByCode('TL', 'AS')).toBe('Alpha State');
    });
    it('returns null for invalid codes', async () => {
      expect(await getStateNameByCode('TL', 'ZZ')).toBeNull();
    });
  });

  describe('getTimezoneForCity', () => {
    it('returns timezone for valid city', async () => {
      expect(await getTimezoneForCity('TL', 'AS', 'Springfield')).toBe('Test/North');
    });
    it('returns null for unknown city', async () => {
      expect(await getTimezoneForCity('TL', 'AS', 'Unknown')).toBeNull();
    });
  });

  describe('getCountryTimezones', () => {
    it('returns all timezone names', async () => {
      const timezones = await getCountryTimezones('TL');
      expect(timezones).toEqual(['Test/North', 'Test/South']);
    });
    it('returns empty array for invalid country', async () => {
      const timezones = await getCountryTimezones('ZZ');
      expect(timezones).toEqual([]);
    });
  });
});
