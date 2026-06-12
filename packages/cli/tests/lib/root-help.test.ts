import { describe, it, expect } from 'vitest';
import { isRootHelpRequested, shouldShowBrandedHelp } from '../../src/lib/root-help.js';

describe('root help helpers', () => {
  it('treats an empty invocation as root help', () => {
    expect(isRootHelpRequested(['node', 'csc'])).toBe(true);
  });

  it('treats global help flags before any command as root help', () => {
    expect(isRootHelpRequested(['node', 'csc', '--json', '--help'])).toBe(true);
    expect(isRootHelpRequested(['node', 'csc', '--quiet', '-h'])).toBe(true);
  });

  it('does not treat sub-command help as root help', () => {
    expect(isRootHelpRequested(['node', 'csc', 'search', '--help'])).toBe(false);
    expect(isRootHelpRequested(['node', 'csc', '--json', 'get', '--help'])).toBe(false);
  });

  it('suppresses branded help for json and quiet modes', () => {
    expect(shouldShowBrandedHelp(['node', 'csc', '--json', '--help'])).toBe(false);
    expect(shouldShowBrandedHelp(['node', 'csc', '--quiet', '--help'])).toBe(false);
  });

  it('allows branded help for the default root help path', () => {
    expect(shouldShowBrandedHelp(['node', 'csc', '--help'])).toBe(true);
  });
});
