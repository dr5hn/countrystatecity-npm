import { Command } from 'commander';
import chalk from 'chalk';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { get, type UsageInfo } from '../lib/api.js';
import { printUsageFooter } from '../lib/usage-footer.js';
import { createSpinner, type GlobalFlags, type Spinner } from '../lib/output.js';
import {
  generateCountryDropdown,
  generateStateDropdown,
  generateCityDropdown,
} from '../templates/react-dropdown.js';
import {
  generateCountrySeed,
  generateStateSeed,
  generateCitySeed,
} from '../templates/prisma-seed.js';

/**
 * Checks tier gating from usage headers after a data fetch.
 * Blocks Community tier (dailyLimit <= 150) and unknown tiers (missing headers).
 * Stops the spinner before exiting on block.
 */
function enforceTierGate(usage: UsageInfo | null, spinner: Spinner): void {
  if (!usage || usage.dailyLimit < 1000) {
    spinner.fail('Tier check failed.');
    console.log(
      chalk.yellow('The generate command requires a Supporter plan or above ($9/mo).')
    );
    if (usage) {
      const tierName = usage.dailyLimit <= 100 ? 'Community (Free)' : 'Starter ($5/mo)';
      console.log(`Your current plan: ${chalk.bold(tierName)}\n`);
    } else {
      console.log(chalk.dim('Could not verify your plan. Ensure usage headers are available.\n'));
    }
    console.log(chalk.dim('Run `csc upgrade` to unlock code generation.'));
    process.exit(1);
  }
}

/**
 * Registers generate subcommands: dropdown and seed.
 */
