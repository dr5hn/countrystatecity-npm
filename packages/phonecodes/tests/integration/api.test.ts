import { describe, it, expect } from 'vitest';
import { getPhonecodes, getPhonecodeByCountry, getCountriesByDialCode } from '../../src/index.js';

describe('Phonecodes Integration', () => {
  it('should cover all 250 countries', async () => {
    const result = await getPhonecodes();
    expect(result.length).toBe(250);
  });

  it('every entry should have a valid dialCode format', async () => {
    const result = await getPhonecodes();
    for (const entry of result) {
      expect(entry.dialCode).toMatch(/^\+\d+$/);
      expect(entry.phonecode).toMatch(/^\d+$/);
      expect(entry.iso2).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('should find GB with dialCode +44', async () => {
    const gb = await getPhonecodeByCountry('GB');
    expect(gb?.dialCode).toBe('+44');
  });

  it('+1 should include US and CA', async () => {
    const countries = await getCountriesByDialCode('+1');
    const iso2s = countries.map((c) => c.iso2);
    expect(iso2s).toContain('US');
    expect(iso2s).toContain('CA');
  });
});
