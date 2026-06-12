import { Command } from 'commander';
import chalk from 'chalk';
import readline from 'readline';
import { Writable } from 'stream';
import { getApiKey, setApiKey, clearApiKey } from '../lib/config.js';
import { validateKey } from '../lib/api.js';
import { getTierName, formatNumber } from '../lib/usage-footer.js';
import { createSpinner, isTTY, type GlobalFlags } from '../lib/output.js';

/**
 * Prompts the user for an API key with masked input.
 * Suppresses all echoed output after the prompt is displayed.
 */
async function promptForKey(): Promise<string> {
  return new Promise((resolve) => {
    let muted = false;
    let settled = false;

    const mutableStdout = new Writable({
      write(chunk, encoding, callback) {
        if (!muted) {
          process.stdout.write(chunk, encoding as BufferEncoding);
        }
        callback();
      },
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: true,
    });

    const finish = (answer: string): void => {
      if (settled) return;
      settled = true;
      rl.close();
      console.log();
      resolve(answer.trim());
    };

    rl.question(
      `Enter your API key (get one at ${chalk.cyan('https://app.countrystatecity.in')}): `,
      (answer) => finish(answer)
    );

    rl.on('close', () => {
      if (!settled) {
        settled = true;
        console.log();
        resolve('');
      }
    });

    muted = true;
  });
}

/**
 * Registers auth subcommands: login, status, logout.
 */
export function registerAuthCommands(program: Command): void {
  const auth = program.command('auth').description('Manage API authentication');

  auth
    .command('login')
    .description('Authenticate with your API key')
    .option('--key <apiKey>', 'Provide API key directly')
    .action(async (options: { key?: string }, cmd: Command) => {
      const globalOpts = cmd.optsWithGlobals();
      const flags: GlobalFlags = {
        json: globalOpts.json ?? false,
        quiet: globalOpts.quiet ?? false,
        noFooter: globalOpts.footer === false,
      };

      if (!options.key && !isTTY()) {
        process.stderr.write(chalk.red('API key required in non-interactive mode.') + '\n');
        process.stderr.write(
          chalk.dim('Use `csc auth login --key <API_KEY>` to provide it directly.') + '\n'
        );
        process.exit(1);
      }

      const key = options.key || (await promptForKey());

      if (!key) {
        process.stderr.write(chalk.red('No API key provided.') + '\n');
        process.exit(1);
      }

      const spinner = await createSpinner('Validating API key...', flags);
      const result = await validateKey(key);

      if (!result.valid) {
        spinner.fail('Invalid API key.');
        process.stderr.write(chalk.dim('Check your key at https://app.countrystatecity.in') + '\n');
        process.exit(1);
      }

      setApiKey(key);
      spinner.succeed('API key saved successfully.');

      if (result.usage) {
        const tier = getTierName(result.usage.dailyLimit);
        process.stderr.write(
          chalk.dim(
            `Tier: ${tier} | ${formatNumber(result.usage.dailyLimit)}/day | ${formatNumber(result.usage.monthlyLimit)}/month`
          ) + '\n'
        );
      }
    });

  auth
    .command('status')
    .description('Check authentication status')
    .action(async (_options: Record<string, unknown>, cmd: Command) => {
      const globalOpts = cmd.optsWithGlobals();
      const flags: GlobalFlags = {
        json: globalOpts.json ?? false,
        quiet: globalOpts.quiet ?? false,
        noFooter: globalOpts.footer === false,
      };

      const key = getApiKey();
      if (!key) {
        if (flags.json) {
          process.stdout.write(JSON.stringify({ authenticated: false }) + '\n');
        } else {
          process.stderr.write(chalk.yellow('Not logged in.') + '\n');
          process.stderr.write(chalk.dim('Run `csc auth login` to set your API key.') + '\n');
        }
        return;
      }

      const spinner = await createSpinner('Checking status...', flags);
      const result = await validateKey(key);

      if (!result.valid) {
        spinner.fail('Stored API key is invalid.');
        process.stderr.write(chalk.dim('Run `csc auth login` to set a new key.') + '\n');
        return;
      }

      spinner.stop();

      if (flags.json) {
        const masked = '****...' + key.slice(-4);
        const output: Record<string, unknown> = { authenticated: true, key: masked };
        if (result.usage) {
          const tier = getTierName(result.usage.dailyLimit);
          output.tier = tier;
          output.daily = { used: result.usage.dailyUsed, limit: result.usage.dailyLimit };
          output.monthly = { used: result.usage.monthlyUsed, limit: result.usage.monthlyLimit };
        }
        process.stdout.write(JSON.stringify(output) + '\n');
        return;
      }

      const masked = '****...' + key.slice(-4);
      console.log(chalk.green('Authenticated'));
      console.log(`${chalk.bold('Key:'.padEnd(10))}${masked}`);

      if (result.usage) {
        const tier = getTierName(result.usage.dailyLimit);
        console.log(`${chalk.bold('Tier:'.padEnd(10))}${tier}`);
        console.log(
          `${chalk.bold('Daily:'.padEnd(10))}${formatNumber(result.usage.dailyUsed)} / ${formatNumber(result.usage.dailyLimit)}`
        );
        console.log(
          `${chalk.bold('Monthly:'.padEnd(10))}${formatNumber(result.usage.monthlyUsed)} / ${formatNumber(result.usage.monthlyLimit)}`
        );
      }
    });

  auth
    .command('logout')
    .description('Remove stored API key')
    .action((_options: Record<string, unknown>, cmd: Command) => {
      const globalOpts = cmd.optsWithGlobals();
      const flags: GlobalFlags = {
        json: globalOpts.json ?? false,
        quiet: globalOpts.quiet ?? false,
        noFooter: globalOpts.footer === false,
      };

      clearApiKey();
      if (flags.json) {
        process.stdout.write(JSON.stringify({ success: true }) + '\n');
      } else {
        console.log(chalk.green('API key removed.'));
      }
    });
}
