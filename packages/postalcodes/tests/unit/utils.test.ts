import { describe, it, expect } from 'vitest';
import { getPostalCodesOfState } from '../../src/loaders';
import {
  validatePostalCode,
  lookupPostalCode,
  searchPostalCodesByLocality,
  searchPostalCodesByLocalityInCountry,
  getSupportedCountryCodes,
  isCountrySupported,
} from '../../src/utils';

describe('Utils', () => {
  describe('validatePostalCode', () => {
    it('should return true for a real code (existence check)', async () => {
      expect(await validatePostalCode('AD', 'AD100')).toBe(true);
    });

    it('should return false for a code that does not exist', async () => {
      expect(await validatePostalCode('AD', 'NOT-A-REAL-CODE')).toBe(false);
    });

    it('should return false (not throw) for an unsupported country', async () => {
      expect(await validatePostalCode('ZZ', 'AD100')).toBe(false);
    });
  });

  describe('lookupPostalCode', () => {
    it('should return an array containing the matching record', async () => {
      const matches = await lookupPostalCode('AD', 'AD100');
      expect(Array.isArray(matches)).toBe(true);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].locality_name).toBe('Canillo');
    });

    it('should return every match when a code is duplicated within a state file', async () => {
      // Postal codes are not unique — discover a real duplicate (or single) dynamically
      // rather than hardcoding an unverified example.
      const codes = await getPostalCodesOfState('AD', '02');
      const counts = new Map<string, number>();
      for (const c of codes) counts.set(c.code, (counts.get(c.code) || 0) + 1);
      const [sampleCode, occurrences] = [...counts.entries()][0];

      const matches = await lookupPostalCode('AD', sampleCode, '02');
      expect(matches.length).toBe(occurrences);
    });
  });

  describe('searchPostalCodesByLocality', () => {
    it('should find a code by locality name, case-insensitively', async () => {
      const results = await searchPostalCodesByLocality('AD', '02', 'canillo');
      expect(results.some((r) => r.code === 'AD100')).toBe(true);
    });
  });

  describe('searchPostalCodesByLocalityInCountry', () => {
    it('should find a code by locality name across the whole country', async () => {
      const results = await searchPostalCodesByLocalityInCountry('AD', 'Canillo');
      expect(results.some((r) => r.code === 'AD100')).toBe(true);
    });
  });

  describe('getSupportedCountryCodes / isCountrySupported', () => {
    it('should include known-supported countries', async () => {
      const codes = await getSupportedCountryCodes();
      expect(codes).toContain('AD');
      expect(codes).toContain('PT');
    });

    it('should report support correctly', async () => {
      expect(await isCountrySupported('AD')).toBe(true);
      expect(await isCountrySupported('ZZ')).toBe(false);
    });
  });
});
