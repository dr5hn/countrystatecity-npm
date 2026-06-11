import { describe, it, expect } from 'vitest';
import {
  getCurrencies,
  getCurrencyByCode,
  getCurrenciesByCountry,
  getCurrencySymbol,
  getCurrencySymbolNative,
  isValidCurrencyCode,
  searchCurrencies,
} from '../../src/index.js';

describe('Currency Loaders', () => {
  describe('getCurrencies', () => {
    it('should return array of currencies', async () => {
      const currencies = await getCurrencies();
      expect(Array.isArray(currencies)).toBe(true);
      expect(currencies.length).toBeGreaterThan(0);
    });

    it('should have required currency properties', async () => {
      const currencies = await getCurrencies();
      const currency = currencies[0];

      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('name');
      expect(currency).toHaveProperty('namePlural');
      expect(currency).toHaveProperty('symbol');
      expect(currency).toHaveProperty('symbolNative');
      expect(currency).toHaveProperty('decimalDigits');
      expect(currency).toHaveProperty('rounding');
      expect(currency).toHaveProperty('countries');
    });

    it('should have valid currency format', async () => {
      const currencies = await getCurrencies();
      const currency = currencies[0];

      expect(typeof currency.code).toBe('string');
      expect(typeof currency.name).toBe('string');
      expect(typeof currency.symbol).toBe('string');
      expect(typeof currency.decimalDigits).toBe('number');
      expect(currency.code.length).toBe(3);
    });

    it('should have valid country codes on every entry', async () => {
      const currencies = await getCurrencies();
      for (const c of currencies) {
        expect(Array.isArray(c.countries)).toBe(true);
        for (const code of c.countries) {
          expect(typeof code).toBe('string');
          expect(code.length).toBe(2);
        }
      }
    });
  });

  describe('getCurrencyByCode', () => {
    it('should return USD', async () => {
      const usd = await getCurrencyByCode('USD');
      expect(usd).toBeDefined();
      expect(usd?.code).toBe('USD');
      expect(usd?.name).toBe('United States dollar');
      expect(usd?.symbol).toBe('$');
    });

    it('should return EUR', async () => {
      const eur = await getCurrencyByCode('EUR');
      expect(eur).toBeDefined();
      expect(eur?.code).toBe('EUR');
      expect(eur?.decimalDigits).toBe(2);
    });

    it('should be case insensitive', async () => {
      const lower = await getCurrencyByCode('usd');
      const upper = await getCurrencyByCode('USD');
      expect(lower?.code).toBe(upper?.code);
    });

    it('should return undefined for unknown code', async () => {
      const none = await getCurrencyByCode('XYZ');
      expect(none).toBeUndefined();
    });
  });

  describe('getCurrenciesByCountry', () => {
    it('should return USD for US', async () => {
      const result = await getCurrenciesByCountry('US');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((c) => c.countries.includes('US'))).toBe(true);
    });

    it('should return EUR for DE', async () => {
      const result = await getCurrenciesByCountry('DE');
      const codes = result.map((c) => c.code);
      expect(codes).toContain('EUR');
    });

    it('should return USD for FM (Micronesia)', async () => {
      const result = await getCurrenciesByCountry('FM');
      const codes = result.map((c) => c.code);
      expect(codes).toContain('USD');
    });

    it('should return USD for SV (El Salvador)', async () => {
      const result = await getCurrenciesByCountry('SV');
      const codes = result.map((c) => c.code);
      expect(codes).toContain('USD');
    });

    it('should be case insensitive', async () => {
      const lower = await getCurrenciesByCountry('in');
      const upper = await getCurrenciesByCountry('IN');
      expect(lower.map((c) => c.code)).toEqual(upper.map((c) => c.code));
    });

    it('should return empty array for unknown country', async () => {
      const result = await getCurrenciesByCountry('XX');
      expect(result).toEqual([]);
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return $ for USD', async () => {
      expect(await getCurrencySymbol('USD')).toBe('$');
    });

    it('should return € for EUR', async () => {
      expect(await getCurrencySymbol('EUR')).toBe('€');
    });

    it('should return undefined for unknown code', async () => {
      expect(await getCurrencySymbol('XYZ')).toBeUndefined();
    });
  });

  describe('getCurrencySymbolNative', () => {
    it('should return ₹ for INR', async () => {
      expect(await getCurrencySymbolNative('INR')).toBe('₹');
    });

    it('should return ¥ for JPY', async () => {
      expect(await getCurrencySymbolNative('JPY')).toBe('￥');
    });

    it('should return undefined for unknown code', async () => {
      expect(await getCurrencySymbolNative('XYZ')).toBeUndefined();
    });
  });

  describe('isValidCurrencyCode', () => {
    it('should return true for valid codes', async () => {
      expect(await isValidCurrencyCode('USD')).toBe(true);
      expect(await isValidCurrencyCode('EUR')).toBe(true);
      expect(await isValidCurrencyCode('INR')).toBe(true);
    });

    it('should return false for invalid code', async () => {
      expect(await isValidCurrencyCode('INVALID')).toBe(false);
      expect(await isValidCurrencyCode('XYZ')).toBe(false);
    });
  });

  describe('searchCurrencies', () => {
    it('should find currencies by name', async () => {
      const results = await searchCurrencies('dollar');
      expect(results.length).toBeGreaterThan(5);
      expect(
        results.every(
          (c) =>
            c.name.toLowerCase().includes('dollar') ||
            c.namePlural.toLowerCase().includes('dollar') ||
            c.code.toLowerCase().includes('dollar'),
        ),
      ).toBe(true);
    });

    it('should find by code prefix', async () => {
      const results = await searchCurrencies('EUR');
      expect(results.some((c) => c.code === 'EUR')).toBe(true);
    });

    it('should be case insensitive', async () => {
      const lower = await searchCurrencies('euro');
      const upper = await searchCurrencies('EURO');
      expect(lower.map((c) => c.code)).toEqual(upper.map((c) => c.code));
    });

    it('should return empty for no match', async () => {
      const results = await searchCurrencies('zzznomatch');
      expect(results).toHaveLength(0);
    });
  });
});
