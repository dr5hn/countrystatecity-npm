import { Command } from 'commander';
import chalk from 'chalk';
import { get, searchFuzzy } from '../lib/api.js';
import { printTable, printJson } from '../lib/display.js';
import { printUsageFooter } from '../lib/usage-footer.js';
import { createSpinner, type GlobalFlags } from '../lib/output.js';
import type { ISearchResult, SearchResultType } from '@countrystatecity/sdk';

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
 * Renders a location hint for a fuzzy-search hit — country name for
 * states, "state, country" for cities, nothing extra for countries.
 */
function formatLocation(result: ISearchResult): string {
  if (result.type === 'city') {
    return [result.state_name, result.country_name].filter(Boolean).join(', ');
  }
  if (result.type === 'state') {
    return result.country_name ?? '';
  }
  return '';
}

/** Shared renderer for csc.search.fuzzy() results — table or --json. */
function printFuzzyResults(results: ISearchResult[], flags: GlobalFlags): void {
  if (flags.json) {
    printJson(results);
    return;
  }
  if (results.length === 0) {
    console.log(chalk.yellow('No matches found.'));
    return;
  }
  printTable(
    ['Type', 'Name', 'Location', 'ID', 'Score'],
    results.map((r) => [
      r.type,
      r.name ?? '',
      formatLocation(r),
      r.id !== undefined ? String(r.id) : '',
      r.match_score.toFixed(2),
    ])
  );
}

/**
 * Fallback renderer used when --fields narrows the response to a caller-chosen
 * subset — the fixed per-entity columns below no longer apply, since the
 * returned objects may be missing any of those hardcoded fields.
 */
