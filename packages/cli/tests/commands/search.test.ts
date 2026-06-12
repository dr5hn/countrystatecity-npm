import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/lib/api.js', () => ({
  get: vi.fn(),
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
import { get } from '../../src/lib/api.js';

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

      expect(get).toHaveBeenCalledWith('/countries');
    });

    it('filters countries by name', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCountries, usage: null });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'countries', '--filter', 'india']);

      expect(get).toHaveBeenCalledWith('/countries');
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

      expect(get).toHaveBeenCalledWith('/countries/IN/states');
    });

    it('exits with error when --country flag missing in non-TTY', async () => {
      const exitError = new Error('process.exit(1)');
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => { throw exitError; }) as () => never);
      vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      await expect(
        program.parseAsync(['node', 'csc', 'search', 'states'])
      ).rejects.toThrow('process.exit(1)');

      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('search cities', () => {
    it('fetches cities for a country and state', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCities, usage: null });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'cities', '--country', 'IN', '--state', 'MH']);

      expect(get).toHaveBeenCalledWith('/countries/IN/states/MH/cities');
    });

    it('exits with error when --state flag missing in non-TTY', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCities, usage: null });
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as () => never);
      vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      await program.parseAsync(['node', 'csc', 'search', 'cities', '--country', 'IN']);

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
  });
});
