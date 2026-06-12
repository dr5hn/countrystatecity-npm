import { Command } from 'commander';
import chalk from 'chalk';
import open from 'open';

/** URL for the CountryStateCity online export tool. */
const EXPORT_URL = 'https://export.countrystatecity.in';

/**
 * Registers the export command — opens the online export tool in the default
 * browser, or emits a JSON response when the --json global flag is active.
 *
 * @param program - The root Commander instance to attach the command to.
 */
export function registerExportCommand(program: Command): void {
  program
    .command('export')
    .description('Open the export tool in your browser')
    .action(async function (this: Command) {
      const globals = this.optsWithGlobals<{ json: boolean; quiet: boolean; noFooter: boolean }>();

      if (globals.json) {
        console.log(JSON.stringify({ url: EXPORT_URL }));
        return;
      }

      console.log(chalk.dim('Opening the CountryStateCity export tool...'));
      console.log(chalk.dim(`URL: ${EXPORT_URL}`));

      await open(EXPORT_URL);
    });
}
