# CSC CLI Modernization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the CSC CLI with branded ASCII art, interactive explorer, global flags (--json/--quiet/--no-footer), export command, stderr/stdout separation, and a static CLI website.

**Architecture:** Add a `src/lib/branding.ts` module for ASCII art and help rendering. Add `src/lib/output.ts` to centralize stdout/stderr routing. Add `src/commands/explore.ts` for the interactive browser. Add `src/commands/export.ts` as a browser-opener. Modify `src/index.ts` to wire global flags and custom help. All existing commands updated to respect global flags and use stderr for non-data output.

**Tech Stack:** chalk (hex colors), @inquirer/search + @inquirer/select (interactive prompts), existing commander/ora/cli-table3 stack.

**Spec:** `docs/superpowers/specs/2026-03-28-cli-modernization-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/branding.ts` | Create | ASCII art, gradient rendering, custom help text |
| `src/lib/output.ts` | Create | Centralized stderr/stdout routing, spinner factory |
| `src/commands/explore.ts` | Create | Interactive geographic data browser |
| `src/commands/export.ts` | Create | Opens export.countrystatecity.in in browser |
| `src/index.ts` | Modify | Global flags, custom help, wire new commands |
| `src/lib/display.ts` | Modify | Route data output to stdout only |
| `src/lib/usage-footer.ts` | Modify | Route footer to stderr |
| `src/commands/auth.ts` | Modify | Respect --json/--quiet flags, stderr for spinners |
| `src/commands/search.ts` | Modify | Respect global flags, hybrid prompts, stderr for spinners |
| `src/commands/get.ts` | Modify | Respect global flags, hybrid prompts, stderr for spinners |
| `src/commands/usage.ts` | Modify | Add --json output, stderr for spinners |
| `src/commands/upgrade.ts` | Modify | Add --json output, stderr for spinners |
| `src/commands/generate.ts` | Modify | Respect global flags, hybrid prompts, stderr for spinners |
| `tests/lib/branding.test.ts` | Create | Tests for ASCII art and help rendering |
| `tests/lib/output.test.ts` | Create | Tests for output routing |
| `tests/commands/explore.test.ts` | Create | Tests for interactive explorer |
| `tests/commands/export.test.ts` | Create | Tests for export command |

---

### Task 1: Create branding module with ASCII art

**Files:**
- Create: `src/lib/branding.ts`
- Create: `tests/lib/branding.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/lib/branding.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('chalk', () => ({
  default: {
    hex: (color: string) => (s: string) => s,
    dim: (s: string) => s,
    bold: (s: string) => s,
  },
}));

import { getAsciiArt, getBrandedHelp } from '../../src/lib/branding.js';

describe('branding', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAsciiArt', () => {
    it('returns the CSC block letter art', () => {
      const art = getAsciiArt();
      expect(art).toContain('██████');
      expect(art).toContain('Country State City CLI');
    });

    it('includes version number', () => {
      const art = getAsciiArt();
      expect(art).toContain('v0.1.0');
    });
  });

  describe('getBrandedHelp', () => {
    it('includes ASCII art', () => {
      const help = getBrandedHelp();
      expect(help).toContain('██████');
    });

    it('lists all commands', () => {
      const help = getBrandedHelp();
      expect(help).toContain('auth');
      expect(help).toContain('search');
      expect(help).toContain('get');
      expect(help).toContain('explore');
      expect(help).toContain('usage');
      expect(help).toContain('upgrade');
      expect(help).toContain('generate');
      expect(help).toContain('export');
    });

    it('lists global flags', () => {
      const help = getBrandedHelp();
      expect(help).toContain('--json');
      expect(help).toContain('--quiet');
      expect(help).toContain('--no-footer');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/branding.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement branding module**

```typescript
// src/lib/branding.ts
import chalk from 'chalk';

const GRADIENT_COLORS = ['#2296f3', '#2ba8e8', '#4dbe9e', '#8ecf5e', '#cddc39'];

const ASCII_LINES = [
  '   ██████ ███████  ██████',
  '  ██      ██      ██',
  '  ██      ███████ ██',
  '  ██           ██ ██',
  '   ██████ ███████  ██████',
];

/**
 * Returns the gradient-colored ASCII art banner with version.
 */
