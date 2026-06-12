import { Command } from 'commander';
import chalk from 'chalk';
import open from 'open';
import { getApiKey } from '../lib/config.js';
import { validateKey } from '../lib/api.js';
import { getTierName, printUsageFooter } from '../lib/usage-footer.js';
import { printTable } from '../lib/display.js';
import { createSpinner, type GlobalFlags } from '../lib/output.js';

/** Plan definitions for the upgrade table and JSON output. */
const PLANS = [
  { name: 'Community', price: 'Free', daily: 100, monthly: 3000 },
  { name: 'Starter', price: '$5/mo', daily: 300, monthly: 9000 },
  { name: 'Supporter', price: '$9/mo', daily: 1000, monthly: 30000 },
  { name: 'Professional', price: '$29/mo', daily: 3300, monthly: 100000 },
  { name: 'Business', price: '$79/mo', daily: 25000, monthly: 750000 },
];

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
        const output: Record<string, unknown> = { plans: PLANS };
        if (currentPlan) output.currentPlan = currentPlan;
        process.stdout.write(JSON.stringify(output) + '\n');
        return;
      }

      if (currentPlan) {
        console.log(`Current plan: ${chalk.bold(currentPlan)}\n`);
      }

      console.log('Available plans:\n');
      printTable(
        ['Plan', 'Price', 'Daily', 'Monthly'],
        PLANS.map((p) => [
          p.name,
          p.price,
          p.daily.toLocaleString('en-US'),
          p.monthly.toLocaleString('en-US'),
        ])
      );

      printUsageFooter(usage, flags);

      console.log(`\n${chalk.dim('Opening pricing page...')}`);
      await open('https://app.countrystatecity.in/pricing');
    });
}
