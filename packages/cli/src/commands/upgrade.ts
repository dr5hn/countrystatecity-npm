import { Command } from 'commander';
import chalk from 'chalk';
import open from 'open';
import { getApiKey } from '../lib/config.js';
import { validateKey, getPlans, type Plan } from '../lib/api.js';
import { getTierName, printUsageFooter } from '../lib/usage-footer.js';
import { printTable } from '../lib/display.js';
import { createSpinner, type GlobalFlags } from '../lib/output.js';

function formatPrice(plan: Plan): string {
  const monthly = Number(plan.priceMonthly);
  return monthly > 0 ? `$${monthly}/mo` : 'Free';
}

function formatLimit(limit: number | null): string {
  return limit === null ? '—' : limit.toLocaleString('en-US');
}

/**
 * Registers the upgrade command — shows plan comparison and opens pricing page.
 */
export function registerUpgradeCommand(program: Command): void {
  program
    .command('upgrade')
    .description('View plans and open pricing page')
    .action(async (_options: Record<string, unknown>, cmd: Command) => {
      const globalOpts = cmd.optsWithGlobals();
      const flags: GlobalFlags = {
        json: globalOpts.json ?? false,
        quiet: globalOpts.quiet ?? false,
        noFooter: globalOpts.footer === false,
      };

      const plansSpinner = await createSpinner('Fetching current plans...', flags);
      const plans = await getPlans();
      plansSpinner.stop();

      let usage = null;
      let currentPlan: string | undefined;
      const key = getApiKey();

      if (key) {
        const spinner = await createSpinner('Fetching current plan...', flags);
        const result = await validateKey(key);
        spinner.stop();
        if (result.valid && result.usage) {
          usage = result.usage;
          currentPlan = getTierName(result.usage.dailyLimit);
        }
      }

      if (flags.json) {
        const output: Record<string, unknown> = { plans };
        if (currentPlan) output.currentPlan = currentPlan;
        process.stdout.write(JSON.stringify(output) + '\n');
        return;
      }

      if (currentPlan) {
        console.log(`Current plan: ${chalk.bold(currentPlan)}\n`);
      }

      console.log('Available plans:\n');
      printTable(
        ['Plan', 'Price', 'Daily', 'Monthly', 'Highlights'],
        plans.map((p) => [
          p.highlighted ? `${p.name} ${chalk.dim('(' + (p.badges[0] ?? 'Popular') + ')')}` : p.name,
          formatPrice(p),
          formatLimit(p.dailyLimit),
          formatLimit(p.monthlyLimit),
          p.features[0] ?? '',
        ])
      );

      printUsageFooter(usage, flags);

      console.log(`\n${chalk.dim('Opening pricing page...')}`);
      await open('https://app.countrystatecity.in/pricing');
    });
}
