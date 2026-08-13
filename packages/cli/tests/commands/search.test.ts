import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/lib/api.js', () => ({
  get: vi.fn(),
  searchFuzzy: vi.fn(),
}));

vi.mock('../../src/lib/config.js', () => ({
  getApiKey: vi.fn(() => 'test-key'),
  getApiBase: vi.fn(() => 'https://api.countrystatecity.in/v1'),
}));

vi.mock('ora', () => ({
  default: () => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
    set text(_v: string) {},
  }),
}));

vi.mock('chalk', () => ({
  default: {
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
    dim: (s: string) => s,
    cyan: (s: string) => s,
    bold: (s: string) => s,
  },
}));

vi.mock('cli-table3', () => ({
  default: class {
    push() {}
    toString() { return 'table'; }
  },
}));

vi.mock('../../src/lib/output.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/output.js')>();
  return {
    ...actual,
    isTTY: vi.fn(() => false),
    promptCountry: vi.fn(),
    promptState: vi.fn(),
  };
});

import { Command } from 'commander';
import { registerSearchCommands } from '../../src/commands/search.js';
import { get, searchFuzzy } from '../../src/lib/api.js';

const mockCountries = [
  { id: 101, name: 'India', iso2: 'IN', iso3: 'IND', capital: 'New Delhi', phonecode: '91', currency: 'INR' },
  { id: 233, name: 'United States', iso2: 'US', iso3: 'USA', capital: 'Washington', phonecode: '1', currency: 'USD' },
];

const mockStates = [
  { id: 1, name: 'Maharashtra', iso2: 'MH', type: 'state' },
  { id: 2, name: 'Karnataka', iso2: 'KA', type: 'state' },
];

const mockCities = [
  { id: 1, name: 'Mumbai' },
  { id: 2, name: 'Pune' },
];

describe('search commands', () => {
  let program: Command;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    program.option('--json', 'Output as JSON');
    registerSearchCommands(program);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('search countries', () => {
    it('fetches and displays all countries', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCountries, usage: null });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'countries']);

      expect(get).toHaveBeenCalledWith('/countries', { fields: undefined, sort: undefined });
    });

    it('filters countries by name', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCountries, usage: null });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'countries', '--filter', 'india']);

      expect(get).toHaveBeenCalledWith('/countries', { fields: undefined, sort: undefined });
    });

    it('outputs JSON when --json flag is set', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCountries, usage: null });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'countries', '--json']);

      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe('search states', () => {
    it('fetches states for a country', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockStates, usage: null });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'states', '--country', 'IN']);

      expect(get).toHaveBeenCalledWith('/countries/IN/states', { fields: undefined, sort: undefined });
    });

    it('fetches all states globally when --country is omitted', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockStates, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'states']);

      expect(get).toHaveBeenCalledWith('/states', { fields: undefined, sort: undefined });
    });
  });

  describe('search cities', () => {
    it('fetches cities for a country and state', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCities, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'cities', '--country', 'IN', '--state', 'MH']);

      expect(get).toHaveBeenCalledWith('/countries/IN/states/MH/cities', { fields: undefined, sort: undefined });
    });

    it('fetches all cities for a country when --state is omitted', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCities, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'cities', '--country', 'IN']);

      expect(get).toHaveBeenCalledWith('/countries/IN/cities', { fields: undefined, sort: undefined });
    });

    it('exits with error when no country given', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as () => never);
      vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      await expect(
        program.parseAsync(['node', 'csc', 'search', 'cities'])
      ).rejects.toThrow('exit');

      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('global search', () => {
    it('filters countries by query term', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCountries, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'india']);

      expect(get).toHaveBeenCalledWith('/countries');
    });

    it('shows message when no countries match', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCountries, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'zzz']);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No countries matching'));
    });

    it('routes --fuzzy to searchFuzzy with --type and --country', async () => {
      vi.mocked(searchFuzzy).mockResolvedValue({ data: [], usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'Banglore', '--fuzzy', '--type', 'city', '--country', 'in']);

      expect(searchFuzzy).toHaveBeenCalledWith({ query: 'Banglore', type: 'city', country: 'IN' });
      expect(get).not.toHaveBeenCalled();
    });
  });

  describe('--fuzzy on subcommands', () => {
    it('search countries --filter --fuzzy calls searchFuzzy instead of get', async () => {
      vi.mocked(searchFuzzy).mockResolvedValue({ data: [], usage: null });

      await program.parseAsync(['node', 'csc', 'search', 'countries', '--filter', 'Ind', '--fuzzy']);

      expect(searchFuzzy).toHaveBeenCalledWith({ query: 'Ind', type: 'country' });
      expect(get).not.toHaveBeenCalled();
    });

    it('search states --filter --fuzzy scopes by --country', async () => {
      vi.mocked(searchFuzzy).mockResolvedValue({ data: [], usage: null });

      await program.parseAsync(['node', 'csc', 'search', 'states', '--country', 'in', '--filter', 'Maha', '--fuzzy']);

      expect(searchFuzzy).toHaveBeenCalledWith({ query: 'Maha', type: 'state', country: 'IN' });
    });

    it('--fuzzy without --filter exits with an actionable error', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as () => never);
      vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      await expect(
        program.parseAsync(['node', 'csc', 'search', 'countries', '--fuzzy'])
      ).rejects.toThrow('exit');

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(searchFuzzy).not.toHaveBeenCalled();
    });
  });

  describe('--fields/--sort passthrough', () => {
    it('search countries --fields --sort passes them through to get()', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCountries, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'countries', '--fields', 'name,iso2', '--sort', 'name:asc']);

      expect(get).toHaveBeenCalledWith('/countries', { fields: 'name,iso2', sort: 'name:asc' });
    });

    it('search cities --fields renders a generic table without crashing', async () => {
      vi.mocked(get).mockResolvedValue({ data: [{ name: 'Mumbai' }], usage: null });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'cities', '--country', 'in', '--fields', 'name']);

      expect(get).toHaveBeenCalledWith('/countries/IN/cities', { fields: 'name', sort: undefined });
      expect(logSpy).toHaveBeenCalled();
    });
  });
});
