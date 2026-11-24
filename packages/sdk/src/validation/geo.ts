import { ValidationError } from '../errors';

/** Reject malformed geographic inputs before they reach the transport. */
export function assertGeo(condition: boolean, field: string, value: unknown, expected: string): asserts condition {
  if (!condition) {
    throw new ValidationError(`${field} ${expected}`, { field, value, reason: 'invalid_format' });
  }
}

/** Validate optional parameter objects, including untyped JavaScript callers. */
export function assertGeoParams(value: unknown): void {
  assertGeo(value === undefined || (value !== null && typeof value === 'object' && !Array.isArray(value)),
    'params', value, 'must be an object');
}

/** Validate comma-separated API field and sort selections. */
export function geoSelection(value: string[] | undefined, field: string): string | undefined {
  assertGeo(value === undefined || (Array.isArray(value) && value.length > 0 &&
    value.every((item) => typeof item === 'string' && item.length > 0 && !item.includes(','))),
  field, value, 'must be a non-empty array of field expressions');
  return value?.join(',');
}

/** Validate and trim an optional English-name or postcode search query. */
export function geoQuery(value: string | undefined): string | undefined {
  assertGeo(value === undefined || (typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 100),
    'q', value, 'must contain 2–100 characters');
  return value?.trim();
}

/** County routes accept positive safe integer identifiers, never coercible expressions. */
export function countyId(value: string | number): string {
  assertGeo((typeof value === 'string' && /^[1-9]\d*$/.test(value) || typeof value === 'number') &&
    Number.isSafeInteger(Number(value)) && Number(value) > 0,
  'countyId', value, 'must be a positive safe integer');
  return String(value);
}
