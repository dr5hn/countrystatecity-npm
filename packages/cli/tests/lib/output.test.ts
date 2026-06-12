import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock chalk as passthrough so string assertions work without ANSI codes
vi.mock('chalk', () => ({
  default: {
    red: (s: string) => s,
    green: (s: string) => s,
    yellow: (s: string) => s,
    blue: (s: string) => s,
    dim: (s: string) => s,
    bold: (s: string) => s,
  },
}));

// Mock ora so spinner tests do not need a real TTY
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
    text: '',
  })),
}));

import { stderr, createSpinner, isTTY } from '../../src/lib/output.js';
import type { GlobalFlags } from '../../src/lib/output.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const quietFlags: GlobalFlags = { json: false, quiet: true, noFooter: false };
const jsonFlags: GlobalFlags = { json: true, quiet: false, noFooter: false };
const normalFlags: GlobalFlags = { json: false, quiet: false, noFooter: false };

// ---------------------------------------------------------------------------
// stderr
// ---------------------------------------------------------------------------

describe('stderr', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes the message followed by a newline to process.stderr', () => {
    stderr('hello world');
    expect(stderrSpy).toHaveBeenCalledWith('hello world\n');
  });

  it('writes an empty string followed by a newline', () => {
    stderr('');
    expect(stderrSpy).toHaveBeenCalledWith('\n');
  });

  it('does not write to process.stdout', () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderr('only stderr');
    expect(stdoutSpy).not.toHaveBeenCalled();
    stdoutSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// createSpinner — noop branch
// ---------------------------------------------------------------------------

describe('createSpinner', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a noop spinner when quiet=true', async () => {
    const spinner = await createSpinner('loading…', quietFlags);
    expect(spinner).toBeDefined();
    // Noop spinner methods must not throw
    expect(() => spinner.start()).not.toThrow();
    expect(() => spinner.stop()).not.toThrow();
    expect(() => spinner.succeed('done')).not.toThrow();
    expect(() => spinner.fail('error')).not.toThrow();
  });

  it('returns a noop spinner when json=true', async () => {
    const spinner = await createSpinner('loading…', jsonFlags);
    expect(spinner).toBeDefined();
    expect(() => spinner.start()).not.toThrow();
    expect(() => spinner.stop()).not.toThrow();
    expect(() => spinner.succeed()).not.toThrow();
    expect(() => spinner.fail()).not.toThrow();
  });

  it('noop spinner start returns the spinner itself (chainable)', async () => {
    const spinner = await createSpinner('loading…', quietFlags);
    expect(spinner.start()).toBe(spinner);
  });

  it('noop spinner text property is settable', async () => {
    const spinner = await createSpinner('initial text', quietFlags);
    spinner.text = 'updated text';
    expect(spinner.text).toBe('updated text');
  });

  it('returns a real ora spinner when quiet=false and json=false', async () => {
    const { default: ora } = await import('ora');
    const spinner = await createSpinner('loading…', normalFlags);
    expect(spinner).toBeDefined();
    expect(ora).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'loading…', stream: process.stderr })
    );
  });
});

// ---------------------------------------------------------------------------
// isTTY
// ---------------------------------------------------------------------------

describe('isTTY', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a boolean', () => {
    const result = isTTY();
    expect(typeof result).toBe('boolean');
  });

  it('returns true when process.stdin.isTTY is truthy', () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    expect(isTTY()).toBe(true);
  });

  it('returns false when process.stdin.isTTY is falsy', () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: undefined, configurable: true });
    expect(isTTY()).toBe(false);
  });
});
