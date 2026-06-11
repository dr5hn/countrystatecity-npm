import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  getCountries,
  getCountryByCode,
  getStatesOfCountry,
  getStateByCode,
  getCitiesOfState,
  getCityById,
  getAllCitiesOfCountry,
  isValidCountryCode,
  isValidStateCode,
  searchCitiesByName,
  getCountryNameByCode,
  getStateNameByCode,
  getCountryTimezones,
  configure,
  resetConfiguration,
  clearCache,
} from '../../src/index';

describe('integration: real data', () => {
  const dataDir = join(__dirname, '..', '..', 'src', 'data');

  beforeAll(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      const dataPath = url.replace(/^.*\/data\//, '');
      const filePath = join(dataDir, dataPath);
      try {
        const content = readFileSync(filePath, 'utf-8');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(JSON.parse(content)),
        });
      } catch {
        return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
      }
    }));
    configure({ baseURL: 'https://local.test' });
  });

  afterAll(() => {
    vi.restoreAllMocks();
    resetConfiguration();
  });

  beforeEach(() => {
    clearCache();
  });

  it('loads all countries', async () => {
    const countries = await getCountries();
    expect(countries.length).toBe(250);
    expect(countries[0]).toHaveProperty('id');
    expect(countries[0]).toHaveProperty('name');
    expect(countries[0]).toHaveProperty('iso2');
  });

  it('gets US metadata with timezones', async () => {
    const us = await getCountryByCode('US');
    expect(us).not.toBeNull();
    expect(us!.name).toBe('United States');
    expect(us!.iso2).toBe('US');
    expect(us!.timezones).toBeDefined();
    expect(us!.timezones.length).toBeGreaterThan(0);
    expect(us!.translations).toBeDefined();
  });

  it('returns null for nonexistent country', async () => {
    const result = await getCountryByCode('ZZ');
    expect(result).toBeNull();
  });

  it('loads US states', async () => {
    const states = await getStatesOfCountry('US');
    expect(states.length).toBeGreaterThan(50);
    const california = states.find((s) => s.iso2 === 'CA');
    expect(california).toBeDefined();
    expect(california!.name).toBe('California');
  });

  it('gets specific state by code', async () => {
    const state = await getStateByCode('US', 'CA');
    expect(state).not.toBeNull();
    expect(state!.name).toBe('California');
  });

  it('loads California cities', async () => {
    const cities = await getCitiesOfState('US', 'CA');
    expect(cities.length).toBeGreaterThan(1000);
    const la = cities.find((c) => c.name === 'Los Angeles');
    expect(la).toBeDefined();
  });

  it('gets city by ID', async () => {
    const cities = await getCitiesOfState('US', 'CA');
    const firstCity = cities[0];
    const found = await getCityById('US', 'CA', firstCity.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe(firstCity.name);
  });

  it('validates country codes', async () => {
    expect(await isValidCountryCode('US')).toBe(true);
    expect(await isValidCountryCode('IN')).toBe(true);
    expect(await isValidCountryCode('ZZ')).toBe(false);
  });

  it('validates state codes', async () => {
    expect(await isValidStateCode('US', 'CA')).toBe(true);
    expect(await isValidStateCode('US', 'ZZ')).toBe(false);
  });

  it('searches cities by name', async () => {
    const results = await searchCitiesByName('US', 'CA', 'Los Angeles');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Los Angeles');
  });

  it('gets country name by code', async () => {
    expect(await getCountryNameByCode('US')).toBe('United States');
    expect(await getCountryNameByCode('IN')).toBe('India');
    expect(await getCountryNameByCode('ZZ')).toBeNull();
  });

  it('gets state name by code', async () => {
    expect(await getStateNameByCode('US', 'CA')).toBe('California');
    expect(await getStateNameByCode('US', 'ZZ')).toBeNull();
  });

  it('gets country timezones', async () => {
    const timezones = await getCountryTimezones('US');
    expect(timezones.length).toBeGreaterThan(0);
    expect(timezones).toContain('America/New_York');
  });

  it('handles India data', async () => {
    const states = await getStatesOfCountry('IN');
    expect(states.length).toBeGreaterThan(30);
  });
});
