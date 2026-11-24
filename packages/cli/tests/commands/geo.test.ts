import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';

vi.mock('../../src/lib/api.js', () => ({
  get: vi.fn(), searchFuzzy: vi.fn(), countyCities: vi.fn(), listCounties: vi.fn(),
  getCounty: vi.fn(), getPostcode: vi.fn(), listPostcodes: vi.fn(),
}));
vi.mock('../../src/lib/display.js', () => ({ printJson: vi.fn(), printGenericTable: vi.fn(), printTable: vi.fn() }));
vi.mock('../../src/lib/usage-footer.js', () => ({ printUsageFooter: vi.fn() }));
vi.mock('../../src/lib/output.js', () => ({ createSpinner: vi.fn(async () => ({ stop: vi.fn() })) }));

import { registerGeoGetCommands, registerGeoSearchCommands } from '../../src/commands/geo.js';
import { registerSearchCommands } from '../../src/commands/search.js';
import { listCounties, getCounty, getPostcode, listPostcodes, countyCities } from '../../src/lib/api.js';
import { printJson, printGenericTable } from '../../src/lib/display.js';
import { printUsageFooter } from '../../src/lib/usage-footer.js';

const usage = { dailyUsed: 2, dailyLimit: 100, monthlyUsed: 5, monthlyLimit: 1000 };

/** Create a fresh command tree so flags cannot leak between invocations. */
function program() {
  const root = new Command().exitOverride().option('--json').option('--quiet').option('--no-footer');
  root.configureOutput({ writeErr: () => {} });
  registerGeoSearchCommands(root.command('search'));
  registerGeoGetCommands(root.command('get'));
  return root;
}

describe('county and postcode commands', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps every county membership in JSON and prints the usage footer', async () => {
    const counties = [{ id: '14024', name: 'Taupō', state_id: null, state_code: null,
      states: [{ id: '4061', name: 'Waikato', code: 'WKO' }, { id: '4074', name: 'Bay of Plenty', code: 'BOP' }] }];
    vi.mocked(listCounties).mockResolvedValue({ data: counties as never, usage });
    await program().parseAsync(['node', 'csc', '--json', 'search', 'counties', '--country', 'NZ', '--state', 'WKO']);
    expect(listCounties).toHaveBeenCalledWith(expect.objectContaining({ country: 'NZ', state: 'WKO' }));
    expect(printJson).toHaveBeenCalledWith(counties);
    expect(printUsageFooter).toHaveBeenCalledWith(usage, { json: true, quiet: false, noFooter: false });
  });

  it('does not collapse duplicate exact postcode matches or discard match metadata', async () => {
    const matches = { data: [{ id: '1', code: '11104', locality_name: 'Watinapaha' },
      { id: '2', code: '11104', locality_name: 'Wattala' }], meta: { country_code: 'LK', query: '11104', match_count: 2 } };
    vi.mocked(getPostcode).mockResolvedValue({ data: matches as never, usage });
    await program().parseAsync(['node', 'csc', 'get', 'postcode', '11104', '--country', 'LK', '--json']);
    expect(getPostcode).toHaveBeenCalledWith('LK', '11104');
    expect(printJson).toHaveBeenCalledWith(matches);
    expect(printUsageFooter).toHaveBeenCalled();
  });

  it('retains pagination in JSON, passes cursors verbatim and fetches exactly one page', async () => {
    const page = { data: [], pagination: { limit: 2, next_cursor: 'next.signature', has_more: true } };
    vi.mocked(listPostcodes).mockResolvedValue({ data: page, usage });
    await program().parseAsync(['node', 'csc', 'search', 'postcodes', '--country', 'IN', '--city', '9223372036854775807',
      '--limit', '2', '--cursor', 'opaque.signature', '--json']);
    expect(listPostcodes).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ country: 'IN',
      cityId: '9223372036854775807', limit: 2, cursor: 'opaque.signature' }));
    expect(printJson).toHaveBeenCalledWith(page);
    expect(printUsageFooter).toHaveBeenCalled();
  });

  it('displays the next cursor on stderr for table output', async () => {
    const write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      const page = { data: [], pagination: { limit: 50, next_cursor: 'next.signature', has_more: true } };
      vi.mocked(listPostcodes).mockResolvedValue({ data: page, usage });
      await program().parseAsync(['node', 'csc', 'search', 'postcodes', '--country', 'IN']);
      expect(printGenericTable).toHaveBeenCalledWith([]);
      expect(write).toHaveBeenCalledWith(expect.stringContaining('next.signature'));
    } finally { write.mockRestore(); }
  });

  it('renders county detail and forwards output flags to the footer', async () => {
    const county = { id: '14024', name: 'Taupō', states: [] };
    vi.mocked(getCounty).mockResolvedValue({ data: county as never, usage });
    await program().parseAsync(['node', 'csc', 'get', 'county', '14024', '-c', 'NZ', '--quiet', '--no-footer']);
    expect(getCounty).toHaveBeenCalledWith('NZ', '14024');
    expect(printGenericTable).toHaveBeenCalledWith([county]);
    expect(printUsageFooter).toHaveBeenCalledWith(usage, { json: false, quiet: true, noFooter: true });
  });

  it('requires a country before making any postcode request', async () => {
    await expect(program().parseAsync(['node', 'csc', 'get', 'postcode', '11104'])).rejects.toMatchObject({ code: 'commander.missingMandatoryOptionValue' });
    expect(getPostcode).not.toHaveBeenCalled();
  });

  it('uses the county city route and rejects contradictory filters before an API call', async () => {
    const root = new Command().exitOverride().option('--json');
    root.configureOutput({ writeErr: () => {} });
    registerSearchCommands(root);
    vi.mocked(countyCities).mockResolvedValue({ data: [], usage });
    await root.parseAsync(['node', 'csc', 'search', 'cities', '--country', 'NZ', '--county', '14024', '--json']);
    expect(countyCities).toHaveBeenCalledExactlyOnceWith('NZ', '14024', { fields: undefined, sort: undefined });
    await expect(root.parseAsync(['node', 'csc', 'search', 'cities', '--country', 'NZ', '--county', '14024', '--state', 'WKO']))
      .rejects.toThrow('--county requires --country');
    expect(countyCities).toHaveBeenCalledTimes(1);
  });
});
