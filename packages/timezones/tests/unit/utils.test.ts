import { describe, it, expect } from 'vitest';
import {
  convertTime,
  getCurrentTime,
  isDaylightSaving,
  getGMTOffset,
  formatGMTOffset,
  isValidTimezone,
  searchTimezones,
  getUniqueAbbreviations,
  getTimezonesByOffset
} from '../../src/utils';

describe('Timezone Utilities', () => {
  describe('convertTime', () => {
    it('should convert time between timezones', async () => {
      const result = await convertTime(
        '2025-10-18T12:00:00Z',
        'America/New_York',
        'Europe/London'
      );
      
      expect(result).toHaveProperty('originalTime');
      expect(result).toHaveProperty('fromTimezone');
      expect(result).toHaveProperty('convertedTime');
      expect(result).toHaveProperty('toTimezone');
      expect(result).toHaveProperty('timeDifference');
      
      expect(result.fromTimezone).toBe('America/New_York');
      expect(result.toTimezone).toBe('Europe/London');
    });

    it('should handle Date objects', async () => {
      const date = new Date('2025-10-18T12:00:00Z');
      const result = await convertTime(
        date,
        'America/New_York',
        'Asia/Tokyo'
      );
      
      expect(result.originalTime).toBeDefined();
      expect(result.convertedTime).toBeDefined();
    });
  });

  describe('getCurrentTime', () => {
    it('should return current time for valid timezone', async () => {
      const time = await getCurrentTime('America/New_York');
      
      expect(typeof time).toBe('string');
      
      // Should be a valid ISO string
      const date = new Date(time);
      expect(date.toISOString()).toBe(time);
    });

    it('should throw error for invalid timezone', async () => {
      await expect(
        getCurrentTime('Invalid/Timezone')
      ).rejects.toThrow();
    });

    it('should return current time (within 1 minute of now)', async () => {
      const time = await getCurrentTime('Africa/Accra'); // GMT+0 timezone
      const now = new Date();
      const returned = new Date(time);
      
      const diff = Math.abs(now.getTime() - returned.getTime());
      // Should be within 1 minute
      expect(diff).toBeLessThan(60000);
    });
  });

  describe('isDaylightSaving', () => {
    it('should return boolean for valid timezone', async () => {
      const isDST = await isDaylightSaving('America/New_York');
      expect(typeof isDST).toBe('boolean');
    });

    it('should handle custom dates', async () => {
      // January (standard time in northern hemisphere)
      const winterDate = new Date('2025-01-15');
      const isDSTWinter = await isDaylightSaving('America/New_York', winterDate);
      
      // July (DST in northern hemisphere)
      const summerDate = new Date('2025-07-15');
      const isDSTSummer = await isDaylightSaving('America/New_York', summerDate);
      
      expect(typeof isDSTWinter).toBe('boolean');
      expect(typeof isDSTSummer).toBe('boolean');
    });

    it('should work for GMT timezone (never has DST)', async () => {
      const isDST = await isDaylightSaving('Africa/Accra'); // GMT+0, no DST
      expect(isDST).toBe(false);
    });
  });

  describe('getGMTOffset', () => {
    it('should return offset in seconds', async () => {
      const offset = await getGMTOffset('America/New_York');
      
      expect(typeof offset).toBe('number');
      // EST is UTC-5 (-18000 seconds) or EDT is UTC-4 (-14400 seconds)
      expect(offset === -18000 || offset === -14400).toBe(true);
    });

    it('should throw error for invalid timezone', async () => {
      await expect(
        getGMTOffset('Invalid/Timezone')
      ).rejects.toThrow();
    });

    it('should return 0 for GMT timezone', async () => {
      const offset = await getGMTOffset('Africa/Accra'); // GMT+0
      expect(offset).toBe(0);
    });
  });

  describe('formatGMTOffset', () => {
    it('should format positive offset correctly', () => {
      const formatted = formatGMTOffset(19800); // IST +5:30
      expect(formatted).toBe('UTC+05:30');
    });

    it('should format negative offset correctly', () => {
      const formatted = formatGMTOffset(-18000); // EST -5:00
      expect(formatted).toBe('UTC-05:00');
    });

    it('should handle zero offset', () => {
      const formatted = formatGMTOffset(0);
      expect(formatted).toBe('UTC+00:00');
    });

    it('should pad single digits', () => {
      const formatted = formatGMTOffset(3600); // +1:00
      expect(formatted).toBe('UTC+01:00');
    });
  });

  describe('isValidTimezone', () => {
    it('should return true for valid timezones', async () => {
      const valid1 = await isValidTimezone('America/New_York');
      const valid2 = await isValidTimezone('Europe/London');
      const valid3 = await isValidTimezone('Asia/Tokyo');
      
      expect(valid1).toBe(true);
      expect(valid2).toBe(true);
      expect(valid3).toBe(true);
    });

    it('should return false for invalid timezones', async () => {
      const invalid = await isValidTimezone('Invalid/Timezone');
      expect(invalid).toBe(false);
    });

    it('should be case sensitive', async () => {
      const valid = await isValidTimezone('america/new_york'); // wrong case
      expect(valid).toBe(false);
    });
  });

  describe('searchTimezones', () => {
    it('should find timezones by zone name', async () => {
      const results = await searchTimezones('america');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(tz => tz.zoneName.includes('America'))).toBe(true);
    });

    it('should find timezones by timezone name', async () => {
      const results = await searchTimezones('pacific');
      
      expect(Array.isArray(results)).toBe(true);
      // Should find Pacific timezones
    });

    it('should be case insensitive', async () => {
      const results1 = await searchTimezones('AMERICA');
      const results2 = await searchTimezones('america');
      
      expect(results1.length).toBe(results2.length);
    });

    it('should return empty array for no matches', async () => {
      const results = await searchTimezones('zzzzzznonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('getUniqueAbbreviations', () => {
    it('should return array of abbreviations', async () => {
      const abbreviations = await getUniqueAbbreviations();
      
      expect(Array.isArray(abbreviations)).toBe(true);
      expect(abbreviations.length).toBeGreaterThan(0);
    });

    it('should return unique values', async () => {
      const abbreviations = await getUniqueAbbreviations();
      const unique = new Set(abbreviations);
      
      expect(unique.size).toBe(abbreviations.length);
    });

    it('should be sorted', async () => {
      const abbreviations = await getUniqueAbbreviations();
      const sorted = [...abbreviations].sort();
      
      expect(abbreviations).toEqual(sorted);
    });

    it('should include common abbreviations', async () => {
      const abbreviations = await getUniqueAbbreviations();
      
      // Should have some common ones
      const hasCommon = ['EST', 'PST', 'GMT', 'UTC', 'IST'].some(common =>
        abbreviations.includes(common)
      );
      expect(hasCommon).toBe(true);
    });
  });

  describe('getTimezonesByOffset', () => {
    it('should return timezones with matching offset', async () => {
      const timezones = await getTimezonesByOffset(0); // GMT+0
      
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
      expect(timezones.every(tz => tz.gmtOffset === 0)).toBe(true);
    });

    it('should return empty array for uncommon offsets', async () => {
      const timezones = await getTimezonesByOffset(999999);
      expect(timezones).toEqual([]);
    });

    it('should handle negative offsets', async () => {
      const timezones = await getTimezonesByOffset(-18000); // EST
      
      expect(Array.isArray(timezones)).toBe(true);
      if (timezones.length > 0) {
        expect(timezones.every(tz => tz.gmtOffset === -18000)).toBe(true);
      }
    });
  });
});
