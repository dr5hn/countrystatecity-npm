/**
 * Maps an HTTP error response to a concrete CSCError subclass.
 *
 * Body field names/casing aren't confirmed against the live API, so both
 * camelCase and snake_case variants are checked defensively.
 */

import { AuthenticationError, ValidationError, FeatureRestrictedError, RateLimitError, NotFoundError, NetworkError, type CSCError } from '../errors';

function pick(body: unknown, ...keys: string[]): unknown {
  if (typeof body !== 'object' || body === null) return undefined;
  const record = body as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] !== undefined) return record[key];
  }
  return undefined;
}

function messageFrom(body: unknown, fallback: string): string {
  const msg = pick(body, 'message', 'error', 'error_description', 'errorMessage');
  return typeof msg === 'string' && msg.length > 0 ? msg : fallback;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

export interface MapErrorResponseInput {
  status: number;
  body: unknown;
  url?: string;
  requestId?: string;
  retryAfterSeconds?: number;
}

export function mapErrorResponse(input: MapErrorResponseInput): CSCError {
  const { status, body, url, requestId, retryAfterSeconds } = input;
  const opts = { statusCode: status, requestId, url };

  switch (status) {
    case 401:
      return new AuthenticationError(messageFrom(body, 'Invalid or missing API key.'), opts);

    case 403:
      return new FeatureRestrictedError(messageFrom(body, 'This endpoint requires a higher plan.'), {
        ...opts,
        feature: str(pick(body, 'feature')),
        currentPlan: str(pick(body, 'currentPlan', 'current_plan')),
        requiredPlan: str(pick(body, 'requiredPlan', 'required_plan')),
        upgradeUrl: str(pick(body, 'upgradeUrl', 'upgrade_url')),
      });

    case 404:
      return new NotFoundError(messageFrom(body, 'The requested resource was not found.'), {
        ...opts,
        resource: str(pick(body, 'resource')),
        identifier: str(pick(body, 'identifier')),
      });

    case 429: {
      const scopeRaw = pick(body, 'scope');
      const scope = scopeRaw === 'daily' || scopeRaw === 'monthly' ? scopeRaw : undefined;
      return new RateLimitError(messageFrom(body, 'Rate limit exceeded.'), {
        ...opts,
        limit: num(pick(body, 'limit')),
        remaining: num(pick(body, 'remaining')),
        resetAt: str(pick(body, 'resetAt', 'reset_at', 'reset')),
        retryAfter: retryAfterSeconds,
        scope,
      });
    }

    case 400:
    case 422:
      return new ValidationError(messageFrom(body, 'The request was rejected as invalid.'), {
        ...opts,
        field: str(pick(body, 'field')),
        reason: str(pick(body, 'reason', 'code')),
      });

    default:
      return new NetworkError(messageFrom(body, `Request failed with status ${status}.`), opts);
  }
}
