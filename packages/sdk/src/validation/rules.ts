/**
 * Pure input-validation predicates for @countrystatecity/sdk.
 *
 * Only formats known to be stable (ISO codes, numeric ranges, date strings) are
 * validated here. Params whose valid value-set isn't confirmed against the
 * live API (e.g. city `kind`) are deliberately left unvalidated — see
 * validation/assertions.ts.
 */

const ISO2_RE = /^[A-Za-z]{2}$/;
const ISO3_RE = /^[A-Za-z]{3}$/;
const STATE_CODE_RE = /^[A-Za-z0-9]{1,8}$/;
const CURRENCY_CODE_RE = /^[A-Za-z]{3}$/;
const DIAL_CODE_RE = /^\+?[1-9]\d{0,3}$/;
const NUMERIC_CODE_RE = /^\d{1,3}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

export function isValidIso2(value: string): boolean {
  return ISO2_RE.test(value);
}

export function isValidIso3(value: string): boolean {
  return ISO3_RE.test(value);
}

export function isValidStateCode(value: string): boolean {
  return STATE_CODE_RE.test(value);
}

export function isValidCurrencyCode(value: string): boolean {
  return CURRENCY_CODE_RE.test(value);
}

export function isValidDialCode(value: string): boolean {
  return DIAL_CODE_RE.test(value);
}

export function isValidNumericCode(value: string): boolean {
  return NUMERIC_CODE_RE.test(value);
}

/**
 * `Intl.supportedValuesOf('timeZone')` only lists each zone's *canonical* IANA
 * id, not its aliases — depending on the runtime's bundled tzdata version,
 * common names like "Asia/Kolkata" resolve to a link (e.g. "Asia/Calcutta")
 * and would be wrongly rejected. Constructing `Intl.DateTimeFormat` resolves
 * aliases the same way real usage does, and throws RangeError for anything
 * actually invalid — the more accurate check, and available since ES5.1.
 */
export function isValidTimezoneName(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isValidLimit(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 100;
}

export function isValidOffset(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function isValidIsoDateString(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  return !Number.isNaN(new Date(value).getTime());
}

export function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}
