/**
 * Safe URL construction: path segments are individually encoded and joined,
 * so a caller-supplied value can never inject extra path segments or escape
 * the resource path (e.g. an iso2 of "US/../secret").
 */

import { ValidationError } from '../errors';

export type QueryValue = string | number | boolean | undefined;

export function buildUrl(
  baseUrl: string,
  segments: Array<string | number>,
  query?: Record<string, QueryValue>,
): string {
  const url = new URL(baseUrl);
  const basePath = url.pathname.replace(/\/+$/, '');

  const encodedSegments = segments.map((segment) => {
    const str = String(segment);
    if (str.length === 0 || str.includes('/') || str.includes('\\') || str.includes('..')) {
      throw new ValidationError(`Invalid path segment: ${JSON.stringify(str)}`, {
        field: 'path',
        value: str,
        reason: 'invalid_path_segment',
      });
    }
    return encodeURIComponent(str);
  });

  url.pathname = [basePath, ...encodedSegments].join('/');

  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      params.set(key, String(value));
    }
  }
  url.search = params.toString();

  return url.toString();
}
