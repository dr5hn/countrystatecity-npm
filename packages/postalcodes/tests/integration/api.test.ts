import { describe, it, expect } from 'vitest';
import {
  getSupportedCountryCodes,
  getAllPostalCodesOfCountry,
  validatePostalCode,
  lookupPostalCode,
  searchPostalCodesByLocality,
  searchPostalCodesByLocalityInCountry,
} from '../../src';

/**
 * Integration tests demonstrating real-world usage patterns
 */
describe('API Integration Tests', () => {
  it('should handle a typical lookup-and-validate flow', async () => {
    const supported = await getSupportedCountryCodes();
    expect(supported).toContain('AD');

    const all = await getAllPostalCodesOfCountry('AD');
    expect(all.length).toBeGreaterThan(0);

    const sample = all[0];
    expect(await validatePostalCode('AD', sample.code)).toBe(true);

    const matches = await lookupPostalCode('AD', sample.code);
    expect(matches.some((m) => m.id === sample.id)).toBe(true);

    const search = await searchPostalCodesByLocalityInCountry('AD', sample.locality_name);
    expect(search.some((r) => r.id === sample.id)).toBe(true);
  });

  it('should never expose city_id — it is null on 100% of upstream records', async () => {
    const all = await getAllPostalCodesOfCountry('AD');
    expect(all.length).toBeGreaterThan(0);
    expect(all[0]).not.toHaveProperty('city_id');
  });

  it('should handle invalid inputs gracefully across the public API', async () => {
    await expect(validatePostalCode('ZZ', 'X')).resolves.toBe(false);
    await expect(lookupPostalCode('ZZ', 'X')).resolves.toEqual([]);
    await expect(searchPostalCodesByLocality('ZZ', 'YY', 'term')).resolves.toEqual([]);
    await expect(searchPostalCodesByLocalityInCountry('ZZ', 'term')).resolves.toEqual([]);
    await expect(getAllPostalCodesOfCountry('ZZ')).resolves.toEqual([]);
  });

  it('should intentionally cover only a subset of countries', async () => {
    // Unlike @countrystatecity/countries (250), postal code coverage is currently ~125 countries.
    const supported = await getSupportedCountryCodes();
    expect(supported.length).toBeLessThan(250);
    expect(supported.length).toBeGreaterThan(50);
  });

  it('should work end-to-end for a mixed (state + unassigned) country', async () => {
    const all = await getAllPostalCodesOfCountry('NL');
    expect(all.length).toBeGreaterThan(0);
    expect(all.some((r) => r.state_code === null)).toBe(true);
    expect(all.some((r) => r.state_code !== null)).toBe(true);
  });
});
