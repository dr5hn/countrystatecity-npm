/**
 * Output routing module.
 *
 * Provides utilities for writing to stderr, creating spinner instances, and
 * displaying interactive search prompts.  All user-facing diagnostic output
 * (spinners, errors, progress) is routed to stderr so that stdout remains
 * clean for machine-readable data such as JSON.
 */

import search from '@inquirer/search';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * CLI-wide flags that influence output behaviour.
 *
 * - `json`     – Suppress interactive UI; emit only machine-readable JSON.
 * - `quiet`    – Suppress all non-essential output including spinners.
 * - `noFooter` – Omit the usage-stats footer appended after each response.
 */
export interface GlobalFlags {
  json: boolean;
  quiet: boolean;
  noFooter: boolean;
}

/**
 * Minimal spinner interface shared by both the real ora spinner and the noop
 * implementation returned when running in JSON/quiet mode.
 */
export interface Spinner {
  /** Start the spinner, optionally updating its text. Returns `this` for chaining. */
  start(text?: string): Spinner;
  /** Stop and clear the spinner. */
  stop(): void;
  /** Stop the spinner with a success symbol. */
  succeed(text?: string): void;
  /** Stop the spinner with a failure symbol. */
  fail(text?: string): void;
  /** Current spinner label text. */
  text: string;
}

// ---------------------------------------------------------------------------
// stderr
// ---------------------------------------------------------------------------

/**
 * Writes `message` followed by a newline to `process.stderr`.
 *
 * Use this for all diagnostic, status, and error output so that stdout
 * remains reserved for structured/machine-readable data.
 *
 * @param message - The text to emit on stderr.
 */
export function stderr(message: string): void {
  process.stderr.write(message + '\n');
}

// ---------------------------------------------------------------------------
// createSpinner
// ---------------------------------------------------------------------------

/**
 * Factory that creates an appropriate spinner for the current output mode.
 *
 * When `flags.quiet` or `flags.json` is true the function returns a no-op
 * spinner whose methods are all silent, preventing any terminal control codes
 * from appearing in piped or scripted output.
 *
 * In interactive mode the real `ora` package is dynamically imported (so it
 * is only loaded when actually needed) and a spinner writing to `stderr` is
 * returned already started.
 *
 * @param text  - Initial label text to display alongside the spinner.
 * @param flags - Global CLI flags used to determine output mode.
 * @returns     A `Spinner` instance, either real or no-op.
 */
export async function createSpinner(text: string, flags: GlobalFlags): Promise<Spinner> {
  if (flags.quiet || flags.json) {
    return buildNoopSpinner(text);
  }

  const ora = (await import('ora')).default;
  const spinner = ora({ text, stream: process.stderr });
  spinner.start();

  // ora's spinner satisfies the Spinner interface; cast via unknown to avoid
  // structural-mismatch noise from ora's more complex type definitions.
  return spinner as unknown as Spinner;
}

// ---------------------------------------------------------------------------
// isTTY
// ---------------------------------------------------------------------------

/**
 * Returns whether stdin is attached to an interactive TTY.
 *
 * Commands that launch interactive prompts should call this first and fall
 * back to accepting arguments from the CLI when running non-interactively.
 *
 * @returns `true` when `process.stdin.isTTY` is truthy, `false` otherwise.
 */
export function isTTY(): boolean {
  return !!process.stdin.isTTY;
}

// ---------------------------------------------------------------------------
// Prompt helpers
// ---------------------------------------------------------------------------

/**
 * Presents a fuzzy-searchable list of countries and returns the selected
 * country's ISO2 code.
 *
 * Uses `@inquirer/search` for a typed, filterable select experience.  This
 * function requires an interactive TTY; callers should guard with `isTTY()`.
 *
 * @param countries - Array of country objects to populate the picker.
 * @returns         The ISO2 code of the country chosen by the user.
 */
export async function promptCountry(
  countries: Array<{ name: string; iso2: string; emoji?: string }>
): Promise<string> {
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
            name: c.emoji ? `${c.emoji}  ${c.name}` : c.name,
            value: c.iso2,
          }))
      );
    },
  });
}

/**
 * Presents a fuzzy-searchable list of states and returns the selected
 * state's ISO2 code.
 *
 * Uses `@inquirer/search` for a typed, filterable select experience.  This
 * function requires an interactive TTY; callers should guard with `isTTY()`.
 *
 * @param states - Array of state objects to populate the picker.
 * @returns      The ISO2 code of the state chosen by the user.
 */
export async function promptState(
  states: Array<{ name: string; iso2: string }>
): Promise<string> {
  return search<string>({
    message: 'Select a state',
    source: (input) => {
      const query = (input ?? '').toLowerCase();
      return Promise.resolve(
        states
          .filter(
            (s) =>
              s.name.toLowerCase().includes(query) ||
              s.iso2.toLowerCase().includes(query)
          )
          .map((s) => ({ name: s.name, value: s.iso2 }))
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Builds a no-op `Spinner` whose text is writable but whose methods do
 * nothing.  This avoids TTY control codes in JSON/quiet output modes.
 *
 * @param initialText - The initial `text` value for the noop spinner.
 * @returns           A silent `Spinner` implementation.
 */
function buildNoopSpinner(initialText: string): Spinner {
  const noop: Spinner = {
    text: initialText,
    start(_text?: string): Spinner {
      return this;
    },
    stop(): void {
      // intentionally silent
    },
    succeed(_text?: string): void {
      // intentionally silent
    },
    fail(_text?: string): void {
      // intentionally silent
    },
  };
  return noop;
}
