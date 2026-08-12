import { describe, it, expect } from 'vitest';
import { buildUrl } from '../../../src/http/buildUrl';
import { ValidationError } from '../../../src/errors';

const BASE = 'https://api.countrystatecity.in/v1';

describe('buildUrl', () => {
  it('joins and encodes path segments', () => {
    const url = buildUrl(BASE, ['countries', 'IN', 'states', 'MH']);
    expect(url).toBe('https://api.countrystatecity.in/v1/countries/IN/states/MH');
  });

  it('encodes special characters in a segment', () => {
    const url = buildUrl(BASE, ['search', 'a b/../c'.replace(/[/.]/g, '')]);
    expect(url).toContain('a%20bc');
  });

  it('omits undefined query params', () => {
    const url = buildUrl(BASE, ['countries'], { limit: 10, offset: undefined, kind: undefined });
    expect(url).toBe('https://api.countrystatecity.in/v1/countries?limit=10');
  });

  it('serializes numbers and booleans as strings', () => {
    const url = buildUrl(BASE, ['x'], { limit: 5, active: true });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('5');
    expect(parsed.searchParams.get('active')).toBe('true');
  });

  it('handles a baseUrl with a trailing slash', () => {
    const url = buildUrl(`${BASE}/`, ['countries']);
    expect(url).toBe('https://api.countrystatecity.in/v1/countries');
  });

  it.each(['US/../secret', 'a/b', 'a\\b', '..', ''])('rejects the unsafe segment %j', (segment) => {
    expect(() => buildUrl(BASE, [segment])).toThrow(ValidationError);
  });

  it('never includes an injected value as an extra path segment', () => {
    expect(() => buildUrl(BASE, ['countries', '../../admin'])).toThrow(ValidationError);
  });
});