export function getAsciiArt(): string {
  const coloredLines = ASCII_LINES.map((line, i) =>
    chalk.hex(GRADIENT_COLORS[i])(line)
  );
  const version = chalk.dim('v0.1.0');
  const subtitle = chalk.dim('Country State City CLI');
  return `\n${coloredLines.join('\n')}\n\n  ${subtitle} ${version}\n`;
}

/**
 * Returns the full branded help screen with commands and global flags.
 */
export function getBrandedHelp(): string {
  const cmd = (name: string, desc: string) =>
    `    ${chalk.hex('#2296f3')(name.padEnd(12))}${chalk.dim(desc)}`;

  const flag = (name: string, desc: string) =>
    `    ${chalk.hex('#2296f3')(name.padEnd(12))}${chalk.dim(desc)}`;

  const section = (title: string) => chalk.hex('#f97316')(title);

  return [
    getAsciiArt(),
    `  ${section('COMMANDS')}\n`,
    cmd('auth', 'Login, logout, check API key status'),
    cmd('search', 'Browse countries, states, and cities'),
    cmd('get', 'Get detailed info for a country or state'),
    cmd('explore', 'Interactive geographic data browser'),
    cmd('usage', 'View API quota and plan details'),
    cmd('upgrade', 'Compare plans and upgrade'),
    cmd('generate', 'Generate dropdown components and seed files'),
    cmd('export', 'Open the export tool in your browser'),
    '',
    `  ${section('GLOBAL FLAGS')}\n`,
    flag('--json', 'Output raw JSON (for piping)'),
    flag('--quiet', 'Suppress decorative output (spinners, footer, ASCII art)'),
    flag('--no-footer', 'Hide usage footer'),
    '',
    `  ${chalk.dim('Run')} ${chalk.hex('#2296f3')('csc <command> --help')} ${chalk.dim('for details')}`,
    '',
  ].join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/branding.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/branding.ts tests/lib/branding.test.ts
git commit -m "feat: add branded ASCII art and help screen module"
```

---

### Task 2: Create output routing module

**Files:**
- Create: `src/lib/output.ts`
- Create: `tests/lib/output.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/lib/output.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('chalk', () => ({
  default: {
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
    dim: (s: string) => s,
    cyan: (s: string) => s,
    bold: (s: string) => s,
    hex: () => (s: string) => s,
  },
}));

import { stderr, createSpinner, type GlobalFlags } from '../../src/lib/output.js';

describe('output', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('stderr', () => {
    it('writes to process.stderr', () => {
      const writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      stderr('test message');
      expect(writeSpy).toHaveBeenCalledWith('test message\n');
    });
  });

  describe('createSpinner', () => {
    it('returns a noop spinner when quiet is true', () => {
      const spinner = createSpinner('Loading...', { json: false, quiet: true, noFooter: false });
      expect(spinner.start()).toBe(spinner);
      expect(spinner.succeed).toBeDefined();
      expect(spinner.fail).toBeDefined();
    });

    it('returns a noop spinner when json is true', () => {
      const spinner = createSpinner('Loading...', { json: true, quiet: false, noFooter: false });
      expect(spinner.start()).toBe(spinner);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/output.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement output module**

```typescript
// src/lib/output.ts

export interface GlobalFlags {
  json: boolean;
  quiet: boolean;
  noFooter: boolean;
}

/**
 * Writes a message to stderr with a newline.
 */
export function stderr(message: string): void {
  process.stderr.write(message + '\n');
}

interface Spinner {
  start: () => Spinner;
  stop: () => void;
  succeed: (text?: string) => void;
  fail: (text?: string) => void;
  text: string;
}

const noopSpinner: Spinner = {
  start() { return this; },
  stop() {},
  succeed() {},
  fail() {},
  text: '',
};

/**
 * Creates a spinner that writes to stderr. Returns a noop spinner if quiet/json mode.
 */
export async function createSpinner(text: string, flags: GlobalFlags): Promise<Spinner> {
  if (flags.quiet || flags.json) {
    return { ...noopSpinner, text };
  }
  const ora = (await import('ora')).default;
  return ora({ text, stream: process.stderr }).start();
}
```

- [ ] **Step 4: Update test for async createSpinner**

The `createSpinner` function is async. Update the test:

```typescript
  describe('createSpinner', () => {
    it('returns a noop spinner when quiet is true', async () => {
      const spinner = await createSpinner('Loading...', { json: false, quiet: true, noFooter: false });
      expect(spinner.start()).toBe(spinner);
      expect(spinner.succeed).toBeDefined();
      expect(spinner.fail).toBeDefined();
    });

    it('returns a noop spinner when json is true', async () => {
      const spinner = await createSpinner('Loading...', { json: true, quiet: false, noFooter: false });
      expect(spinner.start()).toBe(spinner);
    });
  });
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/lib/output.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/output.ts tests/lib/output.test.ts
git commit -m "feat: add output routing module with stderr and spinner factory"
```

---

### Task 3: Wire global flags and custom help into entry point

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Update index.ts with global flags and custom help**

```typescript
// src/index.ts
#!/usr/bin/env node

import { Command } from 'commander';
import { getBrandedHelp } from './lib/branding.js';
import { registerAuthCommands } from './commands/auth.js';
import { registerSearchCommands } from './commands/search.js';
import { registerGetCommands } from './commands/get.js';
import { registerUsageCommand } from './commands/usage.js';
import { registerUpgradeCommand } from './commands/upgrade.js';
import { registerGenerateCommands } from './commands/generate.js';
import { registerExploreCommand } from './commands/explore.js';
import { registerExportCommand } from './commands/export.js';

const program = new Command();

program
  .name('csc')
  .description('Official CLI for the Country State City API')
  .version('0.1.0')
  .option('--json', 'Output raw JSON (for piping)')
  .option('-q, --quiet', 'Suppress decorative output')
  .option('--no-footer', 'Hide usage footer')
  .addHelpText('beforeAll', getBrandedHelp())
  .helpOption(false)
  .addHelpCommand(false);

// Override default help to show branded version
program.option('-h, --help', 'Display help').on('option:help', () => {
  const flags = program.opts();
  if (flags.json || flags.quiet) {
    program.outputHelp();
  } else {
    process.stdout.write(getBrandedHelp());
  }
  process.exit(0);
});

// Show branded help when no command is given
program.action(() => {
  const flags = program.opts();
  if (flags.json || flags.quiet) {
    program.outputHelp();
  } else {
    process.stdout.write(getBrandedHelp());
  }
});

registerAuthCommands(program);
registerSearchCommands(program);
registerGetCommands(program);
registerUsageCommand(program);
registerUpgradeCommand(program);
registerGenerateCommands(program);
registerExploreCommand(program);
registerExportCommand(program);

program.parse();
```

Note: `explore.ts` and `export.ts` don't exist yet — they'll be created in Tasks 5 and 6. For now, create stubs so the build doesn't fail.

- [ ] **Step 2: Create stub files for explore and export**

```typescript
// src/commands/explore.ts
import { Command } from 'commander';

/**
 * Registers the explore command (interactive geographic browser).
 */
export function registerExploreCommand(program: Command): void {
  program
    .command('explore')
    .description('Interactive geographic data browser')
    .action(async () => {
      console.log('Coming soon. Use `csc search` for now.');
    });
}
```

```typescript
// src/commands/export.ts
import { Command } from 'commander';
import open from 'open';
import chalk from 'chalk';

/**
 * Registers the export command — opens export tool in browser.
 */
export function registerExportCommand(program: Command): void {
  program
    .command('export')
    .description('Open the export tool in your browser')
    .action(async () => {
      const parentOpts = program.parent?.opts() ?? {};

      if (parentOpts.json) {
        console.log(JSON.stringify({ url: 'https://export.countrystatecity.in' }));
        return;
      }

      console.log(chalk.dim('  Export geographic data in JSON, CSV, SQL, and more formats.'));
      console.log(chalk.dim('  Uses credits from the Export Tool (separate from API quota).\n'));
      console.log(chalk.dim('  Opening export.countrystatecity.in...\n'));
      await open('https://export.countrystatecity.in');
    });
}
```

- [ ] **Step 3: Build and verify help output**

Run: `npm run build && npx tsx src/index.ts --help`
Expected: Branded ASCII art with gradient, commands list, global flags

- [ ] **Step 4: Commit**

```bash
git add src/index.ts src/commands/explore.ts src/commands/export.ts
git commit -m "feat: add global flags, custom branded help, explore/export stubs"
```

---

### Task 4: Move spinners and usage footer to stderr

**Files:**
- Modify: `src/lib/usage-footer.ts`
- Modify: `src/lib/display.ts`
- Modify: `src/commands/auth.ts`
- Modify: `src/commands/search.ts`
- Modify: `src/commands/get.ts`
- Modify: `src/commands/usage.ts`
- Modify: `src/commands/upgrade.ts`
- Modify: `src/commands/generate.ts`

This is a systematic change across all command files. The pattern for each command:

1. Import `createSpinner` from `../lib/output.js` and `type GlobalFlags`
2. Get global flags from `program.opts()` or `cmd.optsWithGlobals()`
3. Replace `(await import('ora')).default(text).start()` with `await createSpinner(text, flags)`
4. Skip `printUsageFooter` if `flags.noFooter || flags.json`

- [ ] **Step 1: Update usage-footer.ts to write to stderr**

Replace all `console.log` calls in `printUsageFooter` and `progressBar` display with `process.stderr.write`:

In `src/lib/usage-footer.ts`, change the `printUsageFooter` function:

```typescript
export function printUsageFooter(usage: UsageInfo | null, flags?: { noFooter?: boolean; json?: boolean }): void {
  if (!usage) return;
  if (flags?.noFooter || flags?.json) return;

  const { dailyUsed, dailyLimit, monthlyUsed, monthlyLimit } = usage;
  if (dailyLimit === 0 || monthlyLimit === 0) return;
  const dailyPercent = (dailyUsed / dailyLimit) * 100;
  const tier = getTierName(dailyLimit);

  process.stderr.write('\n');

  if (dailyPercent >= 100) {
    process.stderr.write(
      chalk.red(
        `Daily limit reached (${formatNumber(dailyUsed)}/${formatNumber(dailyLimit)}). Resets in ${timeUntilDailyReset()}.`
      ) + '\n'
    );
    const nextTier = dailyLimit <= 300 ? 'Supporter ($9/mo)' : 'a higher plan';
    process.stderr.write(chalk.red(`Upgrade to ${nextTier} for more requests/day.`) + '\n');
    process.stderr.write(
      chalk.red('Run `csc upgrade` or visit https://app.countrystatecity.in/pricing') + '\n'
    );
  } else if (dailyPercent >= 80) {
    process.stderr.write(
      chalk.yellow(
        `Warning: ${formatNumber(dailyUsed)}/${formatNumber(dailyLimit)} daily requests used (${Math.round(dailyPercent)}%). Upgrade for more at $9/mo.`
      ) + '\n'
    );
    process.stderr.write(chalk.yellow('Run `csc upgrade` to view plans.') + '\n');
  } else {
    process.stderr.write(
      chalk.dim(
        `Usage: ${formatNumber(dailyUsed)}/${formatNumber(dailyLimit)} today | ${formatNumber(monthlyUsed)}/${formatNumber(monthlyLimit)} this month (${tier})`
      ) + '\n'
    );
  }
}
```

- [ ] **Step 2: Update each command file to use createSpinner and pass global flags**

For each command file (`auth.ts`, `search.ts`, `get.ts`, `usage.ts`, `upgrade.ts`, `generate.ts`), apply these changes:

1. Add import: `import { createSpinner, type GlobalFlags } from '../lib/output.js';`
2. Inside each `.action(async (...) => {` handler, get global flags:
   ```typescript
   const flags: GlobalFlags = {
     json: cmd.optsWithGlobals().json ?? false,
     quiet: cmd.optsWithGlobals().quiet ?? false,
     noFooter: cmd.optsWithGlobals().footer === false,
   };
   ```
   (Note: Commander stores `--no-footer` as `opts().footer === false`)
3. Replace spinner creation:
   ```typescript
   // Before:
   const spinner = (await import('ora')).default('Fetching...').start();
   // After:
   const spinner = await createSpinner('Fetching...', flags);
   ```
4. Pass flags to `printUsageFooter`:
   ```typescript
   printUsageFooter(usage, flags);
   ```
5. For `--json` mode on auth/usage/upgrade, output structured JSON instead of formatted text.

- [ ] **Step 3: Add --json output to auth status**

In `src/commands/auth.ts`, in the `status` action, before the formatted output:

```typescript
if (flags.json) {
  console.log(JSON.stringify({
    authenticated: result.valid,
    key: masked,
    tier: result.usage ? getTierName(result.usage.dailyLimit) : null,
    daily: result.usage ? { used: result.usage.dailyUsed, limit: result.usage.dailyLimit } : null,
    monthly: result.usage ? { used: result.usage.monthlyUsed, limit: result.usage.monthlyLimit } : null,
  }));
  return;
}
```

For unauthenticated state:
```typescript
if (flags.json) {
  console.log(JSON.stringify({ authenticated: false }));
  return;
}
```

- [ ] **Step 4: Add --json output to usage command**

In `src/commands/usage.ts`, before formatted output:

```typescript
if (flags.json) {
  console.log(JSON.stringify({
    plan: tier,
    price: price,
    daily: { used: dailyUsed, limit: dailyLimit, percent: dailyPct },
    monthly: { used: monthlyUsed, limit: monthlyLimit, percent: monthlyPct },
  }));
  return;
}
```

- [ ] **Step 5: Add --json output to upgrade command**

In `src/commands/upgrade.ts`, before formatted output:

```typescript
if (flags.json) {
  console.log(JSON.stringify({
    currentPlan: usage ? getTierName(usage.dailyLimit) : null,
    plans: [
      { name: 'Community', price: 'Free', daily: 100, monthly: 3000 },
      { name: 'Starter', price: '$5/mo', daily: 300, monthly: 9000 },
      { name: 'Supporter', price: '$9/mo', daily: 1000, monthly: 30000 },
      { name: 'Professional', price: '$29/mo', daily: 3300, monthly: 100000 },
      { name: 'Business', price: '$79/mo', daily: 25000, monthly: 750000 },
    ],
  }));
  return;
}
```

- [ ] **Step 6: Build and test**

Run: `npm run build && npx vitest run`
Expected: All tests pass. Verify manually:
```bash
csc search countries --json | head -3    # Clean JSON, no spinner noise
csc auth status --json                    # Structured JSON
csc usage --json                          # Structured JSON
csc search countries 2>/dev/null | head -3 # Table only, no footer
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/usage-footer.ts src/lib/display.ts src/commands/*.ts
git commit -m "feat: route spinners/footer to stderr, add --json to all commands"
```

---

### Task 5: Implement interactive explorer

**Files:**
- Modify: `src/commands/explore.ts` (replace stub)
- Create: `tests/commands/explore.test.ts`

**Dependency:** Install `@inquirer/search` and `@inquirer/select`:
```bash
npm install @inquirer/search @inquirer/select
```

- [ ] **Step 1: Write the test**

```typescript
// tests/commands/explore.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';

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

vi.mock('chalk', () => ({
  default: {
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
    dim: (s: string) => s,
    cyan: (s: string) => s,
    bold: (s: string) => s,
    hex: () => (s: string) => s,
  },
}));

import { Command } from 'commander';
import { registerExploreCommand } from '../../src/commands/explore.js';

describe('explore command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers the explore command', () => {
    const program = new Command();
    registerExploreCommand(program);
    const cmd = program.commands.find(c => c.name() === 'explore');
    expect(cmd).toBeDefined();
    expect(cmd?.description()).toBe('Interactive geographic data browser');
  });

  it('exits with message when not a TTY', async () => {
    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    const program = new Command();
    program.exitOverride();
    registerExploreCommand(program);

    await expect(
      program.parseAsync(['node', 'csc', 'explore'])
    ).rejects.toThrow();

    Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
  });
});
```

- [ ] **Step 2: Implement explore command**

```typescript
// src/commands/explore.ts
import { Command } from 'commander';
import chalk from 'chalk';
import { get } from '../lib/api.js';
import { printTable, printJson, printDetail } from '../lib/display.js';
import { printUsageFooter } from '../lib/usage-footer.js';
import { createSpinner, type GlobalFlags } from '../lib/output.js';

interface Country {
  id: number;
  name: string;
  iso2: string;
  emoji: string;
}

interface State {
  id: number;
  name: string;
  iso2: string;
}

interface City {
  id: number;
  name: string;
}

/**
 * Registers the explore command — interactive geographic data browser.
 */
export function registerExploreCommand(program: Command): void {
  program
    .command('explore')
    .description('Interactive geographic data browser')
    .action(async (_opts, cmd) => {
      if (!process.stdin.isTTY) {
        process.stderr.write(chalk.red('The explore command requires an interactive terminal.\n'));
        process.stderr.write(chalk.dim('Use `csc search` for non-interactive searches.\n'));
        process.exit(1);
      }

      const flags: GlobalFlags = {
        json: cmd.optsWithGlobals().json ?? false,
        quiet: cmd.optsWithGlobals().quiet ?? false,
        noFooter: cmd.optsWithGlobals().footer === false,
      };

      const search = (await import('@inquirer/search')).default;
      const select = (await import('@inquirer/select')).default;

      // Fetch countries
      const spinner = await createSpinner('Loading countries...', flags);
      const { data: countries, usage } = await get<Country[]>('/countries');
      spinner.stop();

      // Country selection
      const countryIso = await search({
        message: 'Select a country',
        source: (input) => {
          const term = (input || '').toLowerCase();
          return countries
            .filter(c => !term || c.name.toLowerCase().includes(term))
            .map(c => ({ name: `${c.emoji} ${c.name} (${c.iso2})`, value: c.iso2 }));
        },
      });

      // Fetch states
      const stateSpinner = await createSpinner(`Loading states for ${countryIso}...`, flags);
      const { data: states } = await get<State[]>(`/countries/${countryIso}/states`);
      stateSpinner.stop();

      if (states.length === 0) {
        process.stderr.write(chalk.yellow(`No states found for ${countryIso}.\n`));
        printUsageFooter(usage, flags);
        return;
      }

      // State selection
      const stateIso = await search({
        message: 'Select a state',
        source: (input) => {
          const term = (input || '').toLowerCase();
          return states
            .filter(s => !term || s.name.toLowerCase().includes(term))
            .map(s => ({ name: `${s.name} (${s.iso2})`, value: s.iso2 }));
        },
      });

      // Action menu loop
      let done = false;
      while (!done) {
        const action = await select({
          message: 'What next?',
          choices: [
            { name: 'View cities', value: 'cities' },
            { name: 'View country details', value: 'country-detail' },
            { name: 'View state details', value: 'state-detail' },
            { name: 'Generate dropdown component', value: 'generate-dropdown' },
            { name: 'Generate seed file', value: 'generate-seed' },
            { name: 'Go back', value: 'back' },
          ],
        });

        switch (action) {
          case 'cities': {
            const citySpinner = await createSpinner('Loading cities...', flags);
            const { data: cities } = await get<City[]>(
              `/countries/${countryIso}/states/${stateIso}/cities`
            );
            citySpinner.stop();
            const rows = cities.map(c => [String(c.id), c.name]);
            printTable(['ID', 'Name'], rows);
            break;
          }
          case 'country-detail': {
            const detailSpinner = await createSpinner('Loading...', flags);
            const { data } = await get<Record<string, unknown>>(`/countries/${countryIso}`);
            detailSpinner.stop();
            printJson(data);
            break;
          }
          case 'state-detail': {
            const detailSpinner = await createSpinner('Loading...', flags);
            const { data } = await get<Record<string, unknown>>(
              `/countries/${countryIso}/states/${stateIso}`
            );
            detailSpinner.stop();
            printJson(data);
            break;
          }
          case 'generate-dropdown':
            process.stderr.write(
              chalk.dim(`Run: csc generate dropdown -e states -f react -c ${countryIso}\n`)
            );
            break;
          case 'generate-seed':
            process.stderr.write(
              chalk.dim(`Run: csc generate seed -e states -f prisma -c ${countryIso}\n`)
            );
            break;
          case 'back':
            done = true;
            break;
        }
      }

      printUsageFooter(usage, flags);
    });
}
```

- [ ] **Step 3: Run tests**

Run: `npm run build && npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/commands/explore.ts tests/commands/explore.test.ts package.json package-lock.json
git commit -m "feat: add interactive explore command with searchable country/state browser"
```

---

### Task 6: Finalize export command and tests

**Files:**
- Modify: `src/commands/export.ts` (update stub from Task 3)
- Create: `tests/commands/export.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/commands/export.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('open', () => ({
  default: vi.fn(),
}));

vi.mock('chalk', () => ({
  default: {
    dim: (s: string) => s,
    hex: () => (s: string) => s,
  },
}));

import { Command } from 'commander';
import { registerExportCommand } from '../../src/commands/export.js';
import open from 'open';

describe('export command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

    expect(console.log).toHaveBeenCalledWith(
      JSON.stringify({ url: 'https://export.countrystatecity.in' })
    );
    expect(open).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Update export command to read global flags properly**

```typescript
// src/commands/export.ts
import { Command } from 'commander';
import open from 'open';
import chalk from 'chalk';

/**
 * Registers the export command — opens export tool in browser.
 */
export function registerExportCommand(program: Command): void {
  program
    .command('export')
    .description('Open the export tool in your browser')
    .action(async (_opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals();

      if (globalOpts.json) {
        console.log(JSON.stringify({ url: 'https://export.countrystatecity.in' }));
        return;
      }

      console.log();
      console.log(chalk.dim('  Export geographic data in JSON, CSV, SQL, and more formats.'));
      console.log(chalk.dim('  Uses credits from the Export Tool (separate from API quota).\n'));
      console.log(chalk.dim('  Opening export.countrystatecity.in...\n'));
      await open('https://export.countrystatecity.in');
    });
}
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/commands/export.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/commands/export.ts tests/commands/export.test.ts
git commit -m "feat: add export command that opens export tool in browser"
```

---

### Task 7: Add hybrid interactive prompts to search/get/generate

**Files:**
- Modify: `src/commands/search.ts`
- Modify: `src/commands/get.ts`
- Modify: `src/commands/generate.ts`

When required arguments are missing AND stdin is a TTY, prompt interactively instead of erroring.

- [ ] **Step 1: Create a shared prompt helper**

Add to `src/lib/output.ts`:

```typescript
/**
 * Returns true if stdin is an interactive terminal.
 */
export function isTTY(): boolean {
  return !!process.stdin.isTTY;
}

/**
 * Prompts user to select a country from a searchable list.
 * Only call when isTTY() is true.
 */
export async function promptCountry(countries: Array<{ name: string; iso2: string; emoji?: string }>): Promise<string> {
  const search = (await import('@inquirer/search')).default;
  return search({
    message: 'Select a country',
    source: (input) => {
      const term = (input || '').toLowerCase();
      return countries
        .filter(c => !term || c.name.toLowerCase().includes(term))
        .map(c => ({ name: `${c.emoji || ''} ${c.name} (${c.iso2})`.trim(), value: c.iso2 }));
    },
  });
}

/**
 * Prompts user to select a state from a searchable list.
 * Only call when isTTY() is true.
 */
export async function promptState(states: Array<{ name: string; iso2: string }>): Promise<string> {
  const search = (await import('@inquirer/search')).default;
  return search({
    message: 'Select a state',
    source: (input) => {
      const term = (input || '').toLowerCase();
      return states
        .filter(s => !term || s.name.toLowerCase().includes(term))
        .map(s => ({ name: `${s.name} (${s.iso2})`, value: s.iso2 }));
    },
  });
}
```

- [ ] **Step 2: Add hybrid behavior to search states**

In `src/commands/search.ts`, in the `states` action, before the API call:

```typescript
// Replace requiredOption with optional:
.option('-c, --country <iso2>', 'Country ISO2 code')

// In action, add fallback:
let code = options.country?.toUpperCase();
if (!code) {
  if (isTTY()) {
    const spinner = await createSpinner('Loading countries...', flags);
    const { data: countries } = await get<Country[]>('/countries');
    spinner.stop();
    code = await promptCountry(countries);
  } else {
    process.stderr.write(chalk.red('Country code required. Use --country IN\n'));
    process.exit(1);
  }
}
```

Apply the same pattern for `search cities` (prompt country then state), `get country` (prompt country), `get state` (prompt country then state), and `generate` commands (prompt entity then format).

- [ ] **Step 3: Build and manual test**

Run: `npm run build`
Test interactively:
```bash
csc search states        # Should prompt for country
csc get country          # Should prompt for country
echo "" | csc search states  # Should show error (not TTY)
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/output.ts src/commands/search.ts src/commands/get.ts src/commands/generate.ts
git commit -m "feat: add hybrid interactive prompts when args missing in TTY mode"
```

---

### Task 8: Update all existing tests for stderr changes

**Files:**
- Modify: `tests/commands/auth.test.ts`
- Modify: `tests/commands/search.test.ts`
- Modify: `tests/commands/get.test.ts`
- Modify: `tests/commands/usage.test.ts`
- Modify: `tests/commands/upgrade.test.ts`
- Modify: `tests/commands/generate.test.ts`
- Modify: `tests/lib/usage-footer.test.ts`

- [ ] **Step 1: Update usage-footer tests**

Since `printUsageFooter` now writes to `process.stderr` instead of `console.log`, update the spy:

```typescript
// In each printUsageFooter test:
// Before:
vi.spyOn(console, 'log').mockImplementation(() => {});
// After:
vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
```

And update assertions:
```typescript
// Before:
const allOutput = (console.log as ...).mock.calls.map(...)
// After:
const allOutput = (process.stderr.write as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => String(c[0])).join('');
```

- [ ] **Step 2: Update command tests for spinner mock changes**

The `ora` mock needs to be updated since `createSpinner` now passes `stream: process.stderr`. Update each command test's ora mock:

```typescript
vi.mock('../../src/lib/output.js', async () => {
  const actual = await vi.importActual('../../src/lib/output.js');
  return {
    ...actual,
    createSpinner: vi.fn(async () => ({
      start: vi.fn().mockReturnThis(),
      stop: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
      text: '',
    })),
  };
});
```

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "test: update all tests for stderr output routing"
```

---

### Task 9: Build and verify everything end-to-end

- [ ] **Step 1: Full build**

```bash
npm run build
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```
Expected: All tests pass

- [ ] **Step 3: Manual verification checklist**

```bash
# Help and branding
csc --help              # ASCII art with gradient, all commands listed
csc --version           # 0.1.0
csc search --help       # Standard Commander help (no ASCII art)

# Global flags
csc search countries --json | head -3    # Clean JSON, no spinner
csc search countries --quiet             # No spinner, no footer
csc auth status --json                   # Structured JSON

# Export
csc export              # Opens browser to export.countrystatecity.in
csc export --json       # Returns JSON URL

# Piping works
csc search countries --json | wc -l     # No stderr noise in stdout

# Interactive (if API key configured)
csc search states       # Prompts for country interactively
csc explore             # Full interactive flow
```

- [ ] **Step 4: Final commit and push**

```bash
git add -A
git commit -m "chore: final verification pass"
git push origin main
```

---

### Task 10: Create CLI website (cli.countrystatecity.in)

**Files:**
- Create: `website/index.html`
- Create: `website/CNAME`

This is a standalone static site in the `website/` directory, deployed to GitHub Pages.

- [ ] **Step 1: Create the website directory and CNAME**

```bash
mkdir -p website
echo "cli.countrystatecity.in" > website/CNAME
```

- [ ] **Step 2: Create index.html**

A single-file static page with:
- Inline CSS using brand colors (#2296f3, #cddc39, #f97316)
- Cal Sans font from Google Fonts
- ASCII art hero with copy-paste install command
- Feature grid (4 cards)
- Animated terminal demo (CSS keyframes)
- Quick start section
- Pricing table
- Footer with links

The HTML file should be self-contained (~500 lines), no external JS dependencies. Use CSS animations for the terminal demo. Match the main site's visual identity.

- [ ] **Step 3: Test locally**

```bash
cd website && python3 -m http.server 8080
# Open http://localhost:8080
```

- [ ] **Step 4: Commit**

```bash
git add website/
git commit -m "feat: add static CLI website for cli.countrystatecity.in"
```

- [ ] **Step 5: Configure GitHub Pages**

Set GitHub Pages source to the `website/` directory on the `main` branch (or use a gh-pages branch). Configure DNS for `cli.countrystatecity.in` to point to GitHub Pages.
