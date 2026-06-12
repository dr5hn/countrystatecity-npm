import axios, { AxiosError } from 'axios';
import chalk from 'chalk';
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

/**
 * Extracts usage stats from API response headers.
 * Returns null if any of the four required headers are missing.
 */
function extractUsage(headers: Record<string, string>): UsageInfo | null {
  const dailyUsed = headers['x-csc-daily-used'];
  const dailyLimit = headers['x-csc-daily-limit'];
  const monthlyUsed = headers['x-csc-monthly-used'];
  const monthlyLimit = headers['x-csc-monthly-limit'];

  if (!dailyUsed || !dailyLimit || !monthlyUsed || !monthlyLimit) {
    return null;
  }

  return {
    dailyUsed: parseInt(dailyUsed, 10),
    dailyLimit: parseInt(dailyLimit, 10),
    monthlyUsed: parseInt(monthlyUsed, 10),
    monthlyLimit: parseInt(monthlyLimit, 10),
  };
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

  const baseUrl = getApiBase();

  try {
    const response = await axios.get<T>(`${baseUrl}${path}`, {
      headers: {
        'X-CSCAPI-KEY': apiKey,
        'User-Agent': '@countrystatecity/cli/0.1.1',
      },
    });

    const usage = extractUsage(response.headers as Record<string, string>);
    return { data: response.data, usage };
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;

      if (status === 401) {
        console.error(chalk.red('Invalid or missing API key.'));
        console.error(chalk.dim('Run `csc auth login` to set your key.'));
        process.exit(1);
      }

      if (status === 403) {
        console.error(chalk.red('Access denied — this endpoint requires a higher plan.'));
        console.error(chalk.dim('Run `csc upgrade` to view available plans.'));
        process.exit(1);
      }

      if (status === 429) {
        console.error(chalk.red('Daily limit reached.'));
        console.error(chalk.yellow('Run `csc upgrade` to increase your limits.'));
        process.exit(1);
      }

      if (status === 404) {
        console.error(chalk.red('Not found.'));
        process.exit(1);
      }

      console.error(chalk.red(`API error: ${error.message}`));
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
  const baseUrl = getApiBase();

  try {
    const response = await axios.get(`${baseUrl}/countries/IN`, {
      headers: {
        'X-CSCAPI-KEY': apiKey,
        'User-Agent': '@countrystatecity/cli/0.1.1',
      },
    });

    const usage = extractUsage(response.headers as Record<string, string>);
    return { valid: true, usage };
  } catch {
    return { valid: false, usage: null };
  }
}
