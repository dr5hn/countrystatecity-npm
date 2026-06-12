import { Command } from 'commander';
import chalk from 'chalk';
import { get } from '../lib/api.js';
import { printTable, printJson } from '../lib/display.js';
import { printUsageFooter } from '../lib/usage-footer.js';
import { createSpinner, type GlobalFlags } from '../lib/output.js';

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
  country_code?: string;
}

interface City {
  id: number;
  name: string;
  state_code?: string;
  country_code?: string;
}

interface Region {
  id: number;
  name: string;
}


function resolveFlags(cmd: Command): GlobalFlags {
  const g = cmd.optsWithGlobals();
  return { json: g.json ?? false, quiet: g.quiet ?? false, noFooter: g.footer === false };
}

/**
 * Registers search subcommands: countries, states, cities, regions,
 * currencies, timezones, phonecodes, and global search.
 */
export function registerSearchCommands(program: Command): void {
  const search = program.command('search').description('Search countries, states, cities, and more');

  // ── countries ──────────────────────────────────────────────────────────────
  search
    .command('countries')
    .description('List all countries')
    .option('--filter <text>', 'Filter by name')
    .action(async (options: { filter?: string }, cmd: Command) => {
      const flags = resolveFlags(cmd);
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
        printTable(
          ['ISO2', 'ISO3', 'Name', 'Capital', 'Phone', 'Currency'],
          countries.map((c) => [
            c.iso2,
            c.iso3,
            c.name,
            c.capital || '',
            c.phonecode ? `+${c.phonecode.replace(/^\+/, '')}` : '',
            c.currency || '',
          ])
        );
      }
      printUsageFooter(usage, flags);
    });

  // ── states ─────────────────────────────────────────────────────────────────
  search
    .command('states')
    .description('List states for a country, or all states globally')
    .option('-c, --country <iso2>', 'Country ISO2 code (omit to get all states globally)')
    .option('--filter <text>', 'Filter by name')
    .action(async (options: { country?: string; filter?: string }, cmd: Command) => {
      const flags = resolveFlags(cmd);
      const code = options.country?.toUpperCase();
      const endpoint = code ? `/countries/${code}/states` : '/states';
      const spinner = await createSpinner(code ? `Fetching states for ${code}...` : 'Fetching all states...', flags);
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
        printTable(
          code ? ['ID', 'Name', 'ISO2', 'Type'] : ['ID', 'Name', 'ISO2', 'Type', 'Country'],
          states.map((s) => code
            ? [String(s.id), s.name, s.iso2 || '', s.type || '']
            : [String(s.id), s.name, s.iso2 || '', s.type || '', s.country_code || '']
          )
        );
      }
      printUsageFooter(usage, flags);
    });

  // ── cities ─────────────────────────────────────────────────────────────────
  search
    .command('cities')
    .description('List cities globally, for a country, or for a state')
    .option('-c, --country <iso2>', 'Country ISO2 code')
    .option('-s, --state <iso2>', 'State ISO2 code')
    .option('--filter <text>', 'Filter by name')
    .action(async (options: { country?: string; state?: string; filter?: string }, cmd: Command) => {
      const flags = resolveFlags(cmd);
      const countryCode = options.country?.toUpperCase();
      const stateCode = options.state?.toUpperCase();

      let endpoint: string;
      let spinnerText: string;
      if (countryCode && stateCode) {
        endpoint = `/countries/${countryCode}/states/${stateCode}/cities`;
        spinnerText = `Fetching cities for ${countryCode}/${stateCode}...`;
      } else if (countryCode) {
        endpoint = `/countries/${countryCode}/cities`;
        spinnerText = `Fetching all cities for ${countryCode}...`;
      } else {
        process.stderr.write(chalk.red('Country code required. Use --country IN\n'));
        process.stderr.write(chalk.dim('Use --state MH to filter by state.\n'));
        process.exit(1);
        return;
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
        const hasExtra = !countryCode;
        printTable(
          hasExtra ? ['ID', 'Name', 'State', 'Country'] : ['ID', 'Name'],
          cities.map((c) => hasExtra
            ? [String(c.id), c.name, c.state_code || '', c.country_code || '']
            : [String(c.id), c.name]
          )
        );
      }
      printUsageFooter(usage, flags);
    });

  // ── regions ────────────────────────────────────────────────────────────────
  search
    .command('regions')
    .description('List all world regions')
    .option('--filter <text>', 'Filter by name')
    .action(async (options: { filter?: string }, cmd: Command) => {
      const flags = resolveFlags(cmd);
      const spinner = await createSpinner('Fetching regions...', flags);
      const { data, usage } = await get<Region[]>('/regions');
      spinner.stop();

      let regions = data;
      if (options.filter) {
        const term = options.filter.toLowerCase();
        regions = regions.filter((r) => r.name.toLowerCase().includes(term));
      }

      if (flags.json) {
        printJson(regions);
      } else {
        printTable(['ID', 'Name'], regions.map((r) => [String(r.id), r.name]));
      }
      printUsageFooter(usage, flags);
    });

  // ── global search ──────────────────────────────────────────────────────────
  search
    .argument('[query]', 'Search term to match country names')
    .action(async (query: string | undefined, options: Record<string, unknown>, cmd: Command) => {
      if (!query) return;

      const flags = resolveFlags(cmd);
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
        printTable(
          ['ISO2', 'ISO3', 'Name', 'Capital', 'Phone', 'Currency'],
          matches.map((c) => [
            c.iso2,
            c.iso3,
            c.name,
            c.capital || '',
            c.phonecode ? `+${c.phonecode.replace(/^\+/, '')}` : '',
            c.currency || '',
          ])
        );
      }

      if (!flags.json) {
        process.stderr.write(
          chalk.dim('\nTip: Use `csc search states --country IN` to search within a country') + '\n'
        );
      }
      printUsageFooter(usage, flags);
    });
}
