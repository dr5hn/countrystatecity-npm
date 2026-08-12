import { describe, it, expect } from 'vitest';
import {
  isValidIso2,
  isValidIso3,
  isValidStateCode,
  isValidCurrencyCode,
  isValidDialCode,
  isValidNumericCode,
  isValidTimezoneName,
  isValidLatitude,
  isValidLongitude,
  isValidLimit,
  isValidOffset,
  isValidIsoDateString,
  isNonEmptyString,
} from '../../../src/validation/rules';

describe('isValidIso2', () => {
  it.each(['IN', 'us', 'Gb'])('accepts %s', (v) => expect(isValidIso2(v)).toBe(true));
  it.each(['IND', 'I', '', '12', 'I1'])('rejects %s', (v) => expect(isValidIso2(v)).toBe(false));
});

describe('isValidIso3', () => {
  it.each(['IND', 'usa'])('accepts %s', (v) => expect(isValidIso3(v)).toBe(true));
  it.each(['IN', 'INDI', ''])('rejects %s', (v) => expect(isValidIso3(v)).toBe(false));
});

describe('isValidStateCode', () => {
  it.each(['MH', 'CA', 'B', '12345678'])('accepts %s', (v) => expect(isValidStateCode(v)).toBe(true));
  it.each(['', '123456789', 'MH-1'])('rejects %s', (v) => expect(isValidStateCode(v)).toBe(false));
});

describe('isValidCurrencyCode', () => {
  it.each(['USD', 'inr'])('accepts %s', (v) => expect(isValidCurrencyCode(v)).toBe(true));
  it.each(['US', 'USDX', ''])('rejects %s', (v) => expect(isValidCurrencyCode(v)).toBe(false));
});

describe('isValidDialCode', () => {
  it.each(['+91', '1', '999'])('accepts %s', (v) => expect(isValidDialCode(v)).toBe(true));
  it.each(['0', '+0123', 'abc', ''])('rejects %s', (v) => expect(isValidDialCode(v)).toBe(false));
});

describe('isValidNumericCode', () => {
  it.each(['1', '356', '004'])('accepts %s', (v) => expect(isValidNumericCode(v)).toBe(true));
  it.each(['', '1234', 'ab'])('rejects %s', (v) => expect(isValidNumericCode(v)).toBe(false));
});

describe('isValidTimezoneName', () => {
  it('accepts a well-known IANA zone', () => {
    expect(isValidTimezoneName('Asia/Kolkata')).toBe(true);
  });
  it('accepts UTC', () => {
    expect(isValidTimezoneName('UTC')).toBe(true);
  });
  it('rejects garbage', () => {
    expect(isValidTimezoneName('Not/A/Real/Zone/Nope')).toBe(false);
  });
});

describe('isValidLatitude / isValidLongitude — boundary inclusive', () => {
  it.each([-90, 0, 90])('latitude %f is valid', (v) => expect(isValidLatitude(v)).toBe(true));
  it.each([-90.0001, 90.0001, NaN, Infinity])('latitude %f is invalid', (v) => expect(isValidLatitude(v)).toBe(false));

  it.each([-180, 0, 180])('longitude %f is valid', (v) => expect(isValidLongitude(v)).toBe(true));
  it.each([-180.0001, 180.0001, NaN])('longitude %f is invalid', (v) => expect(isValidLongitude(v)).toBe(false));
});

describe('isValidLimit / isValidOffset', () => {
  it.each([1, 50, 100])('limit %i is valid', (v) => expect(isValidLimit(v)).toBe(true));
  it.each([0, 101, 1.5, -1])('limit %f is invalid', (v) => expect(isValidLimit(v)).toBe(false));

  it.each([0, 1, 1000])('offset %i is valid', (v) => expect(isValidOffset(v)).toBe(true));
  it.each([-1, 1.5])('offset %f is invalid', (v) => expect(isValidOffset(v)).toBe(false));
});

describe('isValidIsoDateString', () => {
  it.each(['2026-08-12', '2026-08-12T10:00:00Z', '2026-08-12T10:00:00.123+05:30'])(
    'accepts %s',
    (v) => expect(isValidIsoDateString(v)).toBe(true),
  );
  it.each(['not-a-date', '12/08/2026', ''])('rejects %s', (v) => expect(isValidIsoDateString(v)).toBe(false));
});

describe('isNonEmptyString', () => {
  it.each(['a', '  a  '])('accepts %s', (v) => expect(isNonEmptyString(v)).toBe(true));
  it.each(['', '   '])('rejects %s', (v) => expect(isNonEmptyString(v)).toBe(false));
});
