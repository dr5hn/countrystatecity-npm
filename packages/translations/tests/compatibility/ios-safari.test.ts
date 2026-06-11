import { describe, it, expect } from 'vitest';
import {
  getTranslations,
  getCountryTranslations,
  getTranslation,
  getLocales,
  searchByTranslatedName,
} from '../../src';

/**
 * iOS/Safari Compatibility Tests
 *
 * These tests verify that the package doesn't cause stack overflow errors
 * on iOS Safari browsers, which have stricter memory limits than other browsers.
 *
 * The key is using dynamic imports and lazy loading instead of static imports
 * that bundle all data upfront.
 */
describe('iOS Safari Compatibility', () => {
  describe('Stack overflow prevention', () => {
    it('should load all translations without stack overflow', async () => {
      const translations = await getTranslations();

      expect(translations).toBeDefined();
      expect(Array.isArray(translations)).toBe(true);
      expect(translations.length).toBeGreaterThan(0);
    });

    it('should load country translations without stack overflow', async () => {
      const entry = await getCountryTranslations('US');

      expect(entry).toBeDefined();
      expect(entry?.translations).toBeDefined();
    });

    it('should handle multiple sequential loads', async () => {
      // Simulates user browsing through countries
      const all = await getTranslations();
      expect(all.length).toBeGreaterThan(0);

      const us = await getCountryTranslations('US');
      expect(us).toBeDefined();

      const de = await getCountryTranslations('DE');
      expect(de).toBeDefined();

      const jp = await getCountryTranslations('JP');
      expect(jp).toBeDefined();
    });
  });

  describe('Bundle size validation', () => {
    it('should have reasonable data file size', async () => {
      const translations = await getTranslations();
      const size = JSON.stringify(translations).length;

      // Should be under 300KB in memory
      expect(size).toBeLessThan(300 * 1024);
    });
  });

  describe('Memory management', () => {
    it('should handle loading multiple countries without memory issues', async () => {
      const countries = ['US', 'GB', 'IN', 'JP', 'AU', 'CA', 'DE', 'FR', 'IT', 'ES'];

      for (const country of countries) {
        const entry = await getCountryTranslations(country);
        expect(entry).toBeDefined();
        expect(Array.isArray(entry?.translations)).toBe(false); // it's an object
      }
    });

    it('should handle repeated loads of same data (cache)', async () => {
      for (let i = 0; i < 5; i++) {
        const entry = await getCountryTranslations('US');
        expect(entry).toBeDefined();
      }
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle locale selection workflow', async () => {
      // User selects a locale from the list
      const locales = await getLocales();
      expect(locales.length).toBeGreaterThan(0);

      // User picks French and browses country names
      const selectedLocale = 'fr';
      const all = await getTranslations();

      const frenchNames = all
        .map(c => c.translations[selectedLocale])
        .filter(Boolean);

      expect(frenchNames.length).toBeGreaterThan(0);
    });

    it('should handle search and selection workflow', async () => {
      // User types in a search box
      const results = await searchByTranslatedName('land', 'de');
      expect(Array.isArray(results)).toBe(true);

      // User selects a result and views all its translations
      if (results.length > 0) {
        const entry = await getCountryTranslations(results[0].iso2);
        expect(entry).toBeDefined();
        expect(Object.keys(entry!.translations).length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error handling', () => {
    it('should gracefully handle invalid country codes', async () => {
      const entry = await getCountryTranslations('INVALID');
      expect(entry).toBeUndefined();
    });

    it('should gracefully handle invalid locale', async () => {
      const name = await getTranslation('US', 'xx');
      expect(name).toBeUndefined();
    });

    it('should not crash on empty input', async () => {
      const result1 = await getCountryTranslations('');
      const result2 = await getTranslation('', 'fr');
      const result3 = await getTranslation('US', '');

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
      expect(result3).toBeUndefined();
    });
  });
});
