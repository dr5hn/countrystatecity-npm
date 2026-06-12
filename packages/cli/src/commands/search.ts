import { Command } from 'commander';
import chalk from 'chalk';
import { get } from '../lib/api.js';
import { printTable, printJson } from '../lib/display.js';
import { printUsageFooter } from '../lib/usage-footer.js';
import { createSpinner, isTTY, promptCountry, promptState, type GlobalFlags } from '../lib/output.js';

interface Country {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  capital: string;
  phonecode: string;
  currency: string;
}

interface State {
  id: number;
  name: string;
  iso2: string;
  type: string | null;
}

interface City {
  id: number;
  name: string;
}

/**
 * Registers search subcommands: countries, states, cities, and global search.
 */
export function registerSearchCommands(program: Command): void {
  const search = program.command('search').description('Search countries, states, and cities');

  search
    .command('countries')
    .description('List all countries')
    .option('--filter <text>', 'Filter by name')
    .action(async (options: { filter?: string }, cmd: Command) => {
      const globalOpts = cmd.optsWithGlobals();
      const flags: GlobalFlags = {
        json: globalOpts.json ?? false,
        quiet: globalOpts.quiet ?? false,
        noFooter: globalOpts.footer === false,
      };

      const spinner = await createSpinner('Fetching countries...', flags);
      const { data, usage } = await get<Country[]>('/countries');
      spinner.stop();

      let countries = data;
      if (options.filter) {
        const term = options.filter.toLowerCase();
        countries = countries.filter((c) => c.name.toLowerCase().includes(term));
      }

      if (flags.json) {
        printJson(countries);
      } else {
        const rows = countries.map((c) => [
          c.iso2,
          c.iso3,
          c.name,
          c.capital || '',
          c.phonecode ? `+${c.phonecode.replace(/^\+/, '')}` : '',
          c.currency || '',
        ]);
        printTable(['ISO2', 'ISO3', 'Name', 'Capital', 'Phone', 'Currency'], rows);
      }

      printUsageFooter(usage, flags);
    });

  search
    .command('states')
    .description('List states for a country, or all states globally')
    .option('-c, --country <iso2>', 'Country ISO2 code (omit to get all states globally)')
    .option('--filter <text>', 'Filter by name')
    .action(async (options: { country?: string; filter?: string }, cmd: Command) => {
      const globalOpts = cmd.optsWithGlobals();
      const flags: GlobalFlags = {
        json: globalOpts.json ?? false,
        quiet: globalOpts.quiet ?? false,
        noFooter: globalOpts.footer === false,
      };

      const code = options.country?.toUpperCase();

      let endpoint: string;
      let spinnerText: string;
      if (code) {
        endpoint = `/countries/${code}/states`;
        spinnerText = `Fetching states for ${code}...`;
      } else {
        endpoint = '/states';
        spinnerText = 'Fetching all states...';
      }

      const spinner = await createSpinner(spinnerText, flags);
      const { data, usage } = await get<State[]>(endpoint);
      spinner.stop();

      let states = data;
      if (options.filter) {
        const term = options.filter.toLowerCase();
        states = states.filter((s) => s.name.toLowerCase().includes(term));
      }

      if (flags.json) {
        printJson(states);
      } else {
        const rows = states.map((s) => [
          String(s.id),
          s.name,
          s.iso2 || '',
          s.type || '',
        ]);
        printTable(['ID', 'Name', 'ISO2', 'Type'], rows);
      }

      printUsageFooter(usage, flags);
    });

  search
    .command('cities')
    .description('List cities for a country or state')
    .option('-c, --country <iso2>', 'Country ISO2 code')
    .option('-s, --state <iso2>', 'State ISO2 code (omit to get all cities in the country)')
    .option('--filter <text>', 'Filter by name')
    .action(
      async (options: { country?: string; state?: string; filter?: string }, cmd: Command) => {
        const globalOpts = cmd.optsWithGlobals();
        const flags: GlobalFlags = {
          json: globalOpts.json ?? false,
          quiet: globalOpts.quiet ?? false,
          noFooter: globalOpts.footer === false,
        };

        let countryCode = options.country?.toUpperCase();
        if (!countryCode) {
          if (isTTY()) {
            const countrySpinner = await createSpinner('Loading countries...', flags);
            const { data: allCountries } = await get<Country[]>('/countries');
            countrySpinner.stop();
            countryCode = await promptCountry(allCountries);
          } else {
            process.stderr.write(chalk.red('Country code required. Use --country IN\n'));
            process.exit(1);
            return;
          }
        }

        const stateCode = options.state?.toUpperCase();

        let endpoint: string;
        let spinnerText: string;
        if (stateCode) {
          endpoint = `/countries/${countryCode}/states/${stateCode}/cities`;
          spinnerText = `Fetching cities for ${countryCode}/${stateCode}...`;
        } else {
          endpoint = `/countries/${countryCode}/cities`;
          spinnerText = `Fetching all cities for ${countryCode}...`;
        }

        const spinner = await createSpinner(spinnerText, flags);
        const { data, usage } = await get<City[]>(endpoint);
        spinner.stop();

        let cities = data;
        if (options.filter) {
          const term = options.filter.toLowerCase();
          cities = cities.filter((c) => c.name.toLowerCase().includes(term));
        }

        if (flags.json) {
          printJson(cities);
        } else {
          const rows = cities.map((c) => [String(c.id), c.name]);
          printTable(['ID', 'Name'], rows);
        }

        printUsageFooter(usage, flags);
      }
    );

  // Global search — searches countries by name
  search
    .argument('[query]', 'Search term to match country names')
    .action(async (query: string | undefined, options: Record<string, unknown>, cmd: Command) => {
      // Only handle when no subcommand matched (i.e., direct `csc search <query>`)
      if (!query) return;

      const globalOpts = cmd.optsWithGlobals();
      const flags: GlobalFlags = {
        json: globalOpts.json ?? false,
        quiet: globalOpts.quiet ?? false,
        noFooter: globalOpts.footer === false,
      };

      const spinner = await createSpinner('Searching...', flags);
      const { data, usage } = await get<Country[]>('/countries');
      spinner.stop();

      const term = query.toLowerCase();
      const matches = data.filter((c) => c.name.toLowerCase().includes(term));

      if (flags.json) {
        printJson(matches);
      } else if (matches.length === 0) {
        console.log(chalk.yellow(`No countries matching "${query}".`));
      } else {
        const rows = matches.map((c) => [
          c.iso2,
          c.iso3,
          c.name,
          c.capital || '',
          c.phonecode ? `+${c.phonecode.replace(/^\+/, '')}` : '',
          c.currency || '',
        ]);
        printTable(['ISO2', 'ISO3', 'Name', 'Capital', 'Phone', 'Currency'], rows);
      }

      if (!flags.json) {
        process.stderr.write(
          chalk.dim('\nTip: Use `csc search states --country IN` to search within a country') + '\n'
        );
      }
      printUsageFooter(usage, flags);
    });
}
