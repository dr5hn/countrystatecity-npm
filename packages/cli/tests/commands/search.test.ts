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

    it('fetches all states globally when --country is omitted', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockStates, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'states']);

      expect(get).toHaveBeenCalledWith('/states');
    });
  });

  describe('search cities', () => {
    it('fetches cities for a country and state', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCities, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'cities', '--country', 'IN', '--state', 'MH']);

      expect(get).toHaveBeenCalledWith('/countries/IN/states/MH/cities');
    });

    it('fetches all cities for a country when --state is omitted', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCities, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'cities', '--country', 'IN']);

      expect(get).toHaveBeenCalledWith('/countries/IN/cities');
    });

    it('fetches all cities globally when no flags are given', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCities, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'cities']);

      expect(get).toHaveBeenCalledWith('/cities');
    });
  });

  describe('search regions', () => {
    it('fetches all regions', async () => {
      vi.mocked(get).mockResolvedValue({ data: [{ id: 1, name: 'Asia' }], usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'regions']);

      expect(get).toHaveBeenCalledWith('/regions');
    });
  });

  describe('search currencies', () => {
    it('fetches all currencies', async () => {
      vi.mocked(get).mockResolvedValue({ data: [{ id: 1, name: 'US Dollar', symbol: '$', code: 'USD' }], usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'currencies']);

      expect(get).toHaveBeenCalledWith('/currencies');
    });
  });

  describe('search timezones', () => {
    it('fetches all timezones', async () => {
      vi.mocked(get).mockResolvedValue({ data: [{ id: 1, zoneName: 'Asia/Kolkata', gmtOffset: 19800, gmtOffsetName: 'UTC+05:30', abbreviation: 'IST', tzName: 'India Standard Time' }], usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'timezones']);

      expect(get).toHaveBeenCalledWith('/timezones');
    });
  });

  describe('search phonecodes', () => {
    it('fetches all phone codes', async () => {
      vi.mocked(get).mockResolvedValue({ data: [{ id: 1, name: 'India', phonecode: '91', iso2: 'IN' }], usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'search', 'phonecodes']);

      expect(get).toHaveBeenCalledWith('/phone-codes');
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
