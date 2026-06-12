import { Command } from 'commander';
import select from '@inquirer/select';
import search from '@inquirer/search';
import { get } from '../lib/api.js';
import { printTable, printJson } from '../lib/display.js';
import { printUsageFooter } from '../lib/usage-footer.js';
import { stderr, type GlobalFlags } from '../lib/output.js';
import type { UsageInfo } from '../lib/api.js';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface Country {
  id: number;
  name: string;
  iso2: string;
  emoji: string;
}

interface State {
  id: number;
  name: string;
  iso2: string;
}

interface City {
  id: number;
  name: string;
}

/** Sentinel value returned when the user picks "Go back" from the action menu. */
const ACTION_BACK = 'back' as const;

type Action =
  | 'cities'
  | 'country-detail'
  | 'state-detail'
  | 'generate-dropdown'
  | 'generate-seed'
  | typeof ACTION_BACK;

// ---------------------------------------------------------------------------
// Prompt helpers
// ---------------------------------------------------------------------------

/**
 * Presents a fuzzy-searchable country picker and returns the selected ISO2 code.
 *
 * Displays each country as `{emoji} {name} ({iso2})` so users can type any
 * part of the label to narrow the list.
 *
 * @param countries - Full list of countries to populate the picker.
 * @returns         ISO2 code of the chosen country.
 */
async function promptCountry(countries: Country[]): Promise<string> {
  return search<string>({
    message: 'Select a country',
    source: (input) => {
      const query = (input ?? '').toLowerCase();
      return Promise.resolve(
        countries
          .filter(
            (c) =>
              c.name.toLowerCase().includes(query) ||
              c.iso2.toLowerCase().includes(query)
          )
          .map((c) => ({
            name: `${c.emoji}  ${c.name} (${c.iso2})`,
            value: c.iso2,
          }))
      );
    },
  });
}

/**
 * Presents a fuzzy-searchable state picker and returns the selected ISO2 code.
 *
 * Displays each state by name. When a state has no ISO2 code an empty string
 * is shown in its place.
 *
 * @param states - List of states for the chosen country.
 * @returns      ISO2 code of the chosen state (may be empty string).
 */
async function promptState(states: State[]): Promise<string> {
  return search<string>({
    message: 'Select a state',
    source: (input) => {
      const query = (input ?? '').toLowerCase();
      return Promise.resolve(
        states
          .filter(
            (s) =>
              s.name.toLowerCase().includes(query) ||
              (s.iso2 ?? '').toLowerCase().includes(query)
          )
          .map((s) => ({ name: s.name, value: s.iso2 ?? '' }))
      );
    },
  });
}

/**
 * Presents an action menu for a selected country/state combination and returns
 * the chosen action key.
 *
 * @param countryIso - ISO2 of the current country (used in menu labels).
 * @param stateName  - Display name of the current state (used in menu labels).
 * @returns          One of the typed `Action` string literals.
 */
