import { describe, it, expect } from 'vitest';
import { ValidationError } from '../../../src/errors';
import {
  assertIso2,
  assertIso3,
  assertNumericCode,
  assertStateCode,
  assertCurrencyCode,
  assertDialCode,
  assertTimezoneName,
  assertLatitude,
  assertLongitude,
  assertIsoDateString,
  assertNonEmptyString,
  assertListParams,
  assertRequiredWith,
} from '../../../src/validation/assertions';

describe('assertIso2', () => {
  it('normalizes to uppercase', () => {
    expect(assertIso2('in')).toBe('IN');
  });
  it('throws ValidationError with field/value/reason on bad input', () => {
    try {
      assertIso2('IND', 'country');
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const ve = err as ValidationError;
      expect(ve.field).toBe('country');
      expect(ve.value).toBe('IND');
      expect(ve.reason).toBe('invalid_iso2_format');
    }
  });
});

describe('assertIso3', () => {
  it('normalizes to uppercase', () => expect(assertIso3('ind')).toBe('IND'));
  it('rejects a 2-letter code', () => expect(() => assertIso3('IN')).toThrow(ValidationError));
});

describe('assertNumericCode', () => {
  it('accepts a valid numeric code', () => expect(assertNumericCode('356')).toBe('356'));
  it('rejects non-numeric', () => expect(() => assertNumericCode('abc')).toThrow(ValidationError));
});

describe('assertStateCode', () => {
  it('normalizes to uppercase', () => expect(assertStateCode('mh')).toBe('MH'));
  it('rejects an overlong code', () => expect(() => assertStateCode('123456789')).toThrow(ValidationError));
});

describe('assertCurrencyCode', () => {
  it('normalizes to uppercase', () => expect(assertCurrencyCode('usd')).toBe('USD'));
  it('rejects a 2-letter code', () => expect(() => assertCurrencyCode('US')).toThrow(ValidationError));
});

describe('assertDialCode', () => {
  it('accepts a leading-plus code', () => expect(assertDialCode('+91')).toBe('+91'));
  it('rejects a code starting with 0', () => expect(() => assertDialCode('+0123')).toThrow(ValidationError));
});

describe('assertTimezoneName', () => {
  it('accepts a real IANA zone', () => expect(assertTimezoneName('Asia/Kolkata', 'from')).toBe('Asia/Kolkata'));
  it('rejects garbage with the given field name', () => {
    try {
      assertTimezoneName('Nope/Nope/Nope', 'from');
      expect.unreachable();
    } catch (err) {
      expect((err as ValidationError).field).toBe('from');
    }
  });
});

describe('assertLatitude / assertLongitude', () => {
  it('accepts boundary values', () => {
    expect(assertLatitude(90)).toBe(90);
    expect(assertLongitude(-180)).toBe(-180);
  });
  it('rejects out-of-range values', () => {
    expect(() => assertLatitude(90.1)).toThrow(ValidationError);
    expect(() => assertLongitude(-180.1)).toThrow(ValidationError);
  });
});

describe('assertIsoDateString', () => {
  it('accepts a valid ISO string', () => expect(assertIsoDateString('2026-08-12', 'since')).toBe('2026-08-12'));
  it('rejects garbage', () => expect(() => assertIsoDateString('not-a-date', 'since')).toThrow(ValidationError));
});

describe('assertNonEmptyString', () => {
  it('accepts a non-empty string', () => expect(assertNonEmptyString('hello', 'query')).toBe('hello'));
  it('rejects whitespace-only', () => expect(() => assertNonEmptyString('   ', 'query')).toThrow(ValidationError));
});

describe('assertListParams', () => {
  it('accepts undefined params', () => expect(() => assertListParams(undefined)).not.toThrow());
  it('accepts valid limit/offset', () => expect(() => assertListParams({ limit: 50, offset: 0 })).not.toThrow());
  it('rejects an out-of-range limit', () => expect(() => assertListParams({ limit: 500 })).toThrow(ValidationError));
  it('rejects a negative offset', () => expect(() => assertListParams({ offset: -1 })).toThrow(ValidationError));
});

describe('assertRequiredWith', () => {
  it('passes when the dependent value is unset', () => {
    expect(() => assertRequiredWith(undefined, 'state', undefined, 'country')).not.toThrow();
  });
  it('passes when both are set', () => {
    expect(() => assertRequiredWith('MH', 'state', 'IN', 'country')).not.toThrow();
  });
  it('throws when the dependent value is set but the required one is not', () => {
    try {
      assertRequiredWith('MH', 'state', undefined, 'country');
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).field).toBe('country');
      expect((err as ValidationError).reason).toBe('required_with_state');
    }
  });
});
