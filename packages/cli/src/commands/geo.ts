import { Command } from 'commander';
import { listCounties, getCounty, listPostcodes, getPostcode } from '../lib/api.js';
import { printGenericTable, printJson } from '../lib/display.js';
import { createSpinner, type GlobalFlags } from '../lib/output.js';
import { printUsageFooter } from '../lib/usage-footer.js';

/** Resolve output flags shared by the county and postcode commands. */
function flagsFor(cmd: Command): GlobalFlags {
  const opts = cmd.optsWithGlobals();
  return { json: opts.json ?? false, quiet: opts.quiet ?? false, noFooter: opts.footer === false };
}

/** Register country-scoped county lists and single-page postcode searches. */
export function registerGeoSearchCommands(search: Command): void {
  search.command('counties')
    .description('List counties, including all state memberships')
    .requiredOption('-c, --country <iso2>', 'Country ISO2 code')
    .option('-s, --state <code>', 'Filter by state membership')
    .option('--query <text>', 'English name substring (Starter+)')
    .option('--fields <fields>', 'Comma-separated fields (Starter+)')
    .option('--sort <sort>', 'Comma-separated field:asc|desc sort (Starter+)')
    .action(async (options: { country: string; state?: string; query?: string; fields?: string; sort?: string }, cmd: Command) => {
      const flags = flagsFor(cmd);
      const spinner = await createSpinner('Fetching counties...', flags);
      const { data, usage } = await listCounties({ country: options.country, state: options.state, q: options.query,
        fields: options.fields?.split(','), sort: options.sort?.split(',') });
      spinner.stop();
      if (flags.json) printJson(data);
      else printGenericTable(data as unknown as Record<string, unknown>[]);
      printUsageFooter(usage, flags);
    });

  search.command('postcodes')
    .description('Fetch one postcode page (Starter+); use --cursor to continue')
    .requiredOption('-c, --country <iso2>', 'Country ISO2 code')
    .option('--query <text>', 'Code prefix or locality substring (2–100 characters)')
    .option('-s, --state <code>', 'Filter by state code')
    .option('--city <id>', 'Filter by city ID (64-bit integer string)')
    .option('--type <type>', 'Filter by source postcode type, e.g. full, area, fsa')
    .option('--limit <number>', 'Page size (1–100; default 50)')
    .option('--cursor <token>', 'Opaque next_cursor from a previous page')
    .option('--fields <fields>', 'Comma-separated fields (Starter+)')
    .action(async (options: { country: string; query?: string; state?: string; city?: string; type?: string;
      limit?: string; cursor?: string; fields?: string }, cmd: Command) => {
      const flags = flagsFor(cmd);
      const spinner = await createSpinner('Fetching postcode page...', flags);
      const { data, usage } = await listPostcodes({ country: options.country, q: options.query,
        stateCode: options.state, cityId: options.city, type: options.type,
        limit: options.limit === undefined ? undefined : Number(options.limit), cursor: options.cursor,
        fields: options.fields?.split(',') });
      spinner.stop();
      if (flags.json) printJson(data);
      else {
        printGenericTable(data.data as unknown as Record<string, unknown>[]);
        if (data.pagination.next_cursor) {
          process.stderr.write(`Next cursor (use --cursor with the same country): ${data.pagination.next_cursor}\n`);
        }
      }
      printUsageFooter(usage, flags);
    });
}

/** Register county detail and exact-postcode lookups without collapsing matches. */
export function registerGeoGetCommands(get: Command): void {
  get.command('county <id>')
    .description('Get a county and all its state memberships')
    .requiredOption('-c, --country <iso2>', 'Country ISO2 code')
    .action(async (id: string, options: { country: string }, cmd: Command) => {
      const flags = flagsFor(cmd);
      const spinner = await createSpinner('Fetching county...', flags);
      const { data, usage } = await getCounty(options.country, id);
      spinner.stop();
      if (flags.json) printJson(data);
      else printGenericTable([data] as unknown as Record<string, unknown>[]);
      printUsageFooter(usage, flags);
    });

  get.command('postcode <code>')
    .description('Look up a postcode and retain every matching locality')
    .requiredOption('-c, --country <iso2>', 'Country ISO2 code')
    .action(async (code: string, options: { country: string }, cmd: Command) => {
      const flags = flagsFor(cmd);
      const spinner = await createSpinner('Looking up postcode...', flags);
      const { data, usage } = await getPostcode(options.country, code);
      spinner.stop();
      if (flags.json) printJson(data);
      else printGenericTable(data.data as unknown as Record<string, unknown>[]);
      printUsageFooter(usage, flags);
    });
}
