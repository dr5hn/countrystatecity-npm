/**
 * Throwing validation wrappers. Called before any network request is made;
 * on failure they throw a ValidationError populated with `field`/`value`/`reason`.
 */

import { ValidationError } from '../errors';
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
} from './rules';
import type { IListParams } from '../types/params';

function fail(message: string, field: string, value: unknown, reason: string): never {
  throw new ValidationError(message, { field, value, reason });
}

export function assertIso2(value: string, field = 'country'): string {
  if (typeof value !== 'string' || !isValidIso2(value)) {
    fail(
      `${field} must be a 2-letter ISO 3166-1 alpha-2 country code, got ${JSON.stringify(value)}`,
      field,
      value,
      'invalid_iso2_format',
    );
  }
  return value.toUpperCase();
}

export function assertIso3(value: string, field = 'iso3'): string {
  if (typeof value !== 'string' || !isValidIso3(value)) {
    fail(
      `${field} must be a 3-letter ISO 3166-1 alpha-3 country code, got ${JSON.stringify(value)}`,
      field,
      value,
      'invalid_iso3_format',
    );
  }
  return value.toUpperCase();
}

export function assertNumericCode(value: string, field = 'numeric'): string {
  if (typeof value !== 'string' || !isValidNumericCode(value)) {
    fail(
      `${field} must be a 1-3 digit ISO 3166-1 numeric country code, got ${JSON.stringify(value)}`,
      field,
      value,
      'invalid_numeric_format',
    );
  }
  return value;
}

export function assertStateCode(value: string, field = 'state'): string {
  if (typeof value !== 'string' || !isValidStateCode(value)) {
    fail(
      `${field} must be an alphanumeric state/subdivision code, got ${JSON.stringify(value)}`,
      field,
      value,
      'invalid_state_code_format',
    );
  }
  return value.toUpperCase();
}

export function assertCurrencyCode(value: string, field = 'code'): string {
  if (typeof value !== 'string' || !isValidCurrencyCode(value)) {
    fail(
      `${field} must be a 3-letter ISO 4217 currency code, got ${JSON.stringify(value)}`,
      field,
      value,
      'invalid_currency_code_format',
    );
  }
  return value.toUpperCase();
}

export function assertDialCode(value: string, field = 'dialCode'): string {
  if (typeof value !== 'string' || !isValidDialCode(value)) {
    fail(
      `${field} must be a valid phone dial code (e.g. "+91"), got ${JSON.stringify(value)}`,
      field,
      value,
      'invalid_dial_code_format',
    );
  }
  return value;
}

export function assertTimezoneName(value: string, field: string): string {
  if (typeof value !== 'string' || !isValidTimezoneName(value)) {
    fail(
      `${field} must be a valid IANA timezone name, got ${JSON.stringify(value)}`,
      field,
      value,
      'invalid_timezone_name',
    );
  }
  return value;
}

export function assertLatitude(value: number, field = 'latitude'): number {
  if (typeof value !== 'number' || !isValidLatitude(value)) {
    fail(`${field} must be a number between -90 and 90, got ${JSON.stringify(value)}`, field, value, 'out_of_range');
  }
  return value;
}

export function assertLongitude(value: number, field = 'longitude'): number {
  if (typeof value !== 'number' || !isValidLongitude(value)) {
    fail(`${field} must be a number between -180 and 180, got ${JSON.stringify(value)}`, field, value, 'out_of_range');
  }
  return value;
}

export function assertIsoDateString(value: string, field: string): string {
  if (typeof value !== 'string' || !isValidIsoDateString(value)) {
    fail(`${field} must be an ISO 8601 date/time string, got ${JSON.stringify(value)}`, field, value, 'invalid_date_format');
  }
  return value;
}

export function assertNonEmptyString(value: string, field: string): string {
  if (typeof value !== 'string' || !isNonEmptyString(value)) {
    fail(`${field} must be a non-empty string`, field, value, 'empty_string');
  }
  return value;
}

/** Validates the shared `limit`/`offset` pagination params, if present. */
export function assertListParams(params: IListParams | undefined): void {
  if (!params) return;
  if (params.limit !== undefined && !isValidLimit(params.limit)) {
    fail(`limit must be an integer between 1 and 100, got ${JSON.stringify(params.limit)}`, 'limit', params.limit, 'out_of_range');
  }
  if (params.offset !== undefined && !isValidOffset(params.offset)) {
    fail(`offset must be a non-negative integer, got ${JSON.stringify(params.offset)}`, 'offset', params.offset, 'out_of_range');
  }
}

