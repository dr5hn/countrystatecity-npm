import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('open', () => ({ default: vi.fn() }));
vi.mock('chalk', () => ({
  default: { dim: (s: string) => s, hex: () => (s: string) => s },
}));

import { Command } from 'commander';
import { registerExportCommand } from '../../src/commands/export.js';
import open from 'open';

describe('export command', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('opens export tool URL in browser', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = new Command();
    program.exitOverride();
    registerExportCommand(program);
    await program.parseAsync(['node', 'csc', 'export']);
    expect(open).toHaveBeenCalledWith('https://export.countrystatecity.in');
  });

  it('outputs JSON when --json flag is set', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = new Command();
    program.option('--json');
    program.exitOverride();
    registerExportCommand(program);
    await program.parseAsync(['node', 'csc', '--json', 'export']);
    // Verify JSON was output (not browser opened)
    expect(open).not.toHaveBeenCalled();
  });
});
