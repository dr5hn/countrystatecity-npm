const ROOT_COMMANDS = new Set([
  'auth',
  'search',
  'get',
  'usage',
  'upgrade',
  'generate',
  'explore',
  'export',
]);

/**
 * Returns whether the current invocation should be treated as root help.
 *
 * Root help is shown when no arguments are provided, or when `-h` / `--help`
 * are present before any root command is selected.
 */
export function isRootHelpRequested(argv: string[]): boolean {
  const args = argv.slice(2);
  if (args.length === 0) {
    return true;
  }

  const helpRequested = args.includes('-h') || args.includes('--help');
  if (!helpRequested) {
    return false;
  }

  const commandArg = args.find((arg) => !arg.startsWith('-'));
  return commandArg === undefined || !ROOT_COMMANDS.has(commandArg);
}

/**
 * Returns whether decorative branded help should be used for root help.
 */
export function shouldShowBrandedHelp(argv: string[]): boolean {
  const args = argv.slice(2);
  return !args.includes('--json') && !args.includes('-q') && !args.includes('--quiet');
}
