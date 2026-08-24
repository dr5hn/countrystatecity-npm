import { Command } from 'commander';
import chalk from 'chalk';
import { access, mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
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
import {
  BROWSER_KEY_WARNING,
  generateAutocompleteRoute,
  generateEnvExample,
  generateAutocompleteComponentNextjs,
  generateAutocompleteComponentBrowser,
  generateLocationPickerComponentNextjs,
  generateLocationPickerComponentBrowser,
  generateAutocompleteReadme,
  generateLocationPickerReadme,
  type GeneratorTarget,
} from '../templates/location-components.js';

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
 * Validates a --target value, exiting with an actionable error if invalid.
 */
function resolveTarget(target: string): GeneratorTarget {
  if (target !== 'nextjs' && target !== 'react-browser') {
    process.stderr.write(chalk.red(`Unknown target: ${target}`) + '\n');
    process.stderr.write(chalk.dim('Supported targets: nextjs, react-browser') + '\n');
    process.exit(1);
  }
  return target;
}

/**
 * Writes a set of generated files (creating parent directories as needed)
 * and prints a summary. Unlike dropdown/seed, autocomplete/location-picker
 * generate live components with no data to embed, so there's no API call
 * (and no usage footer) here — generation works fully offline.
 */
async function writeGeneratedFiles(
  outputDir: string,
  files: Array<{ path: string; content: string }>,
  flags: GlobalFlags
): Promise<void> {
  const targets = files.map((file) => join(outputDir, file.path));
  const existing: string[] = [];
  for (const filepath of targets) {
    try {
      await access(filepath);
      existing.push(filepath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        process.stderr.write(chalk.red(`Cannot inspect target file: ${filepath}`) + '\n');
        process.exit(1);
      }
    }
  }
  if (existing.length > 0) {
    process.stderr.write(chalk.red('Refusing to overwrite existing files:') + '\n');
    for (const filepath of existing) process.stderr.write(chalk.dim(`  ${filepath}`) + '\n');
    process.exit(1);
  }

  const written: string[] = [];
  try {
    for (const file of files) {
      const filepath = join(outputDir, file.path);
      await mkdir(dirname(filepath), { recursive: true });
      await writeFile(filepath, file.content, { encoding: 'utf-8', flag: 'wx' });
      written.push(filepath);
      if (!flags.quiet && !flags.json) {
        console.log(chalk.green('✓'), chalk.dim(filepath));
      }
    }
  } catch (err) {
    process.stderr.write(chalk.red('Failed to write generated files.') + '\n');
    process.stderr.write(chalk.red(String(err)) + '\n');
    process.exit(1);
  }

  if (flags.json) {
    process.stdout.write(JSON.stringify({ files: written }) + '\n');
  } else if (!flags.quiet) {
    console.log(chalk.bold(`\nGenerated ${written.length} file(s) in ${outputDir}`));
  }
}

/**
 * Registers generate subcommands: dropdown, seed, autocomplete, location-picker.
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

  generate
    .command('autocomplete')
    .description('Generate a live location-autocomplete component that calls the API as the user types')
    .requiredOption('-t, --target <target>', 'Target: nextjs or react-browser')
    .option('-o, --output <dir>', 'Output directory', process.cwd())
    .action(async (options: { target: string; output: string }, cmd: Command) => {
      const globalOpts = cmd.optsWithGlobals();
      const flags: GlobalFlags = {
        json: globalOpts.json ?? false,
        quiet: globalOpts.quiet ?? false,
        noFooter: globalOpts.footer === false,
      };

      const target = resolveTarget(options.target);

      if (target === 'react-browser' && !flags.quiet && !flags.json) {
        process.stderr.write('\n' + chalk.yellow(`⚠ ${BROWSER_KEY_WARNING}`) + '\n\n');
      }

      const files: Array<{ path: string; content: string }> =
        target === 'nextjs'
          ? [
              { path: 'app/api/csc-search/route.ts', content: generateAutocompleteRoute() },
              { path: 'components/LocationAutocomplete.tsx', content: generateAutocompleteComponentNextjs() },
            ]
          : [{ path: 'components/LocationAutocomplete.tsx', content: generateAutocompleteComponentBrowser() }];

      files.push({ path: '.env.example', content: generateEnvExample(target) });
      files.push({ path: 'CSC-AUTOCOMPLETE-README.md', content: generateAutocompleteReadme(target) });

      await writeGeneratedFiles(options.output, files, flags);
    });

  generate
    .command('location-picker')
    .description('Generate a cascading country/state/city picker that calls the API as the user types')
    .requiredOption('-t, --target <target>', 'Target: nextjs or react-browser')
    .option('-o, --output <dir>', 'Output directory', process.cwd())
    .action(async (options: { target: string; output: string }, cmd: Command) => {
      const globalOpts = cmd.optsWithGlobals();
      const flags: GlobalFlags = {
        json: globalOpts.json ?? false,
        quiet: globalOpts.quiet ?? false,
        noFooter: globalOpts.footer === false,
      };

      const target = resolveTarget(options.target);

      if (target === 'react-browser' && !flags.quiet && !flags.json) {
        process.stderr.write('\n' + chalk.yellow(`⚠ ${BROWSER_KEY_WARNING}`) + '\n\n');
      }

      const files: Array<{ path: string; content: string }> =
        target === 'nextjs'
          ? [
              { path: 'app/api/csc-search/route.ts', content: generateAutocompleteRoute() },
              { path: 'components/LocationPicker.tsx', content: generateLocationPickerComponentNextjs() },
            ]
          : [{ path: 'components/LocationPicker.tsx', content: generateLocationPickerComponentBrowser() }];

      files.push({ path: '.env.example', content: generateEnvExample(target) });
      files.push({ path: 'CSC-LOCATION-PICKER-README.md', content: generateLocationPickerReadme(target) });

      await writeGeneratedFiles(options.output, files, flags);
    });
}
