import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

// The most important invariant in Task 10: a generated file must never
// contain the user's real saved API key, under any circumstance — not just
// "the code path doesn't currently do it", but verified by actually scanning
// every byte written to disk.
const REAL_SECRET_KEY = 'csc_live_REAL_SECRET_DO_NOT_LEAK_abc123xyz';

vi.mock('../../src/lib/config.js', () => ({
  getApiKey: vi.fn(() => REAL_SECRET_KEY),
  getApiBase: vi.fn(() => 'https://api.countrystatecity.in/v1'),
}));

vi.mock('../../src/lib/api.js', () => ({
  get: vi.fn(),
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

async function allFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  const results: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const s = await stat(full);
    if (s.isDirectory()) {
      results.push(...(await allFiles(full)));
    } else {
      results.push(full);
    }
  }
  return results;
}

describe('generate autocomplete / location-picker — never leak the real API key', () => {
  let program: Command;
  let tempDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerGenerateCommands(program);
    tempDir = await mkdtemp(join(tmpdir(), 'csc-nokey-'));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tempDir, { recursive: true, force: true });
  });

  const cases: Array<{ command: string; target: string }> = [
    { command: 'autocomplete', target: 'nextjs' },
    { command: 'autocomplete', target: 'react-browser' },
    { command: 'location-picker', target: 'nextjs' },
    { command: 'location-picker', target: 'react-browser' },
  ];

  for (const { command, target } of cases) {
    it(`never writes the real configured API key into any file (${command} --target ${target})`, async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      await program.parseAsync([
        'node', 'csc', 'generate', command,
        '--target', target,
        '-o', tempDir,
      ]);

      const files = await allFiles(tempDir);
      expect(files.length).toBeGreaterThan(0);

      for (const file of files) {
        const content = await readFile(file, 'utf-8');
        expect(content, `${file} must not contain the real API key`).not.toContain(REAL_SECRET_KEY);
      }
    });
  }

  it('only ever uses placeholder key references, never a bare env-value interpolation', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    await program.parseAsync([
      'node', 'csc', 'generate', 'autocomplete',
      '--target', 'nextjs',
      '-o', tempDir,
    ]);

    const envExample = await readFile(join(tempDir, '.env.example'), 'utf-8');
    expect(envExample).toContain('YOUR_API_KEY_HERE');
    expect(envExample).not.toContain(REAL_SECRET_KEY);

    const route = await readFile(join(tempDir, 'app/api/csc-search/route.ts'), 'utf-8');
    expect(route).toContain('process.env.CSC_API_KEY');
  });

  it('refuses before writing anything when a target file already exists', async () => {
    const envPath = join(tempDir, '.env.example');
    await writeFile(envPath, 'KEEP_ME', 'utf-8');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      program.parseAsync([
        'node', 'csc', 'generate', 'autocomplete',
        '--target', 'nextjs',
        '-o', tempDir,
      ])
    ).rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(await readFile(envPath, 'utf-8')).toBe('KEEP_ME');
    expect(await allFiles(tempDir)).toEqual([envPath]);
  });
});
