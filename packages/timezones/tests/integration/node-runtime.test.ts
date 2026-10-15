import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('built timezone package in native Node (without Vitest JSON transforms)', () => {
  for (const extension of ['js', 'cjs']) {
    it(`loads every JSON entry point from the ${extension} build`, () => {
      const entry = pathToFileURL(resolve(__dirname, `../../dist/index.${extension}`)).href;
      const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
        import assert from 'node:assert/strict';
        const pkg = await import(${JSON.stringify(entry)});
        assert.ok((await pkg.getTimezones()).length > 300);
        assert.ok((await pkg.getTimezonesByCountry('US')).length > 0);
        assert.ok((await pkg.getTimezoneAbbreviations()).length > 0);
        console.log('ok');
      `], { encoding: 'utf8' });
      expect(output.trim()).toBe('ok');
    });
  }
});