async function promptAction(countryIso: string, stateName: string): Promise<Action> {
  return select<Action>({
    message: `Actions for ${countryIso} / ${stateName}`,
    choices: [
      { name: 'View cities', value: 'cities' },
      { name: 'View country details', value: 'country-detail' },
      { name: 'View state details', value: 'state-detail' },
      { name: 'Generate dropdown (hint)', value: 'generate-dropdown' },
      { name: 'Generate seed (hint)', value: 'generate-seed' },
      { name: 'Go back', value: ACTION_BACK },
    ],
  });
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

/**
 * Fetches and displays all cities for the given country/state pair as a table.
 *
 * @param countryIso - ISO2 code of the parent country.
 * @param stateIso   - ISO2 code of the parent state.
 * @returns          The usage info returned by the API call.
 */
async function handleViewCities(
  countryIso: string,
  stateIso: string
): Promise<UsageInfo | null> {
  const { data: cities, usage } = await get<City[]>(
    `/countries/${countryIso}/states/${stateIso}/cities`
  );

  if (cities.length === 0) {
    stderr('No cities found for this state.');
    return usage;
  }

  const rows = cities.map((c) => [String(c.id), c.name]);
  printTable(['ID', 'Name'], rows);
  return usage;
}

/**
 * Fetches and displays full details for a country as pretty-printed JSON.
 *
 * @param countryIso - ISO2 code of the country to display.
 * @returns          The usage info returned by the API call.
 */
async function handleCountryDetail(countryIso: string): Promise<UsageInfo | null> {
  const { data, usage } = await get<Country>(`/countries/${countryIso}`);
  printJson(data);
  return usage;
}

/**
 * Fetches and displays full details for a state as pretty-printed JSON.
 *
 * @param countryIso - ISO2 code of the parent country.
 * @param stateIso   - ISO2 code of the state to display.
 * @returns          The usage info returned by the API call.
 */
async function handleStateDetail(
  countryIso: string,
  stateIso: string
): Promise<UsageInfo | null> {
  const { data, usage } = await get<State>(
    `/countries/${countryIso}/states/${stateIso}`
  );
  printJson(data);
  return usage;
}

/**
 * Prints a hint command for generating a dropdown component to stderr.
 *
 * No API call is made; this simply shows the user the equivalent `csc generate`
 * invocation they can copy-paste.
 *
 * @param countryIso - ISO2 code to embed in the hint command.
 */
function handleGenerateDropdown(countryIso: string): void {
  stderr(`Run: csc generate dropdown -e states -f react -c ${countryIso}`);
}

/**
 * Prints a hint command for generating a seed file to stderr.
 *
 * No API call is made; this simply shows the user the equivalent `csc generate`
 * invocation they can copy-paste.
 *
 * @param countryIso - ISO2 code to embed in the hint command.
 */
function handleGenerateSeed(countryIso: string): void {
  stderr(`Run: csc generate seed -e states -f prisma -c ${countryIso}`);
}

// ---------------------------------------------------------------------------
// Main explore flow
// ---------------------------------------------------------------------------

/**
 * Core interactive geographic browser session.
 *
 * Guides the user through country → state → action selection and loops on
 * the action menu until "Go back" is chosen.  The last captured `UsageInfo`
 * is returned so the caller can print the footer.
 *
 * @param flags - Global CLI flags forwarded from the parent command.
 * @returns     The most recent `UsageInfo` from any API call, or null.
 */
async function runExploreSession(flags: GlobalFlags): Promise<UsageInfo | null> {
  // Step 1 – Fetch all countries
  const { data: countries, usage: countriesUsage } = await get<Country[]>('/countries');
  let latestUsage: UsageInfo | null = countriesUsage;

  // Step 2 – Country selection
  const countryIso = await promptCountry(countries);

  // Step 3 – Fetch states for the chosen country
  const { data: states, usage: statesUsage } = await get<State[]>(
    `/countries/${countryIso}/states`
  );
  latestUsage = statesUsage ?? latestUsage;

  if (states.length === 0) {
    stderr(`No states found for ${countryIso}.`);
    return latestUsage;
  }

  // Step 4 – State selection
  const stateIso = await promptState(states);
  const selectedState = states.find((s) => s.iso2 === stateIso);
  const stateName = selectedState?.name ?? stateIso;

  // Step 5 – Action loop
  let running = true;
  while (running) {
    const action = await promptAction(countryIso, stateName);

    if (action === ACTION_BACK) {
      running = false;
      break;
    }

    if (action === 'cities') {
      const usage = await handleViewCities(countryIso, stateIso);
      latestUsage = usage ?? latestUsage;
    } else if (action === 'country-detail') {
      const usage = await handleCountryDetail(countryIso);
      latestUsage = usage ?? latestUsage;
    } else if (action === 'state-detail') {
      const usage = await handleStateDetail(countryIso, stateIso);
      latestUsage = usage ?? latestUsage;
    } else if (action === 'generate-dropdown') {
      handleGenerateDropdown(countryIso);
    } else if (action === 'generate-seed') {
      handleGenerateSeed(countryIso);
    }
  }

  return latestUsage;
}

// ---------------------------------------------------------------------------
// Command registration
// ---------------------------------------------------------------------------

/**
 * Registers the `explore` command on the root Commander program.
 *
 * The command launches an interactive geographic data browser that lets users
 * pick a country, then a state, and then perform various actions (view cities,
 * view details, or generate code hints).  It requires an interactive TTY; if
 * stdin is not a TTY the command exits with a non-zero status code and prints
 * an error to stderr.
 *
 * @param program - The root Commander instance to attach the command to.
 */
export function registerExploreCommand(program: Command): void {
  program
    .command('explore')
    .description('Interactive geographic data browser')
    .action(async (_options: unknown, cmd: Command) => {
      // Precondition: must be running in an interactive terminal
      if (!process.stdin.isTTY) {
        stderr('Error: `csc explore` requires an interactive terminal (TTY).');
        stderr('Use `csc search` for non-interactive workflows.');
        process.exit(1);
      }

      const globalOpts = cmd.optsWithGlobals();
      const flags: GlobalFlags = {
        json: globalOpts.json ?? false,
        quiet: globalOpts.quiet ?? false,
        noFooter: globalOpts.footer === false,
      };

      const usage = await runExploreSession(flags);
      printUsageFooter(usage, flags);
    });
}
