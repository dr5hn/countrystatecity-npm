const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const crypto = require('node:crypto');

const { runParallel, verifyReleaseFiles } = require('./generate-all.cjs');

test('runParallel waits for every child before reporting failures', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-all-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const failingScript = path.join(dir, 'fail.cjs');
  const writingScript = path.join(dir, 'write.cjs');
  const marker = path.join(dir, 'complete');
  fs.writeFileSync(failingScript, 'process.exit(2);');
  fs.writeFileSync(
    writingScript,
    "setTimeout(() => require('node:fs').writeFileSync(process.argv[2], 'done'), 100);",
  );

  await assert.rejects(
    runParallel([
      { label: 'failing child', args: [failingScript], cwd: dir },
      { label: 'writing child', args: [writingScript, marker], cwd: dir },
    ]),
    /failing child failed/,
  );
  assert.equal(fs.readFileSync(marker, 'utf8'), 'done');
});

test('verifyReleaseFiles rejects missing or mixed-release raw inputs', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-files-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const combined = path.join(dir, 'source.json');
  const cities = path.join(dir, 'cities.json');
  fs.writeFileSync(combined, 'current combined');
  fs.writeFileSync(cities, 'wrong city release');
  const checksum = (value) => crypto.createHash('sha256').update(value).digest('hex');

  const errors = verifyReleaseFiles(
    {
      tag: 'v1',
      files: [
        { role: 'combined', contentSha256: checksum('current combined') },
        { role: 'cities-full', contentSha256: checksum('expected cities') },
      ],
    },
    { combined, 'cities-full': cities, translations: path.join(dir, 'missing.csv') },
  );

  assert.ok(errors.some((error) => error.includes('cities-full') && error.includes('does not match')));
  assert.ok(errors.some((error) => error.includes('translations') && error.includes('missing a checksum')));
});
