import chalk from 'chalk';

/** Version string sourced from the package manifest. */
const VERSION = 'v0.1.1';

/**
 * Gradient hex colors applied top-to-bottom across the five ASCII art rows.
 */
const GRADIENT_COLORS = [
  '#2296f3', // row 1 — blue
  '#2ba8e8', // row 2 — light blue
  '#4dbe9e', // row 3 — teal
  '#8ecf5e', // row 4 — lime-green
  '#cddc39', // row 5 — lime
] as const;

/**
 * The five pixel rows that make up the "CSC" block-character logo.
 * Uses solid block characters only for broad terminal compatibility.
 * Each entry corresponds to one gradient color stop.
 */
const ASCII_ROWS = [
  '   ██████ ███████  ██████',
  '  ██      ██      ██',
  '  ██      ███████ ██',
  '  ██           ██ ██',
  '   ██████ ███████  ██████',
] as const;

/**
 * Returns gradient-colored ASCII art for the CSC logo followed by
 * a dimmed subtitle line with the current version.
 *
 * Each logo row is colored with a distinct hex value that transitions
 * from blue (top) through teal to lime (bottom).
 *
 * @returns Multi-line string ready to print to stdout.
 */
export function getAsciiArt(): string {
  const coloredRows = ASCII_ROWS.map((row, index) =>
    chalk.hex(GRADIENT_COLORS[index])(row)
  );

  const subtitle =
    chalk.dim('  Country State City CLI ') + chalk.dim(VERSION);

  return coloredRows.join('\n') + '\n\n' + subtitle;
}

/**
 * Formats a single command entry for the COMMANDS section.
 *
 * @param name - The CLI sub-command name (e.g. "auth").
 * @param description - Short description shown in dim text.
 * @returns Formatted line string.
 */
function formatCommand(name: string, description: string): string {
  const paddedName = name.padEnd(12);
  return `  ${chalk.hex('#2296f3')(paddedName)}${chalk.dim(description)}`;
}

/**
 * Formats a single flag entry for the GLOBAL FLAGS section.
 *
 * @param flag - The flag string (e.g. "--json").
 * @param description - Short description shown in dim text.
 * @returns Formatted line string.
 */
function formatFlag(flag: string, description: string): string {
  const paddedFlag = flag.padEnd(16);
  return `  ${paddedFlag}${chalk.dim(description)}`;
}

/**
 * Returns a fully branded help screen including the ASCII art logo,
 * a COMMANDS section listing all available sub-commands, a GLOBAL FLAGS
 * section, and a footer hint directing users to per-command help.
 *
 * @returns Multi-line string ready to print to stdout.
 */
export function getBrandedHelp(): string {
  const sectionHeader = (title: string): string =>
    chalk.hex('#f97316')(title);

  const commands = [
    ['auth',     'Save or remove your API key'],
    ['search',   'Search countries, states, or cities by name'],
    ['get',      'Fetch a specific country, state, or city by ISO code'],
    ['explore',  'Interactively browse geographic data'],
    ['usage',    'Show your current API usage and tier'],
    ['upgrade',  'View plans and open the pricing page'],
    ['generate', 'Generate dropdown or seed data for a framework'],
    ['export',   'Export geographic data to JSON or CSV'],
  ] as const;

  const flags = [
    ['--json',      'Output raw JSON instead of formatted tables'],
    ['--quiet',     'Suppress all decorative output'],
    ['--no-footer', 'Hide the usage footer after each command'],
  ] as const;

  const lines: string[] = [
    getAsciiArt(),
    '',
    sectionHeader('COMMANDS'),
    '',
    ...commands.map(([name, desc]) => formatCommand(name, desc)),
    '',
    sectionHeader('GLOBAL FLAGS'),
    '',
    ...flags.map(([flag, desc]) => formatFlag(flag, desc)),
    '',
    chalk.dim('Run csc <command> --help for details'),
  ];

  return lines.join('\n');
}
