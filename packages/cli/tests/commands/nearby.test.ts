import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/lib/api.js', () => ({
  searchNearby: vi.fn(),
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

vi.mock('../../src/lib/display.js', () => ({
  printTable: vi.fn(),
  printJson: vi.fn(),
}));

import { Command } from 'commander';
import { registerNearbyCommand } from '../../src/commands/nearby.js';
import { searchNearby } from '../../src/lib/api.js';
import { printTable, printJson } from '../../src/lib/display.js';

const MUMBAI_NEARBY = {
  id: 132649,
  name: 'Mumbai',
  type: 'city' as const,
  country_code: 'IN',
  state_code: 'MH',
  country_name: 'India',
  state_name: 'Maharashtra',
  kind: 'settlement' as const,
  distance_km: 0.42,
};

describe('nearby command', () => {
  let program: Command;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    program.option('--json', 'Output as JSON');
    registerNearbyCommand(program);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes parsed, typed options through to client.search.nearby', async () => {
    let captured: unknown;
    vi.mocked(searchNearby).mockImplementation(async (params) => {
      captured = params;
      return { data: [MUMBAI_NEARBY], usage: null };
    });

    await program.parseAsync([
      'node', 'csc', 'nearby',
      '--lat', '19.076', '--lng', '72.877',
      '--type', 'CITY', '--kind', 'SETTLEMENT', '--country', 'in', '--radius', '25', '--limit', '10', '--min-population', '100000',
    ]);

    expect(captured).toEqual({
      lat: 19.076,
      lng: 72.877,
      type: 'city',
      kind: 'settlement',
      country: 'in',
      state: undefined,
      minPopulation: 100000,
      radius: 25,
      limit: 10,
    });
  });

  it('defaults type to city, radius to 25, and limit to 20', async () => {
    let captured: unknown;
    vi.mocked(searchNearby).mockImplementation(async (params) => {
      captured = params;
      return { data: [], usage: null };
    });

    await program.parseAsync(['node', 'csc', 'nearby', '--lat', '19.076', '--lng', '72.877']);

    expect(captured).toMatchObject({ type: 'city', radius: 25, limit: 20 });
  });

  it('renders a table with a Distance (km) column', async () => {
    vi.mocked(searchNearby).mockResolvedValue({ data: [MUMBAI_NEARBY], usage: null });

    await program.parseAsync(['node', 'csc', 'nearby', '--lat', '19.076', '--lng', '72.877']);

    expect(printTable).toHaveBeenCalledWith(
      ['Name', 'Type', 'Country', 'State', 'Distance (km)'],
      [['Mumbai', 'city', 'India', 'Maharashtra', '0.42']]
    );
  });

  it('prints raw JSON when --json is passed', async () => {
    vi.mocked(searchNearby).mockResolvedValue({ data: [MUMBAI_NEARBY], usage: null });

    await program.parseAsync(['node', 'csc', 'nearby', '--lat', '19.076', '--lng', '72.877', '--json']);

    expect(printJson).toHaveBeenCalledWith([MUMBAI_NEARBY]);
    expect(printTable).not.toHaveBeenCalled();
  });

  it('shows a friendly message when there are no nearby results', async () => {
    vi.mocked(searchNearby).mockResolvedValue({ data: [], usage: null });
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'csc', 'nearby', '--lat', '19.076', '--lng', '72.877']);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No nearby results found'));
    expect(printTable).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric --lat before calling the API', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    await expect(
      program.parseAsync(['node', 'csc', 'nearby', '--lat', 'abc', '--lng', '72.877'])
    ).rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(searchNearby).not.toHaveBeenCalled();
  });

  it('rejects an empty numeric option before calling the API', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    await expect(
      program.parseAsync(['node', 'csc', 'nearby', '--lat', ' ', '--lng', '72.877'])
    ).rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(searchNearby).not.toHaveBeenCalled();
  });

  it('requires --lat and --lng', async () => {
    await expect(
      program.parseAsync(['node', 'csc', 'nearby'])
    ).rejects.toThrow();
    expect(searchNearby).not.toHaveBeenCalled();
  });
});
