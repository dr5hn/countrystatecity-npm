import { Command } from 'commander';
import chalk from 'chalk';
import { get } from '../lib/api.js';
import { printJson, printDetail } from '../lib/display.js';
import { printUsageFooter } from '../lib/usage-footer.js';
import { createSpinner, isTTY, promptCountry, promptState, type GlobalFlags } from '../lib/output.js';

interface CountrySummary {
  id: number;
  name: string;
  iso2: string;
  emoji?: string;
}

interface StateSummary {
  id: number;
  name: string;
  iso2: string;
}

interface CountryDetail {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  capital: string;
  phonecode: string;
  currency: string;
  currency_name: string;
  currency_symbol: string;
  region: string;
  subregion: string;
  latitude: string;
  longitude: string;
  tld: string;
  native: string;
  emoji: string;
  timezones: string;
  translations: string;
}

interface StateDetail {
  id: number;
  name: string;
  iso2: string;
  country_code: string;
  country_id: number;
  type: string | null;
  latitude: string;
  longitude: string;
}

/**
 * Safely parses a JSON string, returning the raw string on failure.
 */
function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Formats timezone data for display.
 */
function formatTimezones(raw: string): string {
  const parsed = tryParseJson(raw);
  if (!Array.isArray(parsed)) return raw;

  return parsed
    .map((tz: { zoneName?: string; abbreviation?: string; utcOffset?: string; gmtOffsetName?: string }) => {
      const offset = tz.utcOffset || tz.gmtOffsetName || '';
      const offsetStr = offset.startsWith('UTC') ? offset : `UTC${offset}`;
      return `${tz.zoneName || ''} (${tz.abbreviation || ''}, ${offsetStr})`;
    })
    .join(', ');
}

/**
 * Formats coordinates to 4 decimal places.
 */
function formatCoord(value: string): string {
  const num = parseFloat(value);
  return isNaN(num) ? value : num.toFixed(4);
}

/**
 * Registers get subcommands: country and state detail views.
 */
