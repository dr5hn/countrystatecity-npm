import { describe, it, expect, beforeEach } from 'vitest';
import { getConfig, configure, resetConfiguration } from '../../src/config';

describe('config', () => {
  beforeEach(() => {
    resetConfiguration();
  });

  it('returns default configuration', () => {
    const config = getConfig();
    expect(config.baseURL).toContain('cdn.jsdelivr.net');
    expect(config.baseURL).toContain('@countrystatecity/countries-browser');
    expect(config.timeout).toBe(5000);
    expect(config.headers).toEqual({});
    expect(config.cacheSize).toBe(50);
  });

  it('includes version in default baseURL', () => {
    const config = getConfig();
    expect(config.baseURL).toMatch(/@countrystatecity\/countries-browser@/);
  });

  it('overrides baseURL', () => {
    configure({ baseURL: 'https://my-cdn.com/data' });
    expect(getConfig().baseURL).toBe('https://my-cdn.com/data');
  });

  it('overrides timeout', () => {
    configure({ timeout: 10000 });
    expect(getConfig().timeout).toBe(10000);
    expect(getConfig().baseURL).toContain('cdn.jsdelivr.net');
  });

  it('overrides headers', () => {
    configure({ headers: { 'X-Custom': 'value' } });
    expect(getConfig().headers).toEqual({ 'X-Custom': 'value' });
  });

  it('overrides cacheSize', () => {
    configure({ cacheSize: 100 });
    expect(getConfig().cacheSize).toBe(100);
  });

  it('merges partial overrides with defaults', () => {
    configure({ timeout: 3000 });
    const config = getConfig();
    expect(config.timeout).toBe(3000);
    expect(config.baseURL).toContain('cdn.jsdelivr.net');
    expect(config.cacheSize).toBe(50);
  });

  it('resets to defaults', () => {
    configure({ baseURL: 'https://custom.com', timeout: 999 });
    resetConfiguration();
    const config = getConfig();
    expect(config.baseURL).toContain('cdn.jsdelivr.net');
    expect(config.timeout).toBe(5000);
  });
});
