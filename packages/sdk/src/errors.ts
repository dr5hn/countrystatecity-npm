/**
 * Error classes for @countrystatecity/sdk.
 *
 * None of these ever carry the configured API key — only `message`, `url`
 * (path+query, never headers), and response-derived fields.
 */

export interface CSCErrorOptions {
  statusCode?: number;
  requestId?: string;
  url?: string;
  cause?: unknown;
}

export class CSCError extends Error {
  readonly statusCode?: number;
  readonly requestId?: string;
  readonly url?: string;
  /** The underlying error this one wraps, if any (e.g. the original fetch failure). */
  readonly cause?: unknown;
  /** Number of retries attempted before this error was thrown. Undefined if no request was made (e.g. client-side validation). */
  retryCount?: number;

  constructor(message: string, opts: CSCErrorOptions = {}) {
    super(message);
    this.name = 'CSCError';
    this.statusCode = opts.statusCode;
    this.requestId = opts.requestId;
    this.url = opts.url;
    this.cause = opts.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 401 — missing or invalid API key. */
export class AuthenticationError extends CSCError {
  constructor(message: string, opts: CSCErrorOptions = {}) {
    super(message, opts);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 403 — request blocked for a non-plan reason such as origin or IP restrictions. */
export class ForbiddenError extends CSCError {
  constructor(message: string, opts: CSCErrorOptions = {}) {
    super(message, opts);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Malformed input (caught client-side) or a 4xx validation response from the API. */
export class ValidationError extends CSCError {
  readonly field?: string;
  readonly value?: unknown;
  readonly reason?: string;

  constructor(
    message: string,
    opts: CSCErrorOptions & { field?: string; value?: unknown; reason?: string } = {},
  ) {
    super(message, opts);
    this.name = 'ValidationError';
    this.field = opts.field;
    this.value = opts.value;
    this.reason = opts.reason;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 403 — the current plan does not include this feature. */
export class FeatureRestrictedError extends CSCError {
  readonly feature?: string;
  readonly currentPlan?: string;
  readonly requiredPlan?: string;
  readonly upgradeUrl?: string;

  constructor(
    message: string,
    opts: CSCErrorOptions & {
      feature?: string;
      currentPlan?: string;
      requiredPlan?: string;
      upgradeUrl?: string;
    } = {},
  ) {
    super(message, opts);
    this.name = 'FeatureRestrictedError';
    this.feature = opts.feature;
    this.currentPlan = opts.currentPlan;
    this.requiredPlan = opts.requiredPlan;
    this.upgradeUrl = opts.upgradeUrl ?? 'https://app.countrystatecity.in/pricing';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 429 — daily or monthly quota exceeded. */
export class RateLimitError extends CSCError {
  readonly limit?: number;
  readonly remaining?: number;
  readonly resetAt?: string;
  readonly retryAfter?: number;
  readonly scope?: 'daily' | 'monthly';
  readonly tier?: string;
  readonly upgradeUrl?: string;

  constructor(
    message: string,
    opts: CSCErrorOptions & {
      limit?: number;
      remaining?: number;
      resetAt?: string;
      retryAfter?: number;
      scope?: 'daily' | 'monthly';
      tier?: string;
      upgradeUrl?: string;
    } = {},
  ) {
    super(message, opts);
    this.name = 'RateLimitError';
    this.limit = opts.limit;
    this.remaining = opts.remaining;
    this.resetAt = opts.resetAt;
    this.retryAfter = opts.retryAfter;
    this.scope = opts.scope;
    this.tier = opts.tier;
    this.upgradeUrl = opts.upgradeUrl;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 404 — the requested resource does not exist. */
export class NotFoundError extends CSCError {
  readonly resource?: string;
  readonly identifier?: string;

  constructor(
    message: string,
    opts: CSCErrorOptions & { resource?: string; identifier?: string } = {},
  ) {
    super(message, opts);
    this.name = 'NotFoundError';
    this.resource = opts.resource;
    this.identifier = opts.identifier;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Connection failure, or a 5xx response that exhausted all retries. */
export class NetworkError extends CSCError {
  constructor(message: string, opts: CSCErrorOptions = {}) {
    super(message, opts);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** A request (including retries) exceeded its configured timeout. */
export class TimeoutError extends CSCError {
  readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number, opts: CSCErrorOptions = {}) {
    super(message, opts);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
