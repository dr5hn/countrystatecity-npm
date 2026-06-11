import { describe, it, expect } from 'vitest';
import {
  getTranslations,
  getCountryTranslations,
  getTranslation,
  getLocales,
  searchByTranslatedName,
} from '../../src/loaders';

describe('Translation Loaders', () => {
  describe('getTranslations', () => {
    it('should return array of translation records', async () => {
      const translations = await getTranslations();
      expect(Array.isArray(translations)).toBe(true);
      expect(translations.length).toBeGreaterThan(0);
    });

    it('should have required properties', async () => {
      const translations = await getTranslations();
      const entry = translations[0];

      expect(entry).toHaveProperty('iso2');
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('translations');
    });

    it('should have valid data types', async () => {
      const translations = await getTranslations();
      const entry = translations[0];

      expect(typeof entry.iso2).toBe('string');
      expect(typeof entry.name).toBe('string');
      expect(typeof entry.translations).toBe('object');
      expect(entry.iso2.length).toBe(2);
    });

    it('should be sorted by iso2', async () => {
      const translations = await getTranslations();
      for (let i = 1; i < translations.length; i++) {
        expect(translations[i].iso2.localeCompare(translations[i - 1].iso2)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getCountryTranslations', () => {
    it('should return translation record for valid iso2', async () => {
      const entry = await getCountryTranslations('US');

      expect(entry).not.toBeUndefined();
      expect(entry?.name).toBe('United States');
      expect(entry?.translations).toBeDefined();
      expect(Object.keys(entry!.translations).length).toBeGreaterThan(0);
    });

    it('should be case insensitive', async () => {
      const lower = await getCountryTranslations('us');
      const upper = await getCountryTranslations('US');
      expect(lower).toEqual(upper);
    });

    it('should return undefined for invalid country code', async () => {
      const entry = await getCountryTranslations('INVALID');
      expect(entry).toBeUndefined();
    });
  });

  describe('getTranslation', () => {
    it('should return translated name for valid iso2 and locale', async () => {
      const name = await getTranslation('DE', 'fr');
      expect(name).toBe('Allemagne');
    });

    it('should return translated name for pt-BR locale', async () => {
      const name = await getTranslation('US', 'pt-BR');
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
    });

    it('should be case insensitive for iso2', async () => {
      const lower = await getTranslation('de', 'fr');
      const upper = await getTranslation('DE', 'fr');
      expect(lower).toBe(upper);
    });

    it('should return undefined for invalid iso2', async () => {
      const name = await getTranslation('ZZ', 'fr');
      expect(name).toBeUndefined();
    });

    it('should return undefined for invalid locale', async () => {
      const name = await getTranslation('US', 'xx');
      expect(name).toBeUndefined();
    });
  });

  describe('getLocales', () => {
    it('should return array of locale codes', async () => {
      const locales = await getLocales();
      expect(Array.isArray(locales)).toBe(true);
      expect(locales.length).toBe(19);
    });

    it('should include common locales', async () => {
      const locales = await getLocales();
      const hasCommon = ['fr', 'de', 'ar', 'es', 'zh-CN'].every(l =>
        locales.includes(l)
      );
      expect(hasCommon).toBe(true);
    });

    it('should be sorted', async () => {
      const locales = await getLocales();
      expect(locales).toEqual([...locales].sort());
    });
  });

  describe('searchByTranslatedName', () => {
    it('should find country by translated name in a locale', async () => {
      const results = await searchByTranslatedName('Allemagne', 'fr');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.iso2 === 'DE')).toBe(true);
    });

    it('should search across all locales when no locale given', async () => {
      const results = await searchByTranslatedName('Frankreich');
      expect(results.some(r => r.iso2 === 'FR')).toBe(true);
    });

    it('should be case insensitive', async () => {
      const upper = await searchByTranslatedName('ALLEMAGNE', 'fr');
      const lower = await searchByTranslatedName('allemagne', 'fr');
      expect(upper.length).toBe(lower.length);
    });

    it('should return empty array for no match', async () => {
      const results = await searchByTranslatedName('xyzxyzxyz');
      expect(Array.isArray(results)).toBe(true);
      expect(results).toEqual([]);
    });
  });
});