export function registerGetCommands(program: Command): void {
  const getCmd = program.command('get').description('Get detailed information');

  getCmd
    .command('country [iso2]')
    .description('Get detailed country information')
    .action(async (iso2: string | undefined, options: Record<string, unknown>, cmd: Command) => {
      const globalOpts = cmd.optsWithGlobals();
      const flags: GlobalFlags = {
        json: globalOpts.json ?? false,
        quiet: globalOpts.quiet ?? false,
        noFooter: globalOpts.footer === false,
      };

      let code: string;
      if (iso2) {
        code = iso2.toUpperCase();
      } else if (isTTY()) {
        const countrySpinner = await createSpinner('Loading countries...', flags);
        const { data: allCountries } = await get<CountrySummary[]>('/countries');
        countrySpinner.stop();
        code = await promptCountry(allCountries);
      } else {
        process.stderr.write(chalk.red('Country ISO2 code required. Example: csc get country IN\n'));
        process.exit(1);
        return;
      }
      const spinner = await createSpinner(`Fetching ${code}...`, flags);
      const { data, usage } = await get<CountryDetail>(`/countries/${code}`);
      spinner.stop();

      if (flags.json) {
        printJson(data);
      } else {
        printDetail('Country:', data.name);
        printDetail('ISO2:', data.iso2);
        printDetail('ISO3:', data.iso3);
        printDetail('Capital:', data.capital || 'N/A');
        printDetail('Phone Code:', `+${(data.phonecode || '').replace(/^\+/, '')}`);
        const currencyParts = [data.currency, data.currency_name, data.currency_symbol].filter(Boolean);
        printDetail('Currency:', currencyParts.length > 1
          ? `${data.currency} (${data.currency_name}) ${data.currency_symbol}`
          : data.currency || 'N/A');
        printDetail('Region:', `${data.region}${data.subregion ? ` > ${data.subregion}` : ''}`);
        printDetail('Coordinates:', `${formatCoord(data.latitude)}, ${formatCoord(data.longitude)}`);
        if (data.tld) printDetail('TLD:', data.tld);
        printDetail('Native Name:', data.native || 'N/A');
        printDetail('Flag:', data.emoji || '');
        printDetail('Timezones:', formatTimezones(data.timezones));
      }

      printUsageFooter(usage, flags);
    });

  getCmd
    .command('state [country_iso2] [state_iso2]')
    .description('Get detailed state information')
    .action(async (countryIso2: string | undefined, stateIso2: string | undefined, options: Record<string, unknown>, cmd: Command) => {
      const globalOpts = cmd.optsWithGlobals();
      const flags: GlobalFlags = {
        json: globalOpts.json ?? false,
        quiet: globalOpts.quiet ?? false,
        noFooter: globalOpts.footer === false,
      };

      let countryCode: string;
      if (countryIso2) {
        countryCode = countryIso2.toUpperCase();
      } else if (isTTY()) {
        const countrySpinner = await createSpinner('Loading countries...', flags);
        const { data: allCountries } = await get<CountrySummary[]>('/countries');
        countrySpinner.stop();
        countryCode = await promptCountry(allCountries);
      } else {
        process.stderr.write(chalk.red('Country ISO2 code required. Example: csc get state IN MH\n'));
        process.exit(1);
        return;
      }

      let stateCode: string;
      if (stateIso2) {
        stateCode = stateIso2.toUpperCase();
      } else if (isTTY()) {
        const stateSpinner = await createSpinner(`Loading states for ${countryCode}...`, flags);
        const { data: allStates } = await get<StateSummary[]>(`/countries/${countryCode}/states`);
        stateSpinner.stop();
        stateCode = await promptState(allStates);
      } else {
        process.stderr.write(chalk.red('State ISO2 code required. Example: csc get state IN MH\n'));
        process.exit(1);
        return;
      }
      const spinner = await createSpinner(`Fetching ${countryCode}/${stateCode}...`, flags);
      const { data, usage } = await get<StateDetail>(
        `/countries/${countryCode}/states/${stateCode}`
      );
      spinner.stop();

      if (flags.json) {
        printJson(data);
      } else {
        printDetail('State:', data.name);
        printDetail('ISO2:', data.iso2);
        printDetail('Country:', data.country_code);
        if (data.type) printDetail('Type:', data.type);
        if (data.latitude && data.longitude) {
          printDetail('Coordinates:', `${formatCoord(data.latitude)}, ${formatCoord(data.longitude)}`);
        }
      }

      printUsageFooter(usage, flags);
    });

  getCmd
    .command('city <country_iso2> <state_iso2> <city_id>')
    .description('Get detailed city information by ID')
    .action(async (countryIso2: string, stateIso2: string, cityId: string, options: Record<string, unknown>, cmd: Command) => {
      const globalOpts = cmd.optsWithGlobals();
      const flags: GlobalFlags = {
        json: globalOpts.json ?? false,
        quiet: globalOpts.quiet ?? false,
        noFooter: globalOpts.footer === false,
      };

      const countryCode = countryIso2.toUpperCase();
      const stateCode = stateIso2.toUpperCase();

      const spinner = await createSpinner(`Fetching city ${cityId}...`, flags);
      const { data, usage } = await get<CountryDetail>(
        `/countries/${countryCode}/states/${stateCode}/cities/${cityId}`
      );
      spinner.stop();

      if (flags.json) {
        printJson(data);
      } else {
        const city = data as unknown as { id: number; name: string; state_code: string; country_code: string; latitude: string; longitude: string };
        printDetail('City:', city.name);
        printDetail('ID:', String(city.id));
        printDetail('State:', city.state_code || stateCode);
        printDetail('Country:', city.country_code || countryCode);
        if (city.latitude && city.longitude) {
          printDetail('Coordinates:', `${formatCoord(city.latitude)}, ${formatCoord(city.longitude)}`);
        }
      }

      printUsageFooter(usage, flags);
    });
}
