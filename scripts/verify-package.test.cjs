/** Use small real archives to test the release boundary without installing packages. */
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { verifyPackage } = require('./verify-package.cjs');

/** Build one test archive, optionally inserting an unwanted file or hook. */
function fixture(t, change = () => {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'package-security-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'package/dist'), { recursive: true });
  const manifest = { name: '@countrystatecity/countries', version: '1.0.0', repository: { url: 'git+https://github.com/dr5hn/countrystatecity-npm.git' } };
  fs.writeFileSync(path.join(dir, 'package/dist/index.js'), 'export {};');
  fs.writeFileSync(path.join(dir, 'package/NOTICE-SOURCES.txt'), 'credits');
  change(dir, manifest);
  fs.writeFileSync(path.join(dir, 'package/package.json'), JSON.stringify(manifest));
  const archive = path.join(dir, 'package.tgz');
  execFileSync('tar', ['-czf', archive, '-C', dir, 'package']);
  return archive;
}

test('accepts a built package with the expected identity and notices', t => {
  assert.ok(verifyPackage(fixture(t), 'countries', '1.0.0') > 0);
});

test('rejects credentials, install scripts, external dependencies and wrong identities', t => {
  for (const change of [
    (dir) => fs.writeFileSync(path.join(dir, 'package/.env'), 'PRIVATE=secret'),
    (dir, m) => { m.scripts = { postinstall: 'echo unsafe' }; },
    (dir, m) => { m.dependencies = { dependency: 'https://untrusted.example/code.tgz' }; },
    (dir, m) => { m.name = '@another/package'; },
    (dir) => fs.unlinkSync(path.join(dir, 'package/NOTICE-SOURCES.txt')),
    (dir) => fs.symlinkSync('/etc/passwd', path.join(dir, 'package/dist/link')),
  ]) assert.throws(() => verifyPackage(fixture(t, change), 'countries', '1.0.0'));
});
