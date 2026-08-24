import chalk from 'chalk';
import {
  CSCClient,
  CSCError,
  AuthenticationError,
  FeatureRestrictedError,
  RateLimitError,
  NotFoundError,
} from '@countrystatecity/sdk';
import type { CSCResponse, IRateLimitMeta } from '@countrystatecity/sdk';
import { getApiKey, getApiBase } from './config.js';

export interface UsageInfo {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
}

interface ApiResponse<T> {
  data: T;
  usage: UsageInfo | null;
}

const USER_AGENT = '@countrystatecity/cli/0.1.1';

/**
 * Adapts the SDK's rate-limit metadata to the CLI's UsageInfo shape.
 * Returns null if any of the four fields is missing.
 */
function toUsageInfo(rateLimit?: IRateLimitMeta): UsageInfo | null {
  if (
    rateLimit?.dailyUsed === undefined ||
    rateLimit?.dailyLimit === undefined ||
    rateLimit?.monthlyUsed === undefined ||
    rateLimit?.monthlyLimit === undefined
  ) {
    return null;
  }

  return {
    dailyUsed: rateLimit.dailyUsed,
    dailyLimit: rateLimit.dailyLimit,
    monthlyUsed: rateLimit.monthlyUsed,
    monthlyLimit: rateLimit.monthlyLimit,
  };
}

/**
 * Routes a legacy REST path string to the matching typed SDK resource call.
 * The set of paths below is closed and fully enumerated from every call site
 * in src/commands/ — an unmatched path is a programmer error, not something
 * a user can trigger.
 */
function dispatchRequest(client: CSCClient, path: string): Promise<CSCResponse<unknown>> {
  let match: RegExpMatchArray | null;

  if (path === '/countries') return client.countries.list();
  if (path === '/states') return client.states.list();
  if (path === '/regions') return client.regions.list();

  if ((match = path.match(/^\/countries\/([^/]+)\/states\/([^/]+)\/cities$/))) {
    return client.cities.list({ country: match[1], state: match[2] });
  }
  if ((match = path.match(/^\/countries\/([^/]+)\/states\/([^/]+)$/))) {
    return client.states.get(match[1], match[2]);
  }
  if ((match = path.match(/^\/countries\/([^/]+)\/states$/))) {
    return client.states.list({ country: match[1] });
  }
  if ((match = path.match(/^\/countries\/([^/]+)\/cities$/))) {
    return client.cities.list({ country: match[1] });
  }
  if ((match = path.match(/^\/countries\/([^/]+)$/))) {
    return client.countries.get(match[1]);
  }

  throw new Error(`Unrecognized API path: ${path}`);
}

/**
 * Makes an authenticated GET request to the CSC API.
 * Handles common error codes with actionable messages.
 */
export async function get<T>(path: string): Promise<ApiResponse<T>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error(chalk.red('Not authenticated.'));
    console.error(chalk.dim('Run `csc auth login` to set your API key.'));
    process.exit(1);
  }

  try {
    const client = new CSCClient({ apiKey, baseUrl: getApiBase(), userAgent: USER_AGENT });
    const response = await dispatchRequest(client, path);
    return { data: response.data as T, usage: toUsageInfo(response.meta.rateLimit) };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error(chalk.red('Invalid or missing API key.'));
      console.error(chalk.dim('Run `csc auth login` to set your key.'));
      process.exit(1);
    }

    if (error instanceof FeatureRestrictedError) {
      console.error(chalk.red('Access denied — this endpoint requires a higher plan.'));
      console.error(chalk.dim('Run `csc upgrade` to view available plans.'));
      process.exit(1);
    }

    if (error instanceof RateLimitError) {
      console.error(chalk.red('Daily limit reached.'));
      console.error(chalk.yellow('Run `csc upgrade` to increase your limits.'));
      process.exit(1);
    }

    if (error instanceof NotFoundError) {
      console.error(chalk.red('Not found.'));
      process.exit(1);
    }

    if (error instanceof CSCError) {
      // ValidationError (bad input caught client-side, or a 400/422
      // response), NetworkError (5xx or connection failure after retries),
      // and TimeoutError (request exceeded the SDK's 10s default — axios had
      // no timeout configured, so this is a new but deliberate failure mode)
      // all share this generic branch; only the four status codes above get
      // bespoke wording.
      console.error(chalk.red(`API error: ${error.message}`));
      process.exit(1);
    }

    if (error instanceof Error && error.message.startsWith('Unrecognized API path')) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }

    console.error(chalk.red('Cannot reach API. Check your internet connection.'));
    process.exit(1);
  }
}

/**
 * Validates an API key by making a lightweight test request.
 * Returns usage info on success, null on failure.
 */
export async function validateKey(apiKey: string): Promise<{ valid: boolean; usage: UsageInfo | null }> {
  try {
    const client = new CSCClient({ apiKey, baseUrl: getApiBase(), userAgent: USER_AGENT });
    const response = await client.countries.get('IN');
    return { valid: true, usage: toUsageInfo(response.meta.rateLimit) };
  } catch {
    return { valid: false, usage: null };
  }
}
