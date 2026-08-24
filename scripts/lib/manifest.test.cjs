const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { sha256File, readManifest, writeManifest } = require('./manifest.cjs');

function tmpFile(t, name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const filePath = path.join(dir, name);
  if (content !== undefined) fs.writeFileSync(filePath, content);
  return filePath;
}

test('sha256File matches a known test vector', (t) => {
  const filePath = tmpFile(t, 'hello.txt', 'hello');
  assert.equal(sha256File(filePath), '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
});

test('readManifest returns null for a nonexistent path', (t) => {
  const filePath = tmpFile(t, 'does-not-exist.json');
  assert.equal(readManifest(filePath), null);
});

test('writeManifest then readManifest round-trips the same object', (t) => {
  const filePath = tmpFile(t, 'data-manifest.json');
  const manifest = { schemaVersion: 1, counts: { countries: 250, states: 5100, cities: 151000 } };

  writeManifest(filePath, manifest);
  assert.deepEqual(readManifest(filePath), manifest);
});

test('writeManifest produces pretty-printed JSON ending in a newline', (t) => {
  const filePath = tmpFile(t, 'data-manifest.json');
  writeManifest(filePath, { a: 1 });

  const raw = fs.readFileSync(filePath, 'utf-8');
  assert.ok(raw.endsWith('\n'));
  assert.ok(raw.includes('\n  "a": 1\n'));
});
