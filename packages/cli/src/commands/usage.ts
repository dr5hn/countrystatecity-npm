import { Command } from 'commander';
import chalk from 'chalk';
import { get } from '../lib/api.js';
import {
  progressBar,
  getTierName,
  formatNumber,
  timeUntilDailyReset,
} from '../lib/usage-footer.js';
import { createSpinner, type GlobalFlags } from '../lib/output.js';

/**
 * Returns the monthly price label for a tier.
 */
function tierPrice(dailyLimit: number): string {
  if (dailyLimit <= 100) return 'Free';
  if (dailyLimit <= 300) return '$5/mo';
  if (dailyLimit <= 1000) return '$9/mo';
  if (dailyLimit <= 3300) return '$29/mo';
  if (dailyLimit <= 25000) return '$79/mo';
  return 'Custom';
}

/**
 * Calculates days until the 1st of next month (monthly reset).
 */
function daysUntilMonthlyReset(): number {
  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Registers the usage command — shows current plan and quota status.
 */
export function registerUsageCommand(program: Command): void {
  program
    .command('usage')
    .description('View API usage and quota')
    .action(async (_options: Record<string, unknown>, cmd: Command) => {
      const globalOpts = cmd.optsWithGlobals();
      const flags: GlobalFlags = {
        json: globalOpts.json ?? false,
        quiet: globalOpts.quiet ?? false,
        noFooter: globalOpts.footer === false,
      };

      const spinner = await createSpinner('Fetching usage...', flags);
      const { usage } = await get<unknown>('/countries/IN');
      spinner.stop();

      if (!usage) {
        if (flags.json) {
          process.stdout.write(JSON.stringify({ error: 'Usage information not available.' }) + '\n');
        } else {
          console.log(chalk.yellow('Usage information not available.'));
        }
        return;
      }

      const { dailyUsed, dailyLimit, monthlyUsed, monthlyLimit } = usage;
      if (dailyLimit === 0 || monthlyLimit === 0) {
        if (flags.json) {
          process.stdout.write(JSON.stringify({ error: 'Usage limit data is unavailable.' }) + '\n');
        } else {
          console.log(chalk.yellow('Usage limit data is unavailable.'));
        }
        return;
      }

      const tier = getTierName(dailyLimit);
      const price = tierPrice(dailyLimit);
      const dailyPct = Math.round((dailyUsed / dailyLimit) * 100);
      const monthlyPct = Math.round((monthlyUsed / monthlyLimit) * 100);

      if (flags.json) {
        process.stdout.write(
          JSON.stringify({
            plan: tier,
            price,
            daily: { used: dailyUsed, limit: dailyLimit, percent: dailyPct },
            monthly: { used: monthlyUsed, limit: monthlyLimit, percent: monthlyPct },
          }) + '\n'
        );
        return;
      }

      console.log(`${chalk.bold('Plan:'.padEnd(12))}${tier} (${price})`);
      console.log(
        `${chalk.bold('Daily:'.padEnd(12))}${progressBar(dailyUsed, dailyLimit)} ${formatNumber(dailyUsed)} / ${formatNumber(dailyLimit)} (${dailyPct}%)`
      );
      console.log(
        `${chalk.bold('Monthly:'.padEnd(12))}${progressBar(monthlyUsed, monthlyLimit)} ${formatNumber(monthlyUsed)} / ${formatNumber(monthlyLimit)} (${monthlyPct}%)`
      );
      console.log(
        `${chalk.bold('Resets:'.padEnd(12))}Daily in ${timeUntilDailyReset()} | Monthly in ${daysUntilMonthlyReset()} days`
      );
    });
}
