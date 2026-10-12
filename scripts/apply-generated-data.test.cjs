/** Regression coverage for stale files surviving artifact overlays. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { applyGeneratedData } = require('./apply-generated-data.cjs');

/** Create an existing checkout and a newly generated artifact. */
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apply-data-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const packages = path.join(dir, 'packages');
  const artifact = path.join(dir, 'artifact');
  for (const pkg of ['countries', 'geojson']) {
    for (const base of [packages, artifact]) fs.mkdirSync(path.join(base, pkg, 'src/data'), { recursive: true });
    fs.writeFileSync(path.join(packages, pkg, 'src/data/retired.json'), '[1]');
    fs.writeFileSync(path.join(packages, pkg, 'README.md'), 'keep');
    fs.writeFileSync(path.join(artifact, pkg, 'src/data/current.json'), '[2]');
  }
  return { packages, artifact };
}

test('artifact replacement removes retired files while preserving package code and docs', (t) => {
  const { packages, artifact } = fixture(t);
  applyGeneratedData(artifact, packages);
  for (const pkg of ['countries', 'geojson']) {
    assert.deepEqual(fs.readdirSync(path.join(packages, pkg, 'src/data')), ['current.json']);
    assert.equal(fs.readFileSync(path.join(packages, pkg, 'src/data/current.json'), 'utf8'), '[2]');
    assert.equal(fs.readFileSync(path.join(packages, pkg, 'README.md'), 'utf8'), 'keep');
  }
});

test('missing or empty artifact packages fail before touching any existing data', (t) => {
  const { packages, artifact } = fixture(t);
  fs.rmSync(path.join(artifact, 'geojson/src/data/current.json'));
  assert.throws(() => applyGeneratedData(artifact, packages), /Missing or empty generated data for geojson/);
  fs.rmSync(path.join(artifact, 'geojson'), { recursive: true });
  assert.throws(() => applyGeneratedData(artifact, packages), /Missing or empty generated data for geojson/);
  for (const pkg of ['countries', 'geojson']) {
    assert.deepEqual(fs.readdirSync(path.join(packages, pkg, 'src/data')), ['retired.json']);
  }
});

test('every generated-data consumer downloads separately and applies the replacement', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/ci.yml'), 'utf8');
  assert.equal((workflow.match(/path: \$\{\{ runner.temp \}\}\/generated-data/g) || []).length, 4);
  assert.equal((workflow.match(/run: node scripts\/apply-generated-data.cjs/g) || []).length, 4);
});
