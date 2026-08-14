import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, symlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

// Verifies the generated projects actually build — real tsc against real
// next/react type declarations, not just a snapshot of the generated source
// text. A symlinked node_modules avoids a slow/flaky real `npm install` per
// test; @countrystatecity/sdk resolves via the workspace symlink already in
// this package's own node_modules, and must be built (`pnpm --filter sdk build`)
// for its .d.ts to exist, same as any other consumer of the SDK in this repo.

vi.mock('../../src/lib/config.js', () => ({
  getApiKey: vi.fn(() => 'test-key'),
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

const pkgRoot = fileURLToPath(new URL('../../', import.meta.url));
const nodeModulesDir = join(pkgRoot, 'node_modules');
const tscBin = join(nodeModulesDir, 'typescript', 'bin', 'tsc');

const NEXTJS_TSCONFIG = {
  compilerOptions: {
    target: 'ES2020',
    lib: ['dom', 'dom.iterable', 'esnext'],
    module: 'esnext',
    moduleResolution: 'bundler',
    jsx: 'react-jsx',
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    skipLibCheck: true,
    resolveJsonModule: true,
    isolatedModules: true,
    types: ['node'],
  },
  include: ['**/*.ts', '**/*.tsx'],
};

const BROWSER_TSCONFIG = NEXTJS_TSCONFIG; // same shape; next's types simply go unused

async function typecheckProject(dir: string): Promise<void> {
  await symlink(nodeModulesDir, join(dir, 'node_modules'), 'dir');

  try {
    execFileSync(process.execPath, [tscBin, '--noEmit', '-p', dir], {
      cwd: dir,
      stdio: 'pipe',
    });
  } catch (err) {
    const e = err as { stdout?: Buffer; stderr?: Buffer };
    const output = [e.stdout?.toString(), e.stderr?.toString()].filter(Boolean).join('\n');
    throw new Error(`tsc failed for generated project at ${dir}:\n${output}`);
  }
}

describe('generated projects actually build (real tsc against real next/react types)', () => {
  let program: Command;
  let tempDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerGenerateCommands(program);
    tempDir = await mkdtemp(join(tmpdir(), 'csc-build-'));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tempDir, { recursive: true, force: true });
  });

  it('autocomplete --target nextjs typechecks against real next/react types', async () => {
    await program.parseAsync(['node', 'csc', 'generate', 'autocomplete', '--target', 'nextjs', '-o', tempDir]);
    await writeFile(join(tempDir, 'tsconfig.json'), JSON.stringify(NEXTJS_TSCONFIG, null, 2));
    await typecheckProject(tempDir);
  }, 30_000);

  it('location-picker --target nextjs typechecks against real next/react types', async () => {
    await program.parseAsync(['node', 'csc', 'generate', 'location-picker', '--target', 'nextjs', '-o', tempDir]);
    await writeFile(join(tempDir, 'tsconfig.json'), JSON.stringify(NEXTJS_TSCONFIG, null, 2));
    await typecheckProject(tempDir);
  }, 30_000);

  it('autocomplete --target react-browser typechecks against real react types', async () => {
    await program.parseAsync(['node', 'csc', 'generate', 'autocomplete', '--target', 'react-browser', '-o', tempDir]);
    await writeFile(join(tempDir, 'tsconfig.json'), JSON.stringify(BROWSER_TSCONFIG, null, 2));
    await typecheckProject(tempDir);
  }, 30_000);

  it('location-picker --target react-browser typechecks against real react types', async () => {
    await program.parseAsync(['node', 'csc', 'generate', 'location-picker', '--target', 'react-browser', '-o', tempDir]);
    await writeFile(join(tempDir, 'tsconfig.json'), JSON.stringify(BROWSER_TSCONFIG, null, 2));
    await typecheckProject(tempDir);
  }, 30_000);
});
