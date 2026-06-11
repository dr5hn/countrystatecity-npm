import { describe, it, expect } from 'vitest';
import {
  getTimezones,
  getTimezonesByCountry,
  getTimezoneInfo,
  convertTime
} from '../../src';

describe('iOS Safari Compatibility', () => {
  describe('Stack overflow prevention', () => {
    it('should load all timezones without stack overflow', async () => {
      const timezones = await getTimezones();
      
      expect(timezones).toBeDefined();
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
    });

    it('should load country timezones without stack overflow', async () => {
      const timezones = await getTimezonesByCountry('US');
      
      expect(timezones).toBeDefined();
      expect(timezones.length).toBeGreaterThan(0);
    });

    it('should handle multiple sequential loads', async () => {
      // Simulates user browsing through timezones
      const timezones = await getTimezones();
      expect(timezones.length).toBeGreaterThan(0);

      const usTimezones = await getTimezonesByCountry('US');
      expect(usTimezones.length).toBeGreaterThan(0);

      const gbTimezones = await getTimezonesByCountry('GB');
      expect(gbTimezones.length).toBeGreaterThan(0);

      const inTimezones = await getTimezonesByCountry('IN');
      expect(inTimezones.length).toBeGreaterThan(0);
    });
  });

  describe('Bundle size validation', () => {
    it('should have reasonable main data file size', async () => {
      const timezones = await getTimezones();
      const size = JSON.stringify(timezones).length;
      
      // Main file should be under 100KB
      expect(size).toBeLessThan(100 * 1024);
    });

    it('should have small country data files', async () => {
      const timezones = await getTimezonesByCountry('US');
      const size = JSON.stringify(timezones).length;
      
      // Country files should be under 5KB
      expect(size).toBeLessThan(5 * 1024);
    });
  });

  describe('Memory management', () => {
    it('should handle loading multiple countries without memory issues', async () => {
      const countries = ['US', 'GB', 'IN', 'JP', 'AU', 'CA', 'DE', 'FR', 'IT', 'ES'];
      
      for (const country of countries) {
        const timezones = await getTimezonesByCountry(country);
        expect(timezones).toBeDefined();
        expect(Array.isArray(timezones)).toBe(true);
      }
    });

    it('should handle repeated loads of same data', async () => {
      // Load same timezone multiple times
      for (let i = 0; i < 5; i++) {
        const info = await getTimezoneInfo('America/New_York');
        expect(info).not.toBeNull();
      }
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle timezone conversion workflow', async () => {
      // User selects source timezone
      const sourceTimezones = await getTimezonesByCountry('US');
      expect(sourceTimezones.length).toBeGreaterThan(0);
      
      // User selects target timezone
      const targetTimezones = await getTimezonesByCountry('JP');
      expect(targetTimezones.length).toBeGreaterThan(0);
      
      // Convert time
      const result = await convertTime(
        '2025-10-18T12:00:00Z',
        sourceTimezones[0].zoneName,
        targetTimezones[0].zoneName
      );
      expect(result).toBeDefined();
    });

    it('should handle timezone search and selection', async () => {
      // Load all timezones for search
      const allTimezones = await getTimezones();
      expect(allTimezones.length).toBeGreaterThan(0);
      
      // Simulate search by filtering
      const searchTerm = 'america';
      const filtered = allTimezones.filter(tz => 
        tz.zoneName.toLowerCase().includes(searchTerm)
      );
      expect(filtered.length).toBeGreaterThan(0);
      
      // Get info for selected timezone
      const info = await getTimezoneInfo(filtered[0].zoneName);
      expect(info).not.toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should gracefully handle invalid country codes', async () => {
      const timezones = await getTimezonesByCountry('INVALID');
      expect(timezones).toEqual([]);
    });

    it('should gracefully handle invalid timezone names', async () => {
      const info = await getTimezoneInfo('Invalid/Timezone');
      expect(info).toBeNull();
    });

    it('should not crash on malformed input', async () => {
      // Various malformed inputs
      const result1 = await getTimezonesByCountry('');
      const result2 = await getTimezonesByCountry('X');
      const result3 = await getTimezoneInfo('');
      
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(result3).toBeNull();
    });
  });
});