function printGenericTable(rows: Record<string, unknown>[]): void {
  if (rows.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }
  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  printTable(
    columns,
    rows.map((r) => columns.map((c) => {
      const value = r[c];
      if (value === null || value === undefined) return '';
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }))
  );
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
    .option('--fuzzy', 'Use server-side fuzzy/typo-tolerant search on --filter (Professional+ plan)')
    .option('--fields <fields>', 'Comma-separated fields to return, e.g. name,iso2 (Supporter+ plan)')
    .option('--sort <sort>', 'Comma-separated field:asc|desc sort, e.g. name:asc (Supporter+ plan)')
    .action(async (options: { filter?: string; fuzzy?: boolean; fields?: string; sort?: string }, cmd: Command) => {
      const flags = resolveFlags(cmd);

      if (options.fuzzy) {
        if (!options.filter) {
          process.stderr.write(chalk.red('--fuzzy requires --filter <text> to search for.\n'));
          process.exit(1);
        }
        const spinner = await createSpinner('Searching...', flags);
        const { data, usage } = await searchFuzzy({ query: options.filter, type: 'country' });
        spinner.stop();
        printFuzzyResults(data, flags);
        printUsageFooter(usage, flags);
        return;
      }

      const spinner = await createSpinner('Fetching countries...', flags);
      const { data, usage } = await get<Country[]>('/countries', { fields: options.fields, sort: options.sort });
      spinner.stop();

      let countries = data;
      if (options.filter) {
        const term = options.filter.toLowerCase();
        countries = countries.filter((c) => c.name.toLowerCase().includes(term));
      }

      if (flags.json) {
        printJson(countries);
      } else if (options.fields) {
        printGenericTable(countries as unknown as Record<string, unknown>[]);
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
    .option('--fuzzy', 'Use server-side fuzzy/typo-tolerant search on --filter (Professional+ plan)')
    .option('--fields <fields>', 'Comma-separated fields to return, e.g. name,iso2 (Supporter+ plan)')
    .option('--sort <sort>', 'Comma-separated field:asc|desc sort, e.g. name:asc (Supporter+ plan)')
    .action(async (options: { country?: string; filter?: string; fuzzy?: boolean; fields?: string; sort?: string }, cmd: Command) => {
      const flags = resolveFlags(cmd);
      const code = options.country?.toUpperCase();

      if (options.fuzzy) {
        if (!options.filter) {
          process.stderr.write(chalk.red('--fuzzy requires --filter <text> to search for.\n'));
          process.exit(1);
        }
        const spinner = await createSpinner('Searching...', flags);
        const { data, usage } = await searchFuzzy({ query: options.filter, type: 'state', country: code });
        spinner.stop();
        printFuzzyResults(data, flags);
        printUsageFooter(usage, flags);
        return;
      }

      const endpoint = code ? `/countries/${code}/states` : '/states';
      const spinner = await createSpinner(code ? `Fetching states for ${code}...` : 'Fetching all states...', flags);
      const { data, usage } = await get<State[]>(endpoint, { fields: options.fields, sort: options.sort });
      spinner.stop();

      let states = data;
      if (options.filter) {
        const term = options.filter.toLowerCase();
        states = states.filter((s) => s.name.toLowerCase().includes(term));
      }

      if (flags.json) {
        printJson(states);
      } else if (options.fields) {
        printGenericTable(states as unknown as Record<string, unknown>[]);
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
    .option('-s, --state <iso2>', 'State ISO2 code (ignored with --fuzzy — fuzzy search only scopes by country)')
    .option('--filter <text>', 'Filter by name')
    .option('--fuzzy', 'Use server-side fuzzy/typo-tolerant search on --filter (Professional+ plan)')
    .option('--fields <fields>', 'Comma-separated fields to return, e.g. name,population (Supporter+ plan)')
    .option('--sort <sort>', 'Comma-separated field:asc|desc sort, e.g. population:desc (Supporter+ plan)')
    .action(async (options: { country?: string; state?: string; filter?: string; fuzzy?: boolean; fields?: string; sort?: string }, cmd: Command) => {
      const flags = resolveFlags(cmd);
      const countryCode = options.country?.toUpperCase();
      const stateCode = options.state?.toUpperCase();

      if (options.fuzzy) {
        if (!options.filter) {
          process.stderr.write(chalk.red('--fuzzy requires --filter <text> to search for.\n'));
          process.exit(1);
        }
        const spinner = await createSpinner('Searching...', flags);
        const { data, usage } = await searchFuzzy({ query: options.filter, type: 'city', country: countryCode });
        spinner.stop();
        printFuzzyResults(data, flags);
        printUsageFooter(usage, flags);
        return;
      }

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
      const { data, usage } = await get<City[]>(endpoint, { fields: options.fields, sort: options.sort });
      spinner.stop();

      let cities = data;
      if (options.filter) {
        const term = options.filter.toLowerCase();
        cities = cities.filter((c) => c.name.toLowerCase().includes(term));
      }

      if (flags.json) {
        printJson(cities);
      } else if (options.fields) {
        printGenericTable(cities as unknown as Record<string, unknown>[]);
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
  // A separate `isDefault` subcommand, not options on `search` itself —
  // Commander loses a child subcommand's option value when the parent
  // command declares an option with the same long name (confirmed via a
  // minimal repro: `search`'s own --country silently blanked out
  // `search states --country IN`'s --country). Keeping `search` itself
  // option-free avoids that entirely.
  search
    .command('query [query]', { isDefault: true, hidden: true })
    .description('Search term to match country names (or any --type with --fuzzy)')
    .option('--fuzzy', 'Use server-side fuzzy/typo-tolerant search (Professional+ plan)')
    .option('-t, --type <type>', 'Entity type for --fuzzy: country, state, or city', 'city')
    .option('-c, --country <iso2>', 'Country ISO2 code to scope --fuzzy results (not used with --type country)')
    .action(async (query: string | undefined, options: { fuzzy?: boolean; type?: string; country?: string }, cmd: Command) => {
      if (!query) return;

      const flags = resolveFlags(cmd);

      if (options.fuzzy) {
        const type = (options.type ?? 'city') as SearchResultType;
        const spinner = await createSpinner('Searching...', flags);
        const { data, usage } = await searchFuzzy({ query, type, country: options.country?.toUpperCase() });
        spinner.stop();
        printFuzzyResults(data, flags);
        printUsageFooter(usage, flags);
        return;
      }

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
          chalk.dim('\nTip: Use `csc search states --country IN` to search within a country, or add --fuzzy for typo-tolerant search') + '\n'
        );
      }
      printUsageFooter(usage, flags);
    });
}
