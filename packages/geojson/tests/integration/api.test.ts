import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  getCountriesGeoJSON,
  getCountryGeoJSON,
  getStatesGeoJSON,
  getCitiesGeoJSON,
  getAllCitiesGeoJSONOfCountry,
  clearCache,
} from '../../src';
import { configure, resetConfiguration } from '../../src/config';

const DATA_DIR = join(__dirname, '..', '..', 'src', 'data');

function readJSON(relativePath: string) {
  return JSON.parse(readFileSync(join(DATA_DIR, relativePath), 'utf-8'));
}

function mockFetch() {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    const path = url.replace('https://cdn.test.com/data/', '');
    try {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(readJSON(path)) });
    } catch {
      return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
    }
  }));
}

/**
 * Integration tests against the actual generated data files (not mocked
 * fixtures), verifying the real transform from countries/src/data produced
 * valid, usable GeoJSON.
 */
describe('API Integration Tests', () => {
  beforeEach(() => {
    resetConfiguration();
    configure({ baseURL: 'https://cdn.test.com' });
    clearCache();
    vi.restoreAllMocks();
    mockFetch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return valid GeoJSON for all countries', async () => {
    const collection = await getCountriesGeoJSON();
    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features.length).toBeGreaterThan(200);
    expect(collection.features.every((f) => f.type === 'Feature' && f.geometry.type === 'Point')).toBe(true);
  });

  it('should find the United States as a single feature', async () => {
    const feature = await getCountryGeoJSON('US');
    expect(feature).not.toBeNull();
    expect(feature?.properties.name).toBe('United States');
    expect(feature?.geometry.coordinates).toHaveLength(2);
  });

  it('should handle a typical country -> state -> city drilldown', async () => {
    const states = await getStatesGeoJSON('US');
    expect(states.features.length).toBeGreaterThan(0);

    const california = states.features.find((s) => s.properties.iso2 === 'CA');
    expect(california).toBeDefined();

    const cities = await getCitiesGeoJSON('US', 'CA');
    expect(cities.features.length).toBeGreaterThan(0);
    expect(cities.features.every((c) => c.properties.country_code === 'US')).toBe(true);
  });

  it('should merge all cities of a small country into one collection', async () => {
    const all = await getAllCitiesGeoJSONOfCountry('AD');
    expect(all.features.length).toBeGreaterThan(0);
    expect(all.features.every((f) => f.geometry.type === 'Point')).toBe(true);
  });

  it('should handle invalid country codes gracefully', async () => {
    expect(await getCountryGeoJSON('INVALID')).toBeNull();
    expect(await getStatesGeoJSON('INVALID')).toEqual({ type: 'FeatureCollection', features: [] });
    expect(await getCitiesGeoJSON('INVALID', 'INVALID')).toEqual({ type: 'FeatureCollection', features: [] });
  });
});
