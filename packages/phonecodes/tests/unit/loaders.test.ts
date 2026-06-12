import { describe, it, expect } from 'vitest';
import {
  getPhonecodes,
  getPhonecodeByCountry,
  getCountriesByDialCode,
  isValidDialCode,
  searchPhonecodes,
  getDialCode,
  getPhonecode,
  formatWithDialCode,
} from '../../src/index.js';

describe('Phonecode Loaders', () => {
  describe('getPhonecodes', () => {
    it('should return an array', async () => {
      const result = await getPhonecodes();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should have required properties', async () => {
      const result = await getPhonecodes();
      const entry = result[0];
      expect(entry).toHaveProperty('iso2');
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('dialCode');
      expect(entry).toHaveProperty('phonecode');
    });

    it('should have dialCode starting with +', async () => {
      const result = await getPhonecodes();
      for (const entry of result) {
        expect(entry.dialCode.startsWith('+')).toBe(true);
      }
    });

    it('should be sorted by iso2', async () => {
      const result = await getPhonecodes();
      for (let i = 1; i < result.length; i++) {
        expect(result[i].iso2 >= result[i - 1].iso2).toBe(true);
      }
    });
  });

  describe('getPhonecodeByCountry', () => {
    it('should return entry for IN', async () => {
      const entry = await getPhonecodeByCountry('IN');
      expect(entry).toBeDefined();
      expect(entry?.iso2).toBe('IN');
      expect(entry?.dialCode).toBe('+91');
      expect(entry?.phonecode).toBe('91');
    });

    it('should return entry for US', async () => {
      const entry = await getPhonecodeByCountry('US');
      expect(entry).toBeDefined();
      expect(entry?.dialCode).toBe('+1');
    });

    it('should be case insensitive', async () => {
      const lower = await getPhonecodeByCountry('in');
      const upper = await getPhonecodeByCountry('IN');
      expect(lower?.iso2).toBe(upper?.iso2);
    });

    it('should return undefined for unknown code', async () => {
      expect(await getPhonecodeByCountry('XX')).toBeUndefined();
    });
  });

  describe('getCountriesByDialCode', () => {
    it('should return multiple countries for +1', async () => {
      const result = await getCountriesByDialCode('+1');
      expect(result.length).toBeGreaterThan(1);
      const iso2s = result.map((p) => p.iso2);
      expect(iso2s).toContain('US');
      expect(iso2s).toContain('CA');
    });

    it('should work without + prefix', async () => {
      const withPlus = await getCountriesByDialCode('+91');
      const without = await getCountriesByDialCode('91');
      expect(withPlus.map((p) => p.iso2)).toEqual(without.map((p) => p.iso2));
    });

    it('should return empty for non-existent dial code', async () => {
      expect(await getCountriesByDialCode('+9999')).toHaveLength(0);
    });
  });

  describe('isValidDialCode', () => {
    it('should return true for +91', async () => {
      expect(await isValidDialCode('+91')).toBe(true);
    });

    it('should return true for +1', async () => {
      expect(await isValidDialCode('+1')).toBe(true);
    });

    it('should return false for unknown code', async () => {
      expect(await isValidDialCode('+9999')).toBe(false);
    });
  });

  describe('searchPhonecodes', () => {
    it('should find by country name', async () => {
      const result = await searchPhonecodes('india');
      expect(result.some((p) => p.iso2 === 'IN')).toBe(true);
    });

    it('should find by dial code', async () => {
      const result = await searchPhonecodes('+44');
      expect(result.some((p) => p.iso2 === 'GB')).toBe(true);
    });

    it('should be case insensitive', async () => {
      const lower = await searchPhonecodes('india');
      const upper = await searchPhonecodes('INDIA');
      expect(lower.map((p) => p.iso2)).toEqual(upper.map((p) => p.iso2));
    });

    it('should return empty for no match', async () => {
      expect(await searchPhonecodes('zzznomatch')).toHaveLength(0);
    });
  });

  describe('getDialCode', () => {
    it('should return +91 for IN', async () => {
      expect(await getDialCode('IN')).toBe('+91');
    });

    it('should return undefined for unknown country', async () => {
      expect(await getDialCode('XX')).toBeUndefined();
    });
  });

  describe('getPhonecode', () => {
    it('should return 91 for IN', async () => {
      expect(await getPhonecode('IN')).toBe('91');
    });

    it('should return 1 for US', async () => {
      expect(await getPhonecode('US')).toBe('1');
    });
  });

  describe('formatWithDialCode', () => {
    it('should format a number with dial code', async () => {
      const result = await formatWithDialCode('9876543210', 'IN');
      expect(result).toBe('+91 9876543210');
    });

    it('should return local number unchanged for unknown country', async () => {
      const result = await formatWithDialCode('123', 'XX');
      expect(result).toBe('123');
    });
  });
});
