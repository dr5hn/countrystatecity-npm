import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/lib/config.js', () => ({
  getApiKey: vi.fn(),
  getApiBase: vi.fn(() => 'https://api.countrystatecity.in/v1'),
}));

vi.mock('../../src/lib/api.js', () => ({
  validateKey: vi.fn(),
  getPlans: vi.fn(),
}));

vi.mock('open', () => ({
  default: vi.fn(),
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
import { registerUpgradeCommand } from '../../src/commands/upgrade.js';
import { getApiKey } from '../../src/lib/config.js';
import { validateKey, getPlans } from '../../src/lib/api.js';
import open from 'open';

const mockPlans = [
  { key: 'community', name: 'Community', priceMonthly: 0, priceAnnual: null, currency: 'USD', dailyLimit: 100, monthlyLimit: 3000, features: ['Basic access'], badges: [], highlighted: false },
  { key: 'supporter', name: 'Supporter', priceMonthly: 9, priceAnnual: 90, currency: 'USD', dailyLimit: 1000, monthlyLimit: 30000, features: ['Field filtering'], badges: ['Most Popular'], highlighted: true },
];

describe('upgrade command', () => {
  let program: Command;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPlans).mockResolvedValue(mockPlans);
    program = new Command();
    program.exitOverride();
    registerUpgradeCommand(program);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows current plan when authenticated', async () => {
    vi.mocked(getApiKey).mockReturnValue('test-key');
    vi.mocked(validateKey).mockResolvedValue({
      valid: true,
      usage: { dailyUsed: 10, dailyLimit: 1000, monthlyUsed: 100, monthlyLimit: 30000 },
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'csc', 'upgrade']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Supporter'));
    expect(open).toHaveBeenCalledWith('https://countrystatecity.in/pricing?source=cli&campaign=sdk_api_migration&package=cli');
  });

  it('shows plans without current plan when unauthenticated', async () => {
    vi.mocked(getApiKey).mockReturnValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'csc', 'upgrade']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Available plans'));
    expect(open).toHaveBeenCalled();
  });

  it('opens pricing page in browser', async () => {
    vi.mocked(getApiKey).mockReturnValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'csc', 'upgrade']);

    expect(open).toHaveBeenCalledWith('https://countrystatecity.in/pricing?source=cli&campaign=sdk_api_migration&package=cli');
  });
});