export function registerGenerateCommands(program: Command): void {
  const generate = program.command('generate').description('Generate code from API data');

  generate
    .command('dropdown')
    .description('Generate a dropdown/select component')
    .requiredOption('-e, --entity <type>', 'Entity type: countries, states, or cities')
    .requiredOption('-f, --format <format>', 'Output format: react')
    .option('-c, --country <iso2>', 'Country ISO2 code (required for states/cities)')
    .option('-s, --state <iso2>', 'State ISO2 code (required for cities)')
    .option('-o, --output <dir>', 'Output directory', process.cwd())
    .option('--typescript', 'Generate TypeScript (.tsx)', true)
    .option('--no-typescript', 'Generate JavaScript (.jsx)')
    .action(
      async (
        options: {
          entity: string;
          format: string;
          country?: string;
          state?: string;
          output: string;
          typescript: boolean;
        },
        cmd: Command
      ) => {
        const globalOpts = cmd.optsWithGlobals();
        const flags: GlobalFlags = {
          json: globalOpts.json ?? false,
          quiet: globalOpts.quiet ?? false,
          noFooter: globalOpts.footer === false,
        };

        if (options.format !== 'react') {
          process.stderr.write(chalk.red(`Unsupported format: ${options.format}`) + '\n');
          process.stderr.write(chalk.dim('Supported formats: react') + '\n');
          process.exit(1);
        }

        const spinner = await createSpinner('Fetching data...', flags);

        const tsx = options.typescript;
        const ext = tsx ? 'tsx' : 'jsx';
        let content: string;
        let filename: string;
        let fetchUsage: UsageInfo | null = null;

        if (options.entity === 'countries') {
          const { data, usage } = await get<
            Array<{ id: number; name: string; iso2: string; phonecode: string; emoji: string }>
          >('/countries');
          fetchUsage = usage;
          enforceTierGate(usage, spinner);
          content = generateCountryDropdown(data, tsx);
          filename = `CountrySelect.${ext}`;
        } else if (options.entity === 'states') {
          if (!options.country) {
            spinner.fail('Country code required for states.');
            process.stderr.write(chalk.dim('Use --country IN') + '\n');
            process.exit(1);
          }
          const code = options.country.toUpperCase();
          const { data, usage } = await get<
            Array<{ id: number; name: string; iso2: string; country_code: string }>
          >(`/countries/${code}/states`);
          fetchUsage = usage;
          enforceTierGate(usage, spinner);
          content = generateStateDropdown(data, code, tsx);
          filename = `StateSelect.${ext}`;
        } else if (options.entity === 'cities') {
          if (!options.country || !options.state) {
            spinner.fail('Country and state codes required for cities.');
            process.stderr.write(chalk.dim('Use --country IN --state MH') + '\n');
            process.exit(1);
          }
          const countryCode = options.country.toUpperCase();
          const stateCode = options.state.toUpperCase();
          const { data, usage } = await get<Array<{ id: number; name: string }>>(
            `/countries/${countryCode}/states/${stateCode}/cities`
          );
          fetchUsage = usage;
          enforceTierGate(usage, spinner);
          content = generateCityDropdown(data, countryCode, stateCode, tsx);
          filename = `CitySelect.${ext}`;
        } else {
          spinner.fail(`Unknown entity: ${options.entity}`);
          process.stderr.write(chalk.dim('Supported entities: countries, states, cities') + '\n');
          process.exit(1);
        }

        try {
          await mkdir(options.output, { recursive: true });
          const filepath = join(options.output, filename);
          await writeFile(filepath, content, 'utf-8');
          spinner.succeed(`Generated ${chalk.bold(filepath)}`);
        } catch (err) {
          spinner.fail('Failed to write output file.');
          process.stderr.write(chalk.red(String(err)) + '\n');
          process.exit(1);
        }

        printUsageFooter(fetchUsage, flags);
      }
    );

  generate
    .command('seed')
    .description('Generate a database seed file')
    .requiredOption('-e, --entity <type>', 'Entity type: countries, states, or cities')
    .requiredOption('-f, --format <format>', 'Output format: prisma')
    .option('-c, --country <iso2>', 'Country ISO2 code (for states/cities)')
    .option('-s, --state <iso2>', 'State ISO2 code (for cities)')
    .option('-o, --output <dir>', 'Output directory', process.cwd())
    .action(
      async (
        options: {
          entity: string;
          format: string;
          country?: string;
          state?: string;
          output: string;
        },
        cmd: Command
      ) => {
        const globalOpts = cmd.optsWithGlobals();
        const flags: GlobalFlags = {
          json: globalOpts.json ?? false,
          quiet: globalOpts.quiet ?? false,
          noFooter: globalOpts.footer === false,
        };

        if (options.format !== 'prisma') {
          process.stderr.write(chalk.red(`Unsupported format: ${options.format}`) + '\n');
          process.stderr.write(chalk.dim('Supported formats: prisma') + '\n');
          process.exit(1);
        }

        const spinner = await createSpinner('Fetching data...', flags);

        let content: string;
        let filename: string;
        let fetchUsage: UsageInfo | null = null;

        if (options.entity === 'countries') {
          const { data, usage } = await get<
            Array<{
              name: string;
              iso2: string;
              iso3: string;
              phonecode: string;
              capital: string;
              currency: string;
            }>
          >('/countries');
          fetchUsage = usage;
          enforceTierGate(usage, spinner);
          content = generateCountrySeed(data);
          filename = 'seed-countries.ts';
        } else if (options.entity === 'states') {
          if (!options.country) {
            spinner.fail('Country code required for states.');
            process.stderr.write(chalk.dim('Use --country IN') + '\n');
            process.exit(1);
          }
          const code = options.country.toUpperCase();
          const { data, usage } = await get<
            Array<{ name: string; iso2: string; country_code: string }>
          >(`/countries/${code}/states`);
          fetchUsage = usage;
          enforceTierGate(usage, spinner);
          content = generateStateSeed(data, code);
          filename = 'seed-states.ts';
        } else if (options.entity === 'cities') {
          if (!options.country || !options.state) {
            spinner.fail('Country and state codes required for cities.');
            process.stderr.write(chalk.dim('Use --country IN --state MH') + '\n');
            process.exit(1);
          }
          const countryCode = options.country.toUpperCase();
          const stateCode = options.state.toUpperCase();
          const { data, usage } = await get<Array<{ name: string }>>(
            `/countries/${countryCode}/states/${stateCode}/cities`
          );
          fetchUsage = usage;
          enforceTierGate(usage, spinner);
          content = generateCitySeed(data, countryCode, stateCode);
          filename = 'seed-cities.ts';
        } else {
          spinner.fail(`Unknown entity: ${options.entity}`);
          process.stderr.write(chalk.dim('Supported entities: countries, states, cities') + '\n');
          process.exit(1);
        }

        try {
          await mkdir(options.output, { recursive: true });
          const filepath = join(options.output, filename);
          await writeFile(filepath, content, 'utf-8');
          spinner.succeed(`Generated ${chalk.bold(filepath)}`);
        } catch (err) {
          spinner.fail('Failed to write output file.');
          process.stderr.write(chalk.red(String(err)) + '\n');
          process.exit(1);
        }

        printUsageFooter(fetchUsage, flags);
      }
    );
}
