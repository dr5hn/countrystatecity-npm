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
import type { IChangesParams, IListParams, ILocalizationParams } from '../types/params';

const LOCALE_PATTERN = /^[a-zA-Z]{2}(-[a-zA-Z]{2,4})?$/;

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

/** Requires a full ISO 8601 timestamp with an explicit timezone. */
export function assertIsoDateTimeString(value: string, field: string): string {
  const valid = assertIsoDateString(value, field);
  if (!/T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(valid)) {
    fail(`${field} must be a full ISO 8601 timestamp with a timezone, got ${JSON.stringify(value)}`, field, value, 'invalid_datetime_format');
  }
  return new Date(valid).toISOString();
}

export function assertNonEmptyString(value: string, field: string): string {
  if (typeof value !== 'string' || !isNonEmptyString(value)) {
    fail(`${field} must be a non-empty string`, field, value, 'empty_string');
  }
  return value;
}

/** Validates localization options and returns their API query names. */
export function assertLocalizationParams(params: ILocalizationParams | undefined): {
  locale?: string;
  include_translations?: boolean;
} | undefined {
  if (params === undefined) return undefined;
  if (typeof params !== 'object' || params === null || Array.isArray(params)) {
    fail('localization parameters must be an object', 'params', params, 'invalid_type');
  }
  if (params.locale !== undefined && (typeof params.locale !== 'string' || !LOCALE_PATTERN.test(params.locale))) {
    fail(
      `locale must be a language code like "pt" or "pt-BR", got ${JSON.stringify(params.locale)}`,
      'locale',
      params.locale,
      'invalid_locale_format',
    );
  }
  if (params.includeTranslations !== undefined && typeof params.includeTranslations !== 'boolean') {
    fail(
      `includeTranslations must be a boolean, got ${JSON.stringify(params.includeTranslations)}`,
      'includeTranslations',
      params.includeTranslations,
      'invalid_type',
    );
  }
  if (params.locale === undefined && params.includeTranslations === undefined) return undefined;
  let locale: string | undefined;
  if (params.locale !== undefined) {
    try {
      locale = Intl.getCanonicalLocales(params.locale)[0];
    } catch {
      fail(
        `locale must be a language code like "pt" or "pt-BR", got ${JSON.stringify(params.locale)}`,
        'locale',
        params.locale,
        'invalid_locale_format',
      );
    }
  }
  return {
    ...(locale === undefined ? {} : { locale }),
    ...(params.includeTranslations === undefined ? {} : { include_translations: params.includeTranslations }),
  };
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
 * cross-field checks (mirrors the real API's zod `.refine()` calls).
 * `state` has no character-class restriction server-side (unlike
 * `assertStateCode`'s 8-char alphanumeric rule for path-segment state
 * codes) — only a 1-20 length bound — so it's checked here, not via
 * `assertStateCode`.
 */
export function assertAutocompleteParams(params: { query: unknown; type?: string; country?: string; state?: unknown; limit?: number }): void {
  const query = typeof params.query === 'string' ? params.query.trim() : '';
  if (query.length < 2 || query.length > 100) {
    fail(`query must be between 2 and 100 characters, got ${JSON.stringify(params.query)}`, 'query', params.query, 'out_of_range');
  }
  if (params.limit !== undefined && !(Number.isInteger(params.limit) && params.limit >= 1 && params.limit <= 50)) {
    fail(`limit must be an integer between 1 and 50, got ${JSON.stringify(params.limit)}`, 'limit', params.limit, 'out_of_range');
  }
  if (params.type === 'country' && params.country !== undefined) {
    fail('country is not a valid filter when type is "country"', 'country', params.country, 'invalid_with_type_country');
  }
  if (params.state !== undefined && (typeof params.state !== 'string' || params.state.trim().length < 1 || params.state.trim().length > 20)) {
    fail(`state must be 1-20 characters, got ${JSON.stringify(params.state)}`, 'state', params.state, 'out_of_range');
  }
  assertRequiredWith(params.state, 'state', params.country, 'country');
  if (params.state !== undefined && (params.type ?? 'city') !== 'city') {
    fail('state is only a valid filter when type="city"', 'state', params.state, 'invalid_with_type');
  }
}

/**
 * Nearby search shares autocomplete's `country`-invalid-when-`type`-is-
 * `country` and `state` 1-20-char checks, but has its own `radius` (1-500 km)
 * and `limit` (1-100, not the 1-50 shared by fuzzy/autocomplete) ranges.
 * It also validates the city-only `state`/`kind` filters before any request.
 */
export function assertNearbyParams(params: {
  type?: string;
  country?: string;
  state?: unknown;
  kind?: unknown;
  radius?: number;
  limit?: number;
  minPopulation?: number;
}): void {
  if (typeof params !== 'object' || params === null) {
    fail('nearby parameters are required', 'params', params, 'required');
  }
  const type = params.type ?? 'city';
  if (!['city', 'state', 'country'].includes(type)) {
    fail(`type must be city, state, or country, got ${JSON.stringify(params.type)}`, 'type', params.type, 'invalid_enum');
  }
  if (params.radius !== undefined && !(Number.isFinite(params.radius) && params.radius >= 1 && params.radius <= 500)) {
    fail(`radius must be a number between 1 and 500 (km), got ${JSON.stringify(params.radius)}`, 'radius', params.radius, 'out_of_range');
  }
  if (params.limit !== undefined && !(Number.isInteger(params.limit) && params.limit >= 1 && params.limit <= 100)) {
    fail(`limit must be an integer between 1 and 100, got ${JSON.stringify(params.limit)}`, 'limit', params.limit, 'out_of_range');
  }
  if (params.minPopulation !== undefined && !(Number.isSafeInteger(params.minPopulation) && params.minPopulation >= 0)) {
    fail(`minPopulation must be a non-negative integer, got ${JSON.stringify(params.minPopulation)}`, 'minPopulation', params.minPopulation, 'out_of_range');
  }
  if (params.type === 'country' && params.country !== undefined) {
    fail('country is not a valid filter when type is "country"', 'country', params.country, 'invalid_with_type_country');
  }
  if (params.state !== undefined && (typeof params.state !== 'string' || params.state.trim().length < 1 || params.state.trim().length > 20)) {
    fail(`state must be 1-20 characters, got ${JSON.stringify(params.state)}`, 'state', params.state, 'out_of_range');
  }
  assertRequiredWith(params.state, 'state', params.country, 'country');
  if (params.state !== undefined && type !== 'city') {
    fail('state is only a valid filter when type="city"', 'state', params.state, 'invalid_with_type');
  }
  if (params.kind !== undefined && !['settlement', 'administrative', 'section', 'unknown'].includes(String(params.kind))) {
    fail(`kind must be settlement, administrative, section, or unknown, got ${JSON.stringify(params.kind)}`, 'kind', params.kind, 'invalid_enum');
  }
  if (params.kind !== undefined && type !== 'city') {
    fail('kind is only a valid filter when type="city"', 'kind', params.kind, 'invalid_with_type');
  }
}

/** Validates change-feed filters and its opaque cursor before any request. */
export function assertChangesParams(params: IChangesParams | undefined): void {
  if (params === undefined) return;
  if (typeof params !== 'object' || params === null || Array.isArray(params)) {
    fail('changes parameters must be an object', 'params', params, 'invalid_type');
  }
  if (params.placeType !== undefined && !['country', 'state', 'city'].includes(params.placeType)) {
    fail(`placeType must be country, state, or city, got ${JSON.stringify(params.placeType)}`, 'placeType', params.placeType, 'invalid_enum');
  }
  if (params.changeType !== undefined && ![
    'added', 'removed', 'renamed', 'place_group_changed',
    'parent_changed', 'coordinates_changed', 'other_fields_changed',
  ].includes(params.changeType)) {
    fail(`changeType is not supported, got ${JSON.stringify(params.changeType)}`, 'changeType', params.changeType, 'invalid_enum');
  }
  if (params.limit !== undefined && !(Number.isInteger(params.limit) && params.limit >= 1 && params.limit <= 100)) {
    fail(`limit must be an integer between 1 and 100, got ${JSON.stringify(params.limit)}`, 'limit', params.limit, 'out_of_range');
  }
  if (params.nextPageToken !== undefined && (
    typeof params.nextPageToken !== 'string' ||
    params.nextPageToken.length < 1 ||
    params.nextPageToken.length > 4096 ||
    !/^[A-Za-z0-9_-]+$/.test(params.nextPageToken)
  )) {
    fail('nextPageToken must be a non-empty opaque change-feed token', 'nextPageToken', params.nextPageToken, 'invalid_token');
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
