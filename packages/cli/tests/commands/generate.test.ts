import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

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

import { Command } from 'commander';
import { registerGenerateCommands } from '../../src/commands/generate.js';
import { get } from '../../src/lib/api.js';

const mockCountries = [
  { id: 101, name: 'India', iso2: 'IN', iso3: 'IND', phonecode: '91', capital: 'New Delhi', currency: 'INR', emoji: '🇮🇳' },
];

describe('generate commands', () => {
  let program: Command;
  let tempDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerGenerateCommands(program);
    tempDir = await mkdtemp(join(tmpdir(), 'csc-test-'));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('tier gating', () => {
    it('blocks Community tier users', async () => {
      // Single data-fetch call returns Community limits
      vi.mocked(get).mockResolvedValue({
        data: mockCountries,
        usage: { dailyUsed: 10, dailyLimit: 150, monthlyUsed: 100, monthlyLimit: 4500 },
      });
      vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await expect(
        program.parseAsync([
          'node', 'csc', 'generate', 'dropdown',
          '-e', 'countries', '-f', 'react', '-o', tempDir,
        ])
      ).rejects.toThrow('exit');

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Supporter plan'));
    });

    it('blocks when usage headers are absent', async () => {
      vi.mocked(get).mockResolvedValue({
        data: mockCountries,
        usage: null,
      });
      vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await expect(
        program.parseAsync([
          'node', 'csc', 'generate', 'dropdown',
          '-e', 'countries', '-f', 'react', '-o', tempDir,
        ])
      ).rejects.toThrow('exit');

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Supporter plan'));
    });
  });

  describe('generate dropdown', () => {
    it('generates a React country dropdown', async () => {
      // Single call: fetch countries with Supporter usage
      vi.mocked(get).mockResolvedValue({
        data: mockCountries,
        usage: { dailyUsed: 10, dailyLimit: 1000, monthlyUsed: 100, monthlyLimit: 30000 },
      });

      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync([
        'node', 'csc', 'generate', 'dropdown',
        '-e', 'countries', '-f', 'react', '-o', tempDir,
      ]);

      const content = await readFile(join(tempDir, 'CountrySelect.tsx'), 'utf-8');
      expect(content).toContain('CountrySelect');
      expect(content).toContain('India');
      expect(content).toContain("import { useState } from 'react'");
      expect(content).toContain('const selected = value ?? internalSelected;');
    });
  });

  describe('generate seed', () => {
    it('generates a Prisma country seed file', async () => {
      vi.mocked(get).mockResolvedValue({
        data: mockCountries,
        usage: { dailyUsed: 10, dailyLimit: 1000, monthlyUsed: 100, monthlyLimit: 30000 },
      });

      vi.spyOn(console, 'log').mockImplementation(() => {});

      await program.parseAsync([
        'node', 'csc', 'generate', 'seed',
        '-e', 'countries', '-f', 'prisma', '-o', tempDir,
      ]);

      const content = await readFile(join(tempDir, 'seed-countries.ts'), 'utf-8');
      expect(content).toContain('PrismaClient');
      expect(content).toContain('India');
      expect(content).toContain('createMany');
    });
  });
});
