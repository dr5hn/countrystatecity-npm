import chalk from 'chalk';
import type { UsageInfo } from './api.js';

/**
 * Infers tier name from daily API limit.
 */
function getTierName(dailyLimit: number): string {
  if (dailyLimit <= 100) return 'Community';
  if (dailyLimit <= 300) return 'Starter';
  if (dailyLimit <= 1000) return 'Supporter';
  if (dailyLimit <= 3300) return 'Professional';
  if (dailyLimit <= 25000) return 'Business';
  if (dailyLimit <= 50000) return 'Legacy';
  return 'Custom';
}

/**
 * Formats a number with comma separators (e.g. 1230 -> "1,230").
 */
function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Calculates hours and minutes until next daily reset (00:00 UTC).
 */
function timeUntilDailyReset(): string {
  const now = Date.now();
  const resetAt = new Date();
  resetAt.setUTCHours(24, 0, 0, 0);
  const ms = resetAt.getTime() - now;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

/**
 * Prints API usage stats after every command that hits the API.
 * Adjusts colour and messaging based on usage percentage.
 * Writes to stderr so that stdout remains clean for structured data.
 *
 * @param usage - Usage info returned from the API, or null if unavailable.
 * @param flags - Optional global flags; if noFooter or json, returns immediately.
 */
export function printUsageFooter(
  usage: UsageInfo | null,
  flags?: { noFooter?: boolean; json?: boolean }
): void {
  if (flags?.noFooter || flags?.json) return;
  if (!usage) return;

  const { dailyUsed, dailyLimit, monthlyUsed, monthlyLimit } = usage;
  if (dailyLimit === 0 || monthlyLimit === 0) return;
  const dailyPercent = (dailyUsed / dailyLimit) * 100;
  const tier = getTierName(dailyLimit);

  process.stderr.write('\n');

  if (dailyPercent >= 100) {
    process.stderr.write(
      chalk.red(
        `Daily limit reached (${formatNumber(dailyUsed)}/${formatNumber(dailyLimit)}). Resets in ${timeUntilDailyReset()}.`
      ) + '\n'
    );
    const nextTier = dailyLimit <= 300 ? 'Supporter ($9/mo)' : 'a higher plan';
    process.stderr.write(chalk.red(`Upgrade to ${nextTier} for more requests/day.`) + '\n');
    process.stderr.write(
      chalk.red('Run `csc upgrade` or visit https://app.countrystatecity.in/pricing') + '\n'
    );
  } else if (dailyPercent >= 80) {
    process.stderr.write(
      chalk.yellow(
        `Warning: ${formatNumber(dailyUsed)}/${formatNumber(dailyLimit)} daily requests used (${Math.round(dailyPercent)}%). Upgrade for more at $9/mo.`
      ) + '\n'
    );
    process.stderr.write(chalk.yellow('Run `csc upgrade` to view plans.') + '\n');
  } else {
    process.stderr.write(
      chalk.dim(
        `Usage: ${formatNumber(dailyUsed)}/${formatNumber(dailyLimit)} today | ${formatNumber(monthlyUsed)}/${formatNumber(monthlyLimit)} this month (${tier})`
      ) + '\n'
    );
  }
}

/**
 * Builds a coloured progress bar string (20 chars wide).
 */
export function progressBar(used: number, limit: number): string {
  if (limit === 0) return '[--------------------]';
  const ratio = Math.min(used / limit, 1);
  const filled = Math.round(ratio * 20);
  const empty = 20 - filled;
  const percent = Math.round(ratio * 100);

  let colorFn: (s: string) => string;
  if (percent >= 80) colorFn = chalk.red;
  else if (percent >= 60) colorFn = chalk.yellow;
  else colorFn = chalk.green;

  return colorFn(`[${'='.repeat(filled)}${'-'.repeat(empty)}]`);
}

export { getTierName, formatNumber, timeUntilDailyReset };
