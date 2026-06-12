import { describe, it, expect, vi } from 'vitest';

/**
 * Mock chalk to pass through all text unchanged so tests can assert on
 * raw string content without ANSI escape sequences.
 */
vi.mock('chalk', () => ({
  default: {
    hex: (_color: string) => (s: string) => s,
    dim: (s: string) => s,
  },
}));

import { getAsciiArt, getBrandedHelp } from '../../src/lib/branding.js';

describe('getAsciiArt', () => {
  it('contains block characters from the ASCII art rows', () => {
    const art = getAsciiArt();
    expect(art).toContain('██');
  });

  it('contains the version string', () => {
    const art = getAsciiArt();
    expect(art).toContain('v0.1.1');
  });

  it('contains the subtitle text', () => {
    const art = getAsciiArt();
    expect(art).toContain('Country State City CLI');
  });

  it('returns a non-empty string', () => {
    const art = getAsciiArt();
    expect(typeof art).toBe('string');
    expect(art.length).toBeGreaterThan(0);
  });
});

describe('getBrandedHelp', () => {
  it('contains the ASCII art block characters', () => {
    const help = getBrandedHelp();
    expect(help).toContain('██');
  });

  it('contains the COMMANDS section header', () => {
    const help = getBrandedHelp();
    expect(help).toContain('COMMANDS');
  });

  it('contains all expected command names', () => {
    const help = getBrandedHelp();
    const commands = ['auth', 'search', 'get', 'explore', 'usage', 'upgrade', 'generate', 'export'];
    for (const cmd of commands) {
      expect(help).toContain(cmd);
    }
  });

  it('contains the GLOBAL FLAGS section header', () => {
    const help = getBrandedHelp();
    expect(help).toContain('GLOBAL FLAGS');
  });

  it('contains all expected global flags', () => {
    const help = getBrandedHelp();
    expect(help).toContain('--json');
    expect(help).toContain('--quiet');
    expect(help).toContain('--no-footer');
  });

  it('contains the footer hint', () => {
    const help = getBrandedHelp();
    expect(help).toContain('csc <command> --help');
  });
});
