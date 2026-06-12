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

import { Command } from 'commander';
import { registerUsageCommand } from '../../src/commands/usage.js';
import { get } from '../../src/lib/api.js';

describe('usage command', () => {
  let program: Command;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerUsageCommand(program);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays usage with progress bars', async () => {
    vi.mocked(get).mockResolvedValue({
      data: {},
      usage: { dailyUsed: 47, dailyLimit: 1000, monthlyUsed: 1230, monthlyLimit: 30000 },
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'csc', 'usage']);

    expect(get).toHaveBeenCalledWith('/countries/IN');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Supporter'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('47'));
    logSpy.mockRestore();
  });

  it('handles missing usage headers gracefully', async () => {
    vi.mocked(get).mockResolvedValue({ data: {}, usage: null });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'csc', 'usage']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('not available'));
    logSpy.mockRestore();
  });
});
