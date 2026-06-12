/**
 * Tests for the `explore` command.
 *
 * Covers:
 * - Command registration (name + description)
 * - Non-TTY guard: exits with code 1 and writes to stderr when stdin is not a TTY
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that pull them in
// ---------------------------------------------------------------------------

vi.mock('../../src/lib/api.js', () => ({
  get: vi.fn(),
}));

vi.mock('../../src/lib/config.js', () => ({
  getApiKey: vi.fn(() => 'test-key'),
  getApiBase: vi.fn(() => 'https://api.countrystatecity.in/v1'),
}));

vi.mock('@inquirer/search', () => ({
  default: vi.fn(),
}));

vi.mock('@inquirer/select', () => ({
  default: vi.fn(),
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
    toString() {
      return 'table';
    }
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { Command } from 'commander';
import { registerExploreCommand } from '../../src/commands/explore.js';
import { get } from '../../src/lib/api.js';
import searchPrompt from '@inquirer/search';
import selectPrompt from '@inquirer/select';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a fresh Commander program with exitOverride enabled and the explore
 * command registered on it.
 *
 * @returns A configured Commander instance ready for testing.
 */
function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerExploreCommand(program);
  return program;
}

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
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (process.stdin as any).isTTY;
    }
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('explore command', () => {
  let program: Command;

  beforeEach(() => {
    vi.clearAllMocks();
    program = buildProgram();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('registration', () => {
    it('registers a command named "explore"', () => {
      const cmd = program.commands.find((c) => c.name() === 'explore');
      expect(cmd).toBeDefined();
    });

    it('registers the command with the correct description', () => {
      const cmd = program.commands.find((c) => c.name() === 'explore');
      expect(cmd?.description()).toBe('Interactive geographic data browser');
    });
  });

  describe('non-TTY guard', () => {
    /**
     * Forces `process.stdin.isTTY` to `undefined` (falsy) using
     * Object.defineProperty, since the property is not a configurable getter
     * and cannot be spied on directly via vi.spyOn in this environment.
     */
    it('writes an error to stderr and exits with code 1 when stdin is not a TTY', async () => {
      const restore = setStdinTTY(undefined);

      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit(${code})`);
      });

      try {
        await expect(
          program.parseAsync(['node', 'csc', 'explore'])
        ).rejects.toThrow('process.exit(1)');

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(stderrSpy).toHaveBeenCalledWith(
          expect.stringContaining('requires an interactive terminal')
        );
      } finally {
        restore();
      }
    });

    it('does not call the API when stdin is not a TTY', async () => {
      const restore = setStdinTTY(undefined);

      vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit(${code})`);
      });

      const { get } = await import('../../src/lib/api.js');

      try {
        await expect(
          program.parseAsync(['node', 'csc', 'explore'])
        ).rejects.toThrow('process.exit(1)');

        expect(get).not.toHaveBeenCalled();
      } finally {
        restore();
      }
    });
  });

  describe('interactive flow', () => {
    it('prints the corrected prisma seed hint', async () => {
      const restore = setStdinTTY(true);
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      vi.mocked(get)
        .mockResolvedValueOnce({
          data: [{ id: 101, name: 'India', iso2: 'IN', emoji: '🇮🇳' }],
          usage: { dailyUsed: 10, dailyLimit: 1000, monthlyUsed: 100, monthlyLimit: 30000 },
        })
        .mockResolvedValueOnce({
          data: [{ id: 1, name: 'Maharashtra', iso2: 'MH' }],
          usage: { dailyUsed: 10, dailyLimit: 1000, monthlyUsed: 100, monthlyLimit: 30000 },
        });

      vi.mocked(searchPrompt)
        .mockResolvedValueOnce('IN')
        .mockResolvedValueOnce('MH');
      vi.mocked(selectPrompt)
        .mockResolvedValueOnce('generate-seed')
        .mockResolvedValueOnce('back');

      try {
        await program.parseAsync(['node', 'csc', 'explore']);

        const output = stderrSpy.mock.calls.map((call) => String(call[0])).join('');
        expect(output).toContain('csc generate seed -e states -f prisma -c IN');
      } finally {
        restore();
      }
    });
  });
});
