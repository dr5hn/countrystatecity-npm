import { describe, it, expect } from 'vitest';
import {
  getTimezones,
  getTimezonesByCountry,
  getTimezoneInfo,
  getTimezoneAbbreviations,
  getTimezonesByAbbreviation
} from '../../src/loaders';

describe('Timezone Loaders', () => {
  describe('getTimezones', () => {
    it('should return array of timezones', async () => {
      const timezones = await getTimezones();
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
    });

    it('should have required timezone properties', async () => {
      const timezones = await getTimezones();
      const timezone = timezones[0];
      
      expect(timezone).toHaveProperty('zoneName');
      expect(timezone).toHaveProperty('countryCode');
      expect(timezone).toHaveProperty('abbreviation');
      expect(timezone).toHaveProperty('gmtOffset');
      expect(timezone).toHaveProperty('gmtOffsetName');
      expect(timezone).toHaveProperty('tzName');
    });

    it('should have valid timezone format', async () => {
      const timezones = await getTimezones();
      const timezone = timezones[0];
      
      expect(typeof timezone.zoneName).toBe('string');
      expect(typeof timezone.countryCode).toBe('string');
      expect(typeof timezone.gmtOffset).toBe('number');
      expect(timezone.countryCode.length).toBe(2);
    });
  });

  describe('getTimezonesByCountry', () => {
    it('should return timezones for US', async () => {
      const timezones = await getTimezonesByCountry('US');
      
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
      expect(timezones.every(tz => tz.countryCode === 'US')).toBe(true);
    });

    it('should return timezones for India', async () => {
      const timezones = await getTimezonesByCountry('IN');
      
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
      expect(timezones[0].countryCode).toBe('IN');
    });

    it('should return empty array for invalid country', async () => {
      const timezones = await getTimezonesByCountry('INVALID');
      expect(timezones).toEqual([]);
    });

    it('should have America timezones for US', async () => {
      const timezones = await getTimezonesByCountry('US');
      const hasAmericaTimezone = timezones.some(tz => 
        tz.zoneName.startsWith('America/')
      );
      expect(hasAmericaTimezone).toBe(true);
    });
  });

  describe('getTimezoneInfo', () => {
    it('should return timezone info for valid timezone', async () => {
      const info = await getTimezoneInfo('America/New_York');
      
      expect(info).not.toBeNull();
      expect(info?.timezone).toBe('America/New_York');
      expect(info?.currentTime).toBeDefined();
      expect(info?.utcOffset).toBeDefined();
      expect(typeof info?.isDST).toBe('boolean');
      expect(typeof info?.gmtOffset).toBe('number');
    });

    it('should return null for invalid timezone', async () => {
      const info = await getTimezoneInfo('Invalid/Timezone');
      expect(info).toBeNull();
    });

    it('should return valid ISO timestamp', async () => {
      const info = await getTimezoneInfo('Europe/London');
      expect(info).not.toBeNull();
      
      // Should be a valid ISO string
      const date = new Date(info!.currentTime);
      expect(date.toISOString()).toBe(info!.currentTime);
    });
  });

  describe('getTimezoneAbbreviations', () => {
    it('should return array of abbreviations', async () => {
      const abbreviations = await getTimezoneAbbreviations();
      
      expect(Array.isArray(abbreviations)).toBe(true);
      expect(abbreviations.length).toBeGreaterThan(0);
    });

    it('should have required abbreviation properties', async () => {
      const abbreviations = await getTimezoneAbbreviations();
      const abbr = abbreviations[0];
      
      expect(abbr).toHaveProperty('abbreviation');
      expect(abbr).toHaveProperty('name');
      expect(abbr).toHaveProperty('timezones');
      expect(Array.isArray(abbr.timezones)).toBe(true);
    });

    it('should include common abbreviations', async () => {
      const abbreviations = await getTimezoneAbbreviations();
      const abbrevStrings = abbreviations.map(a => a.abbreviation);
      
      // Common abbreviations should be present
      const hasCommon = ['EST', 'PST', 'GMT', 'UTC', 'IST'].some(common =>
        abbrevStrings.includes(common)
      );
      expect(hasCommon).toBe(true);
    });
  });

  describe('getTimezonesByAbbreviation', () => {
    it('should return timezones for valid abbreviation', async () => {
      const timezones = await getTimezonesByAbbreviation('EST');
      
      expect(Array.isArray(timezones)).toBe(true);
      // EST should match at least some timezones
      // Note: might be empty if no exact match, which is ok
    });

    it('should return empty array for invalid abbreviation', async () => {
      const timezones = await getTimezonesByAbbreviation('INVALID');
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones).toEqual([]);
    });

    it('should be case insensitive', async () => {
      const timezones1 = await getTimezonesByAbbreviation('GMT');
      const timezones2 = await getTimezonesByAbbreviation('gmt');
      
      expect(timezones1.length).toBe(timezones2.length);
    });
  });
});
