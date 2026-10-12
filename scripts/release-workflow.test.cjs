/** Regression tests execute the release workflow's actual shell steps. */
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/release.yml'), 'utf8');

/** Extract a literal run block so tests cannot drift from the workflow. */
function step(name, event = 'pull_request') {
  const section = workflow.split(`      - name: ${name}\n`)[1];
  assert.ok(section, `Missing workflow step: ${name}`);
  return section.split('        run: |\n')[1].split(/\n      - /)[0]
    .replace(/^          /gm, '').replaceAll('${{ github.event_name }}', event);
}

/** Build a tiny repository with a data PR and a version raised in that PR. */
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-release-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
  git('init', '--quiet');
  const write = (file, value) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), value);
  };
  const commit = () => {
    git('add', '.');
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'fixture');
    return git('rev-parse', 'HEAD');
  };
  for (const pkg of ['countries', 'translations', 'phonecodes']) {
    write(`packages/${pkg}/package.json`, JSON.stringify({ name: `@countrystatecity/${pkg}`, version: '1.0.4' }));
    write(`packages/${pkg}/src/data/data.json`, '[1]');
  }
  commit();
  write('packages/countries/src/data/data.json', '[2]');
  write('packages/translations/src/data/data.json', '[2]');
  write('packages/countries/package.json', JSON.stringify({ name: '@countrystatecity/countries', version: '2.0.0' }));
  write('packages/countries/CHANGELOG.md', '# Countries\n\n## 2.0.0\n\n### Major Changes\n\n- Migrate stored ids.\n');
  const merge = commit();
  const output = path.join(dir, 'output');
  const run = (name, env = {}, event) => spawnSync('bash', ['-e', '-o', 'pipefail', '-c', step(name, event)], {
    cwd: dir, encoding: 'utf8', env: { ...process.env, MERGE_SHA: merge, GITHUB_OUTPUT: output, ...env },
  });
  return { dir, output, merge, write, commit, run };
}

test('release scope includes only changed package data, deduplicated', (t) => {
  const f = fixture(t);
  const result = f.run('Determine release scope');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(f.output, 'utf8'), 'packages=countries translations \n');
});

test('manifest-only merges release nothing; manual dispatch releases all packages', (t) => {
  const f = fixture(t);
  f.write('data-manifest.json', '{}');
  const merge = f.commit();
  assert.equal(f.run('Determine release scope', { MERGE_SHA: merge }).status, 0);
  assert.equal(fs.readFileSync(f.output, 'utf8'), 'packages=\n');
  const result = f.run('Determine release scope', { MERGE_SHA: '' }, 'workflow_dispatch');
  assert.equal(result.status, 0, result.stderr);
  assert.match(fs.readFileSync(f.output, 'utf8'), /packages=countries countries-browser timezones currencies translations phonecodes postalcodes geojson cli sdk/);
});

test('failed release diffs fail the job without writing an empty scope', (t) => {
  const f = fixture(t);
  const result = f.run('Determine release scope', { MERGE_SHA: 'missing-merge' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /bad revision|unknown revision|ambiguous argument/);
  assert.equal(fs.existsSync(f.output), false);
});

test('release retains a PR major and its migration notes, and patch-bumps unchanged versions', (t) => {
  const f = fixture(t);
  const notes = fs.readFileSync(path.join(f.dir, 'packages/countries/CHANGELOG.md'), 'utf8');
  const env = { PACKAGES: 'countries translations' };
  let result = f.run('Bump versions unless already raised by the PR', env);
  assert.equal(result.status, 0, result.stderr);
  const version = (pkg) => JSON.parse(fs.readFileSync(path.join(f.dir, `packages/${pkg}/package.json`))).version;
  assert.equal(version('countries'), '2.0.0');
  assert.equal(version('translations'), '1.0.5');
  assert.equal(version('phonecodes'), '1.0.4');
  result = f.run('Update CHANGELOGs', env);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(f.dir, 'packages/countries/CHANGELOG.md'), 'utf8'), notes);
  assert.match(fs.readFileSync(path.join(f.dir, 'packages/translations/CHANGELOG.md'), 'utf8'), /## 1\.0\.5\n\n### Patch Changes/);
});

test('release rejects version decreases', (t) => {
  const f = fixture(t);
  f.write('packages/countries/package.json', JSON.stringify({ name: '@countrystatecity/countries', version: '1.0.3' }));
  const result = f.run('Bump versions unless already raised by the PR', { PACKAGES: 'countries' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Version decreased/);
});

test('manual releases still bump patches', (t) => {
  const f = fixture(t);
  const result = f.run('Bump versions unless already raised by the PR', { PACKAGES: 'countries', MERGE_SHA: '' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.dir, 'packages/countries/package.json'))).version, '2.0.1');
});

test('pre-versioned releases succeed when there is nothing left to commit', (t) => {
  const f = fixture(t);
  const result = f.run('Commit and push');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /PR already contains the release versions and changelogs/);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: f.dir, encoding: 'utf8' }).trim(), f.merge);
});
