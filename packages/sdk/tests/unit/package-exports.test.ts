import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));

describe('package exports map', () => {
  it('exposes ./package.json as a subpath', () => {
    // Bundlers and tooling (Vite, Jest resolvers, version probes) read it
    // directly; without the entry Node raises ERR_PACKAGE_PATH_NOT_EXPORTED.
    expect(pkg.exports['./package.json']).toBe('./package.json');
  });

  it('keeps the root entry dual-format with matching type declarations', () => {
    expect(pkg.exports['.']).toEqual({
      import: { types: './dist/index.d.ts', default: './dist/index.js' },
      require: { types: './dist/index.d.cts', default: './dist/index.cjs' },
    });
  });

  it('ships only build output and package metadata', () => {
    expect(pkg.files.sort()).toEqual(['LICENSE', 'README.md', 'dist']);
  });
});
