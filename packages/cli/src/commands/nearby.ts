import { Command } from 'commander';
import chalk from 'chalk';
import { searchNearby } from '../lib/api.js';
import { printTable, printJson } from '../lib/display.js';
import { printUsageFooter } from '../lib/usage-footer.js';
import { createSpinner, type GlobalFlags } from '../lib/output.js';
import type { CityKind, INearbyResult, SearchResultType } from '@countrystatecity/sdk';

function parseFloatOption(value: string, label: string): number {
  if (value.trim() === '') {
    process.stderr.write(chalk.red(`${label} must be a number, got an empty value.`) + '\n');
    process.exit(1);
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    process.stderr.write(chalk.red(`${label} must be a number, got "${value}".`) + '\n');
    process.exit(1);
  }
  return n;
}

function displayName(result: INearbyResult): string {
  return result.name ?? '';
}

function displayCountry(result: INearbyResult): string {
  if (result.type === 'country') return result.iso2 ?? '';
  return result.country_name;
}

function displayState(result: INearbyResult): string {
  if (result.type === 'city') return result.state_name ?? '';
  return '';
}

/**
 * Registers the top-level `nearby` command — a distinct command (not nested
 * under `search`) matching the endpoint's own standalone nature: no text
 * query, just coordinates plus the same type/country/state filters as
 * autocomplete.
 */
export function registerNearbyCommand(program: Command): void {
  program
    .command('nearby')
    .description('Find countries, states, or cities near a coordinate, nearest-first')
    .requiredOption('--lat <latitude>', 'Latitude (-90 to 90)')
    .requiredOption('--lng <longitude>', 'Longitude (-180 to 180)')
    .option('-t, --type <type>', 'Entity type: country, state, or city', 'city')
    .option('-k, --kind <kind>', 'City kind: settlement, administrative, section, or unknown')
    .option('-c, --country <iso2>', 'Country ISO2 filter (invalid when --type=country)')
    .option('-s, --state <iso2>', 'State ISO2 filter (requires --country)')
    .option('--min-population <n>', 'Minimum population filter')
    .option('-r, --radius <km>', 'Search radius in km (1-500)', '25')
    .option('-l, --limit <n>', 'Result limit (1-100)', '20')
    .action(
      async (
        options: {
          lat: string;
          lng: string;
          type: string;
          kind?: string;
          country?: string;
          state?: string;
          minPopulation?: string;
          radius: string;
          limit: string;
        },
        cmd: Command
      ) => {
        const globalOpts = cmd.optsWithGlobals();
        const flags: GlobalFlags = {
          json: globalOpts.json ?? false,
          quiet: globalOpts.quiet ?? false,
          noFooter: globalOpts.footer === false,
        };

        const lat = parseFloatOption(options.lat, 'lat');
        const lng = parseFloatOption(options.lng, 'lng');
        const radius = parseFloatOption(options.radius, 'radius');
        const limit = parseFloatOption(options.limit, 'limit');
        const minPopulation =
          options.minPopulation !== undefined ? parseFloatOption(options.minPopulation, 'min-population') : undefined;

        const spinner = await createSpinner('Searching nearby...', flags);
        const { data, usage } = await searchNearby({
          lat,
          lng,
          type: options.type.trim().toLowerCase() as SearchResultType,
          kind: options.kind?.trim().toLowerCase() as CityKind | undefined,
          country: options.country,
          state: options.state,
          minPopulation,
          radius,
          limit,
        });
        spinner.stop();

        if (flags.json) {
          printJson(data);
        } else if (data.length === 0) {
          console.log(chalk.yellow('No nearby results found.'));
        } else {
          printTable(
            ['Name', 'Type', 'Country', 'State', 'Distance (km)'],
            data.map((r) => [displayName(r), r.type, displayCountry(r), displayState(r), r.distance_km.toFixed(2)])
          );
        }

        printUsageFooter(usage, flags);
      }
    );
}