/**
 * Fuzzy search's server-side limits are tighter than the generic list
 * limit (1-50, not 1-100) and it has its own threshold param — validated
 * separately from `assertListParams` rather than widening the shared check.
 */
export function assertSearchParams(params: { limit?: number; threshold?: number }): void {
  if (params.limit !== undefined && !(Number.isInteger(params.limit) && params.limit >= 1 && params.limit <= 50)) {
    fail(`limit must be an integer between 1 and 50, got ${JSON.stringify(params.limit)}`, 'limit', params.limit, 'out_of_range');
  }
  if (params.threshold !== undefined && !(typeof params.threshold === 'number' && params.threshold >= 0.1 && params.threshold <= 1)) {
    fail(`threshold must be a number between 0.1 and 1, got ${JSON.stringify(params.threshold)}`, 'threshold', params.threshold, 'out_of_range');
  }
}

/**
 * Autocomplete shares fuzzy search's 1-50 limit range, plus its own
 * `country` invalid-when-type-is-country check (mirrors the real API's
 * zod `.refine()`). The `state`-requires-`country` rule is asserted
 * separately at the call site via the existing `assertRequiredWith`,
 * matching `cities.list()`'s own pattern for the same kind of rule.
 * `state` has no character-class restriction server-side (unlike
 * `assertStateCode`'s 8-char alphanumeric rule for path-segment state
 * codes) — only a 1-20 length bound — so it's checked here, not via
 * `assertStateCode`.
 */
export function assertAutocompleteParams(params: { type?: string; country?: string; state?: string; limit?: number }): void {
  if (params.limit !== undefined && !(Number.isInteger(params.limit) && params.limit >= 1 && params.limit <= 50)) {
    fail(`limit must be an integer between 1 and 50, got ${JSON.stringify(params.limit)}`, 'limit', params.limit, 'out_of_range');
  }
  if (params.type === 'country' && params.country !== undefined) {
    fail('country is not a valid filter when type is "country"', 'country', params.country, 'invalid_with_type_country');
  }
  if (params.state !== undefined && (params.state.length < 1 || params.state.length > 20)) {
    fail(`state must be 1-20 characters, got ${JSON.stringify(params.state)}`, 'state', params.state, 'out_of_range');
  }
}

/**
 * Nearby search shares autocomplete's `country`-invalid-when-`type`-is-
 * `country` and `state` 1-20-char checks, but has its own `radius` (1-500 km)
 * and `limit` (1-100, not the 1-50 shared by fuzzy/autocomplete) ranges, plus
 * a `minPopulation` non-negative-integer check with no upper bound. `lat`/
 * `lng` are asserted separately at the call site via the existing
 * `assertLatitude`/`assertLongitude`, and `state`-requires-`country` via
 * `assertRequiredWith`, matching `autocomplete()`'s own structure.
 */
export function assertNearbyParams(params: {
  type?: string;
  country?: string;
  state?: string;
  radius?: number;
  limit?: number;
  minPopulation?: number;
}): void {
  if (params.radius !== undefined && !(typeof params.radius === 'number' && params.radius >= 1 && params.radius <= 500)) {
    fail(`radius must be a number between 1 and 500 (km), got ${JSON.stringify(params.radius)}`, 'radius', params.radius, 'out_of_range');
  }
  if (params.limit !== undefined && !(Number.isInteger(params.limit) && params.limit >= 1 && params.limit <= 100)) {
    fail(`limit must be an integer between 1 and 100, got ${JSON.stringify(params.limit)}`, 'limit', params.limit, 'out_of_range');
  }
  if (params.minPopulation !== undefined && !(Number.isInteger(params.minPopulation) && params.minPopulation >= 0)) {
    fail(`minPopulation must be a non-negative integer, got ${JSON.stringify(params.minPopulation)}`, 'minPopulation', params.minPopulation, 'out_of_range');
  }
  if (params.type === 'country' && params.country !== undefined) {
    fail('country is not a valid filter when type is "country"', 'country', params.country, 'invalid_with_type_country');
  }
  if (params.state !== undefined && (params.state.length < 1 || params.state.length > 20)) {
    fail(`state must be 1-20 characters, got ${JSON.stringify(params.state)}`, 'state', params.state, 'out_of_range');
  }
}

/** Cross-field check: `dependentField` may only be set when `requiredField` is also set. */
export function assertRequiredWith(
  dependentValue: unknown,
  dependentField: string,
  requiredValue: unknown,
  requiredField: string,
): void {
  if (dependentValue !== undefined && requiredValue === undefined) {
    fail(
      `${requiredField} is required when ${dependentField} is provided`,
      requiredField,
      requiredValue,
      'required_with_' + dependentField,
    );
  }
}
