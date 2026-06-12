import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/lib/config.js', () => ({
  getApiKey: vi.fn(),
  setApiKey: vi.fn(),
  clearApiKey: vi.fn(),
  getApiBase: vi.fn(() => 'https://api.countrystatecity.in/v1'),
}));

vi.mock('../../src/lib/api.js', () => ({
  validateKey: vi.fn(),
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
import { registerAuthCommands } from '../../src/commands/auth.js';
import { getApiKey, setApiKey, clearApiKey } from '../../src/lib/config.js';
import { validateKey } from '../../src/lib/api.js';

describe('auth commands', () => {
  let program: Command;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerAuthCommands(program);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setStdinTTY(value: boolean | undefined): () => void {
    const original = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
    Object.defineProperty(process.stdin, 'isTTY', {
      value,
      writable: true,
      configurable: true,
    });
    return () => {
      if (original) {
        Object.defineProperty(process.stdin, 'isTTY', original);
      }
    };
  }

  describe('auth login --key', () => {
    it('saves a valid API key', async () => {
      vi.mocked(validateKey).mockResolvedValue({
        valid: true,
        usage: { dailyUsed: 10, dailyLimit: 1000, monthlyUsed: 100, monthlyLimit: 30000 },
      });

      await program.parseAsync(['node', 'csc', 'auth', 'login', '--key', 'valid-key-123']);
      expect(setApiKey).toHaveBeenCalledWith('valid-key-123');
    });

    it('rejects an invalid API key', async () => {
      vi.mocked(validateKey).mockResolvedValue({ valid: false, usage: null });
      vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

      await expect(
        program.parseAsync(['node', 'csc', 'auth', 'login', '--key', 'bad-key'])
      ).rejects.toThrow();

      expect(setApiKey).not.toHaveBeenCalled();
    });

    it('fails fast in non-interactive mode when no key is provided', async () => {
      const restore = setStdinTTY(undefined);
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

      try {
        await expect(
          program.parseAsync(['node', 'csc', 'auth', 'login'])
        ).rejects.toThrow('exit');

        const output = stderrSpy.mock.calls.map((call) => String(call[0])).join('');
        expect(output).toContain('API key required in non-interactive mode');
        expect(output).toContain('csc auth login --key <API_KEY>');
        expect(validateKey).not.toHaveBeenCalled();
      } finally {
        restore();
      }
    });
  });

  describe('auth status', () => {
    it('shows not logged in when no key stored', async () => {
      vi.mocked(getApiKey).mockReturnValue(undefined);
      vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      await program.parseAsync(['node', 'csc', 'auth', 'status']);

      const allOutput = (process.stderr.write as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => String(c[0])).join('');
      expect(allOutput).toContain('Not logged in');
    });

    it('shows authenticated status with masked key', async () => {
      vi.mocked(getApiKey).mockReturnValue('my-secret-key-a1b2');
      vi.mocked(validateKey).mockResolvedValue({
        valid: true,
        usage: { dailyUsed: 47, dailyLimit: 1000, monthlyUsed: 1230, monthlyLimit: 30000 },
      });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'auth', 'status']);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Authenticated'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('****...a1b2'));
    });
  });

  describe('auth logout', () => {
    it('clears the stored API key', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync(['node', 'csc', 'auth', 'logout']);

      expect(clearApiKey).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('API key removed'));
    });
  });
});
