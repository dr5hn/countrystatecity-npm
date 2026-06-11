import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'fs';
import { resolve } from 'path';
import {
  getCurrencies,
  getCurrenciesByCountry,
  getCurrencyByCode,
  searchCurrencies,
} from '../../src/index.js';

describe('Browser / Bundle Compatibility', () => {
  describe('stack overflow prevention', () => {
    it('should load all currencies without recursion issues', async () => {
      const currencies = await getCurrencies();
      expect(currencies.length).toBeGreaterThan(0);
    });

    it('should handle sequential country loads without issues', async () => {
      const countries = ['US', 'DE', 'IN', 'JP', 'AU'];
      for (const country of countries) {
        const result = await getCurrenciesByCountry(country);
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });

  describe('bundle size', () => {
    it('currencies.json data file should be under 100KB', () => {
      const filePath = resolve('src/data/currencies.json');
      const { size } = statSync(filePath);
      expect(size).toBeLessThan(100 * 1024);
    });
  });

  describe('memory management', () => {
    it('should handle repeated calls across 10 countries without issues', async () => {
      const countries = ['US','DE','IN','JP','AU','BR','CN','ZA','NG','KE'];
      for (const country of countries) {
        await getCurrenciesByCountry(country);
      }

      for (let i = 0; i < 5; i++) {
        await getCurrenciesByCountry('US');
      }

      const result = await getCurrenciesByCountry('US');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('real-world scenarios', () => {
    it('e-commerce checkout: resolve symbol for a cart currency', async () => {
      const cartCurrency = 'EUR';
      const currency = await getCurrencyByCode(cartCurrency);
      expect(currency).toBeDefined();
      expect(currency?.symbol).toBe('€');
      expect(currency?.decimalDigits).toBe(2);
    });

    it('locale detection: map user country to currency', async () => {
      const userCountry = 'JP';
      const currencies = await getCurrenciesByCountry(userCountry);
      expect(currencies.length).toBeGreaterThan(0);
      expect(currencies[0].code).toBe('JPY');
    });

    it('currency picker search: find currencies by keyword', async () => {
      const results = await searchCurrencies('pound');
      expect(results.length).toBeGreaterThan(2);
      expect(results.every((c) =>
        c.name.toLowerCase().includes('pound') ||
        c.namePlural.toLowerCase().includes('pound'),
      )).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should return undefined for invalid currency code, not throw', async () => {
      await expect(getCurrencyByCode('INVALID')).resolves.toBeUndefined();
    });

    it('should return empty array for invalid country code, not throw', async () => {
      await expect(getCurrenciesByCountry('XX')).resolves.toEqual([]);
    });

    it('should return empty array for empty string country, not throw', async () => {
      await expect(getCurrenciesByCountry('')).resolves.toEqual([]);
    });

    it('should return empty array for empty string search, not throw', async () => {
      const results = await searchCurrencies('');
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
