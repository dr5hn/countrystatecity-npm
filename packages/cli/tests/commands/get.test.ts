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

import { Command } from 'commander';
import { registerGetCommands } from '../../src/commands/get.js';
import { get } from '../../src/lib/api.js';

const mockCountryDetail = {
  id: 101,
  name: 'India',
  iso2: 'IN',
  iso3: 'IND',
  capital: 'New Delhi',
  phonecode: '91',
  currency: 'INR',
  currency_name: 'Indian rupee',
  currency_symbol: '₹',
  region: 'Asia',
  subregion: 'Southern Asia',
  latitude: '20.00000000',
  longitude: '77.00000000',
  tld: '.in',
  native: 'भारत',
  emoji: '🇮🇳',
  timezones: JSON.stringify([{ zoneName: 'Asia/Kolkata', abbreviation: 'IST', utcOffset: '+05:30' }]),
  translations: '{}',
};

describe('get commands', () => {
  let program: Command;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    program.option('--json', 'Output as JSON');
    registerGetCommands(program);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('get country', () => {
    it('fetches and displays country detail', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCountryDetail, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'get', 'country', 'IN']);

      expect(get).toHaveBeenCalledWith('/countries/IN');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('India'));
    });

    it('formats coordinates to 4 decimal places', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCountryDetail, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'get', 'country', 'IN']);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('20.0000'));
    });

    it('parses timezone JSON string', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCountryDetail, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'get', 'country', 'IN']);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Asia/Kolkata'));
    });

    it('outputs JSON when --json flag is set', async () => {
      vi.mocked(get).mockResolvedValue({ data: mockCountryDetail, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'get', 'country', 'IN', '--json']);

      expect(console.log).toHaveBeenCalled();
    });

    it('handles malformed timezone JSON gracefully', async () => {
      const malformedData = { ...mockCountryDetail, timezones: 'not valid json{' };
      vi.mocked(get).mockResolvedValue({ data: malformedData, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'get', 'country', 'IN']);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('not valid json{'));
    });

    it('handles non-array timezone JSON gracefully', async () => {
      const nonArrayData = { ...mockCountryDetail, timezones: '"just a string"' };
      vi.mocked(get).mockResolvedValue({ data: nonArrayData, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'get', 'country', 'IN']);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('just a string'));
    });
  });

  describe('get state', () => {
    it('fetches and displays state detail', async () => {
      const mockState = {
        id: 1,
        name: 'Maharashtra',
        iso2: 'MH',
        country_code: 'IN',
        country_id: 101,
        type: 'state',
        latitude: '19.75470000',
        longitude: '75.71390000',
      };
      vi.mocked(get).mockResolvedValue({ data: mockState, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'get', 'state', 'IN', 'MH']);

      expect(get).toHaveBeenCalledWith('/countries/IN/states/MH');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Maharashtra'));
    });

    it('handles state with null type and missing coordinates', async () => {
      const mockState = {
        id: 99,
        name: 'Unknown Region',
        iso2: 'UR',
        country_code: 'XX',
        country_id: 1,
        type: null,
        latitude: '',
        longitude: '',
      };
      vi.mocked(get).mockResolvedValue({ data: mockState, usage: null });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'get', 'state', 'XX', 'UR']);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Unknown Region'));
    });
  });
});
