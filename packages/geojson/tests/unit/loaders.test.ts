import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCountriesGeoJSON,
  getCountryGeoJSON,
  getStatesGeoJSON,
  getCitiesGeoJSON,
  getAllCitiesGeoJSONOfCountry,
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

const mockCountries = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [10, 20] },
      properties: { id: 1, name: 'TestCountry', iso2: 'TC', iso3: 'TST' },
    },
  ],
};

const mockStates = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [11, 21] },
      properties: { id: 10, name: 'TestState', iso2: 'TS', country_code: 'TC' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [12, 22] },
      properties: { id: 11, name: 'OtherState', iso2: 'OS', country_code: 'TC' },
    },
  ],
};

const mockCitiesTS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [11.1, 21.1] },
      properties: { id: 100, name: 'TestVille', state_code: 'TS', country_code: 'TC' },
    },
  ],
};

const mockCitiesOS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [12.1, 22.1] },
      properties: { id: 200, name: 'AnotherCity', state_code: 'OS', country_code: 'TC' },
    },
  ],
};

describe('loaders', () => {
  beforeEach(() => {
    resetConfiguration();
    configure({ baseURL: 'https://cdn.test.com' });
    clearCache();
    vi.restoreAllMocks();
    mockFetch({
      'countries.geojson': mockCountries,
      'states/TC.geojson': mockStates,
      'cities/TC-TS.geojson': mockCitiesTS,
      'cities/TC-OS.geojson': mockCitiesOS,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCountriesGeoJSON', () => {
    it('returns a FeatureCollection of countries', async () => {
      const result = await getCountriesGeoJSON();
      expect(result).toEqual(mockCountries);
    });

    it('caches result on second call', async () => {
      await getCountriesGeoJSON();
      await getCountriesGeoJSON();
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCountryGeoJSON', () => {
    it('returns a single feature for a valid code', async () => {
      const result = await getCountryGeoJSON('TC');
      expect(result?.properties.name).toBe('TestCountry');
      expect(result?.geometry.type).toBe('Point');
    });

    it('returns null for an unknown code', async () => {
      expect(await getCountryGeoJSON('ZZ')).toBeNull();
    });

    it('returns null for an empty code', async () => {
      expect(await getCountryGeoJSON('')).toBeNull();
    });
  });

  describe('getStatesGeoJSON', () => {
    it('returns a FeatureCollection of states', async () => {
      const result = await getStatesGeoJSON('TC');
      expect(result).toEqual(mockStates);
    });

    it('returns an empty FeatureCollection for an unknown country', async () => {
      expect(await getStatesGeoJSON('ZZ')).toEqual({ type: 'FeatureCollection', features: [] });
    });
  });

  describe('getCitiesGeoJSON', () => {
    it('returns a FeatureCollection of cities', async () => {
      const result = await getCitiesGeoJSON('TC', 'TS');
      expect(result).toEqual(mockCitiesTS);
    });

    it('returns an empty FeatureCollection for unknown codes', async () => {
      expect(await getCitiesGeoJSON('ZZ', 'YY')).toEqual({ type: 'FeatureCollection', features: [] });
    });
  });

  describe('getAllCitiesGeoJSONOfCountry', () => {
    it('merges cities across all states into one FeatureCollection', async () => {
      const result = await getAllCitiesGeoJSONOfCountry('TC');
      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(2);
      expect(result.features.map((f) => f.properties.name).sort()).toEqual(['AnotherCity', 'TestVille']);
    });
  });
});
