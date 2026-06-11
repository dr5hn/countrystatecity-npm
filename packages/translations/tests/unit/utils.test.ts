import { describe, it, expect } from 'vitest';
import { getTranslationOrFallback } from '../../src/utils';
import type { ICountryTranslation } from '../../src/types';

const mockEntry: ICountryTranslation = {
  iso2: 'DE',
  name: 'Germany',
  translations: {
    fr: 'Allemagne',
    de: 'Deutschland',
    ar: 'ألمانيا',
    es: 'Alemania',
  },
};

describe('Translation Utilities', () => {
  describe('getTranslationOrFallback', () => {
    it('should return translation for valid locale', () => {
      const result = getTranslationOrFallback(mockEntry, 'fr');
      expect(result).toBe('Allemagne');
    });

    it('should return translation for another valid locale', () => {
      const result = getTranslationOrFallback(mockEntry, 'de');
      expect(result).toBe('Deutschland');
    });

    it('should fall back to second locale when primary not found', () => {
      const result = getTranslationOrFallback(mockEntry, 'xx', 'fr');
      expect(result).toBe('Allemagne');
    });

    it('should fall back to English name when locale not found', () => {
      const result = getTranslationOrFallback(mockEntry, 'xx');
      expect(result).toBe('Germany');
    });

    it('should fall back to English name when both locales not found', () => {
      const result = getTranslationOrFallback(mockEntry, 'xx', 'yy');
      expect(result).toBe('Germany');
    });

    it('should prefer primary locale over fallback when both exist', () => {
      const result = getTranslationOrFallback(mockEntry, 'fr', 'de');
      expect(result).toBe('Allemagne');
    });

    it('should return a string in all cases', () => {
      expect(typeof getTranslationOrFallback(mockEntry, 'fr')).toBe('string');
      expect(typeof getTranslationOrFallback(mockEntry, 'xx', 'fr')).toBe('string');
      expect(typeof getTranslationOrFallback(mockEntry, 'xx')).toBe('string');
    });
  });
});
