import { describe, it, expect } from 'vitest';
import {
  getCurrencies,
  getCurrencyByCode,
  getCurrenciesByCountry,
  getCurrencySymbol,
  searchCurrencies,
} from '../../src/index.js';

describe('Currency API Integration', () => {
  it('complete workflow: country → currency → symbol', async () => {
    const currencies = await getCurrenciesByCountry('US');
    expect(currencies.length).toBeGreaterThan(0);

    const usd = currencies.find((c) => c.code === 'USD');
    expect(usd).toBeDefined();

    const symbol = await getCurrencySymbol(usd!.code);
    expect(symbol).toBe('$');

    const valid = await getCurrencyByCode(usd!.code);
    expect(valid?.code).toBe('USD');
  });

  it('search and retrieve workflow', async () => {
    const results = await searchCurrencies('euro');
    expect(results.length).toBeGreaterThan(0);

    const eur = results.find((c) => c.code === 'EUR');
    expect(eur).toBeDefined();

    const detail = await getCurrencyByCode(eur!.code);
    expect(detail?.symbol).toBe('€');
    expect(detail?.countries.length).toBeGreaterThan(0);
  });

  it('multi-country comparison', async () => {
    const countries = ['US', 'DE', 'IN', 'JP', 'AU'];

    for (const country of countries) {
      const currencies = await getCurrenciesByCountry(country);
      expect(Array.isArray(currencies)).toBe(true);
      expect(currencies.length).toBeGreaterThan(0);
      expect(currencies.every((c) => c.countries.includes(country))).toBe(true);
    }
  });

  it('data structure validation across all currencies', async () => {
    const currencies = await getCurrencies();
    expect(currencies.length).toBeGreaterThan(100);

    for (const c of currencies) {
      expect(typeof c.code).toBe('string');
      expect(c.code.length).toBe(3);

      expect(typeof c.name).toBe('string');
      expect(c.name.length).toBeGreaterThan(0);

      expect(typeof c.symbol).toBe('string');
      expect(typeof c.symbolNative).toBe('string');

      expect(typeof c.decimalDigits).toBe('number');
      expect(c.decimalDigits).toBeGreaterThanOrEqual(0);

      expect(typeof c.rounding).toBe('number');

      expect(Array.isArray(c.countries)).toBe(true);
      for (const code of c.countries) {
        expect(code.length).toBe(2);
      }
    }
  });

  it('country coverage: every dr5hn country with a real currency is covered', async () => {
    const currencies = await getCurrencies();
    const coveredCodes = new Set(currencies.flatMap((c) => c.countries));

    const expectedCountries = [
      'US','DE','IN','JP','AU','GB','FR','BR','CA','CN',
      'MX','NG','ZA','KE','EG','SA','AE','SG','HK','KR',
      'FM','SV',
    ];

    for (const country of expectedCountries) {
      expect(coveredCodes.has(country), `${country} should have a currency`).toBe(true);
    }
  });

  it('performance: getCurrencies completes within 500ms', async () => {
    const start = performance.now();
    await getCurrencies();
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it('performance: getCurrenciesByCountry completes within 200ms', async () => {
    const start = performance.now();
    await getCurrenciesByCountry('US');
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });
});
