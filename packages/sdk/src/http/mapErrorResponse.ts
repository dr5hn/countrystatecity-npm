/**
 * Maps an HTTP error response to a concrete CSCError subclass.
 *
 * Body field names/casing aren't confirmed against the live API, so both
 * camelCase and snake_case variants are checked defensively.
 */

import { AuthenticationError, ForbiddenError, ValidationError, FeatureRestrictedError, RateLimitError, NotFoundError, NetworkError, type CSCError } from '../errors';

function pick(body: unknown, ...keys: string[]): unknown {
  if (typeof body !== 'object' || body === null) return undefined;
  const record = body as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] !== undefined) return record[key];
  }
  return undefined;
}

/** Reads a canonical field from `details`, falling back to legacy top-level envelopes. */
function pickDetail(body: unknown, ...keys: string[]): unknown {
  const details = pick(body, 'details');
  return pick(details, ...keys) ?? pick(body, ...keys);
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

    case 403: {
      const feature = str(pickDetail(body, 'feature'));
      if (!feature) {
        return new ForbiddenError(messageFrom(body, 'This request is not allowed.'), opts);
      }
      return new FeatureRestrictedError(messageFrom(body, 'This endpoint requires a higher plan.'), {
        ...opts,
        feature,
        currentPlan: str(pickDetail(body, 'currentTier', 'currentPlan', 'current_tier', 'current_plan')),
        requiredPlan: str(pickDetail(body, 'requiredTier', 'requiredPlan', 'required_tier', 'required_plan')),
        upgradeUrl: str(pickDetail(body, 'upgradeUrl', 'upgrade_url')),
      });
    }

    case 404:
      return new NotFoundError(messageFrom(body, 'The requested resource was not found.'), {
        ...opts,
        resource: str(pick(body, 'resource')),
        identifier: str(pick(body, 'identifier')),
      });

    case 429: {
      const scopeRaw = pickDetail(body, 'period', 'scope');
      const scope = scopeRaw === 'daily' || scopeRaw === 'monthly' ? scopeRaw : undefined;
      return new RateLimitError(messageFrom(body, 'Rate limit exceeded.'), {
        ...opts,
        limit: num(pickDetail(body, 'limit')),
        remaining: num(pickDetail(body, 'remaining')),
        resetAt: str(pickDetail(body, 'resetAt', 'reset_at', 'reset')),
        retryAfter: retryAfterSeconds,
        scope,
        tier: str(pickDetail(body, 'tier')),
        upgradeUrl: str(pickDetail(body, 'upgradeUrl', 'upgrade_url')),
      });
    }

    case 400:
    case 422:
      return new ValidationError(messageFrom(body, 'The request was rejected as invalid.'), {
        ...opts,
        field: str(pickDetail(body, 'field')),
        reason: str(pickDetail(body, 'reason', 'code')),
        details: pick(body, 'details'),
      });

    default:
      return new NetworkError(messageFrom(body, `Request failed with status ${status}.`), opts);
  }
}
