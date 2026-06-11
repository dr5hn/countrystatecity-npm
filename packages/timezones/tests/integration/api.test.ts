import { describe, it, expect } from 'vitest';
import {
  getTimezones,
  getTimezonesByCountry,
  getTimezoneInfo,
  convertTime,
  getCurrentTime,
  searchTimezones
} from '../../src';

describe('Timezone API Integration', () => {
  describe('Complete workflow: Find and convert timezone', () => {
    it('should find timezone by country and convert time', async () => {
      // 1. Get timezones for US
      const usTimezones = await getTimezonesByCountry('US');
      expect(usTimezones.length).toBeGreaterThan(0);
      
      // 2. Find New York timezone
      const nyTimezone = usTimezones.find(tz => 
        tz.zoneName === 'America/New_York'
      );
      expect(nyTimezone).toBeDefined();
      
      // 3. Get current time in NY
      const nyTime = await getCurrentTime('America/New_York');
      expect(nyTime).toBeDefined();
      
      // 4. Convert to London time
      const converted = await convertTime(
        nyTime,
        'America/New_York',
        'Europe/London'
      );
      expect(converted.fromTimezone).toBe('America/New_York');
      expect(converted.toTimezone).toBe('Europe/London');
    });
  });

  describe('Search and information retrieval', () => {
    it('should search timezones and get detailed info', async () => {
      // 1. Search for Pacific timezones
      const results = await searchTimezones('pacific');
      expect(results.length).toBeGreaterThan(0);
      
      // 2. Get info for first result
      if (results.length > 0) {
        const info = await getTimezoneInfo(results[0].zoneName);
        expect(info).not.toBeNull();
        expect(info?.timezone).toBe(results[0].zoneName);
      }
    });
  });

  describe('Multi-country timezone comparison', () => {
    it('should get timezones for multiple countries', async () => {
      const countries = ['US', 'GB', 'IN', 'JP', 'AU'];
      const countryTimezones = new Map();
      
      for (const country of countries) {
        const timezones = await getTimezonesByCountry(country);
        countryTimezones.set(country, timezones);
      }
      
      // Verify all countries have timezones
      expect(countryTimezones.size).toBe(5);
      for (const [country, timezones] of countryTimezones.entries()) {
        expect(timezones.length).toBeGreaterThan(0);
        expect(timezones[0].countryCode).toBe(country);
      }
    });
  });

  describe('Data consistency', () => {
    it('should have consistent timezone data structure', async () => {
      const timezones = await getTimezones();
      
      // Check first 10 timezones for consistency
      for (let i = 0; i < Math.min(10, timezones.length); i++) {
        const tz = timezones[i];
        
        // All required fields should be present
        expect(tz.zoneName).toBeDefined();
        expect(tz.countryCode).toBeDefined();
        expect(tz.abbreviation).toBeDefined();
        expect(typeof tz.gmtOffset).toBe('number');
        expect(tz.gmtOffsetName).toBeDefined();
        expect(tz.tzName).toBeDefined();
        
        // Country code should be 2 characters
        expect(tz.countryCode.length).toBe(2);
        
        // Zone name should contain '/'
        expect(tz.zoneName).toContain('/');
        
        // GMT offset should be reasonable (between -12 and +14 hours)
        expect(tz.gmtOffset).toBeGreaterThanOrEqual(-43200); // -12 hours
        expect(tz.gmtOffset).toBeLessThanOrEqual(50400);     // +14 hours
      }
    });
  });

  describe('Performance: Lazy loading', () => {
    it('should not load all data when getting single country', async () => {
      // This test verifies lazy loading behavior
      // Getting one country should be fast (< 100ms typically)
      const start = Date.now();
      const timezones = await getTimezonesByCountry('US');
      const duration = Date.now() - start;
      
      expect(timezones.length).toBeGreaterThan(0);
      // Should be very fast due to small file size
      expect(duration).toBeLessThan(1000); // generous timeout
    });
  });
});
