import { describe, it, expect } from 'vitest';
import {
  getTranslations,
  getCountryTranslations,
  getTranslation,
  getLocales,
  searchByTranslatedName,
} from '../../src';

describe('Translation API Integration', () => {
  describe('Complete workflow: Find country and translate name', () => {
    it('should find country and get translation in multiple locales', async () => {
      // Step 1: Load all translations
      const translations = await getTranslations();
      expect(translations.length).toBeGreaterThan(0);

      // Step 2: Find Germany
      const germany = translations.find(c => c.iso2 === 'DE');
      expect(germany).toBeDefined();
      expect(germany?.name).toBe('Germany');

      // Step 3: Get German name in French
      const frName = await getTranslation('DE', 'fr');
      expect(frName).toBe('Allemagne');

      // Step 4: Get German name in Arabic
      const arName = await getTranslation('DE', 'ar');
      expect(arName).toBeDefined();
      expect(typeof arName).toBe('string');
    });
  });

  describe('Search and information retrieval', () => {
    it('should search translations and get detailed info', async () => {
      // 1. Search for "Frankreich" in German locale
      const results = await searchByTranslatedName('Frankreich', 'de');
      expect(results.length).toBeGreaterThan(0);

      // 2. Get full translation record for first result
      if (results.length > 0) {
        const entry = await getCountryTranslations(results[0].iso2);
        expect(entry).not.toBeUndefined();
        expect(entry?.iso2).toBe(results[0].iso2);
        expect(entry?.translations).toBeDefined();
      }
    });
  });

  describe('Multi-locale comparison', () => {
    it('should get translations for a country across multiple locales', async () => {
      const locales = ['fr', 'de', 'ar', 'ja', 'zh-CN'];
      const countryTranslations = new Map<string, string | undefined>();

      for (const locale of locales) {
        const name = await getTranslation('JP', locale);
        countryTranslations.set(locale, name);
      }

      // Verify all locales returned a value
      expect(countryTranslations.size).toBe(5);
      for (const [locale, name] of countryTranslations.entries()) {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
      }
    });
  });

  describe('Data consistency', () => {
    it('should have consistent translation data structure', async () => {
      const translations = await getTranslations();

      // Check first 10 entries for consistency
      for (let i = 0; i < Math.min(10, translations.length); i++) {
        const entry = translations[i];

        // All required fields should be present
        expect(entry).toHaveProperty('iso2');
        expect(entry).toHaveProperty('name');
        expect(entry).toHaveProperty('translations');

        // iso2 should be 2 characters
        expect(entry.iso2.length).toBe(2);

        // name should be a non-empty string
        expect(typeof entry.name).toBe('string');
        expect(entry.name.length).toBeGreaterThan(0);

        // translations should be an object with string values
        expect(typeof entry.translations).toBe('object');
        expect(Object.keys(entry.translations).length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error handling', () => {
    it('should handle invalid inputs gracefully', async () => {
      // Invalid iso2
      const invalidCountry = await getCountryTranslations('INVALID');
      expect(invalidCountry).toBeUndefined();

      // Invalid locale
      const invalidLocale = await getTranslation('US', 'xx');
      expect(invalidLocale).toBeUndefined();

      // Invalid iso2 + valid locale
      const invalidBoth = await getTranslation('ZZ', 'fr');
      expect(invalidBoth).toBeUndefined();

      // Invalid states return empty arrays
      const noResults = await searchByTranslatedName('xyzxyzxyz');
      expect(noResults).toEqual([]);
    });
  });

  describe('Performance: Lazy loading', () => {
    it('should load translations efficiently', async () => {
      const start = Date.now();
      const translations = await getTranslation('US', 'fr');
      const duration = Date.now() - start;

      expect(translations).toBeDefined();
      expect(duration).toBeLessThan(1000); // generous timeout
    });
  });
});
