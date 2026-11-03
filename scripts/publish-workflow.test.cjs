/** Exercise the publish gate without contacting GitHub or publishing anything. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/publish.yml'), 'utf8');
const gate = workflow.split('      - name: Check release job\n')[1]
  .split('        run: |\n')[1].split('\n  build:')[0].replace(/^          /gm, '');

/** Run the actual shell gate with a local stand-in for the GitHub API client. */
function check(t, conclusion, event = 'workflow_run', status = 0) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-publish-gate-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'gh'), `#!/bin/sh
if [ "$MOCK_STATUS" != 0 ]; then exit "$MOCK_STATUS"; fi
case "$*" in
  *'/jobs?'*) printf '%s' "$MOCK_CONCLUSION" ;;
  *'/compare/'*) printf '%s' "\${MOCK_COMPARISON:-identical}" ;;
  'run download'*)
    mkdir -p "$RUNNER_TEMP/release-commit"
    printf '%s' "$GITHUB_SHA" > "$RUNNER_TEMP/release-commit/release-commit.txt"
    printf '%s' countries > "$RUNNER_TEMP/release-commit/packages.txt" ;;
esac
`, { mode: 0o755 });
  const output = path.join(dir, 'output');
  const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', gate], {
    encoding: 'utf8',
    env: {
      ...process.env, PATH: `${dir}:${process.env.PATH}`, GITHUB_OUTPUT: output,
      GITHUB_REPOSITORY: 'test/repo', RELEASE_RUN_ID: '123', EVENT_NAME: event,
      GITHUB_SHA: 'a'.repeat(40), RUNNER_TEMP: dir,
      MOCK_CONCLUSION: conclusion, MOCK_STATUS: String(status),
    },
  });
  return { ...result, output: fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : '' };
}

test('skipped, missing, failed and cancelled release jobs cannot auto-publish', (t) => {
  assert.match(workflow, /needs: verify-release\n    if: needs\.verify-release\.outputs\.proceed == 'true'/);
  for (const conclusion of ['skipped', '', 'failure', 'cancelled', 'success\nskipped']) {
    const result = check(t, conclusion);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.output, 'proceed=false\n');
  }
});

test('only a successful release job permits automatic publishing', (t) => {
  const result = check(t, 'success');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.output, `commit=${'a'.repeat(40)}\nproceed=true\n`);
});

test('API errors fail closed', (t) => {
  const result = check(t, '', 'workflow_run', 1);
  assert.notEqual(result.status, 0);
  assert.equal(result.output, '');
});

test('manual dispatch pins and validates the requested main commit', (t) => {
  const result = check(t, '', 'workflow_dispatch');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.output, `commit=${'a'.repeat(40)}\nproceed=true\n`);
  assert.notEqual(check(t, '', 'workflow_dispatch', 1).status, 0);
});

/** Run the actual publishing step with fake registry and npm clients. */
function publish(t, http, npmStatus = 0, replacementHttp = http, { queueAll = false, deadline = 900, validIntegrity = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-publisher-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const executable = (name, content) => fs.writeFileSync(path.join(dir, name), `#!/bin/sh\n${content}\n`, { mode: 0o755 });
  executable('sha256sum', 'exit 0'); // Digest enforcement is also exercised on real archives separately.
  executable('gh', 'case "$*" in "release view"*) exit 1 ;; "release create"*) printf "%s\\n" "$*" >> "$TEST_DIR/releases" ;; esac');
  executable('curl', `COUNT=0
if [ -f "$TEST_DIR/request" ]; then COUNT=$(cat "$TEST_DIR/request"); fi
COUNT=$((COUNT + 1)); printf '%s' "$COUNT" > "$TEST_DIR/request"
if [ "$MOCK_QUEUE_ALL" = true ] && [ "$COUNT" -le 10 ]; then printf '%s' 404
elif [ "$COUNT" = 1 ]; then printf '%s' "$MOCK_HTTP"
else printf '%s' "$MOCK_NEXT_HTTP"; fi
printf '{"dist":{"integrity":"%s","attestations":{"url":"https://registry.npmjs.org/attestations"}}}' "$MOCK_INTEGRITY" > metadata.json`);
  executable('npm', 'printf "%s\\n" "$*" >> "$TEST_DIR/npm-calls"\nexit "$MOCK_NPM_STATUS"');
  const sha = 'a'.repeat(40);
  fs.writeFileSync(path.join(dir, 'source-sha.txt'), sha);
  fs.writeFileSync(path.join(dir, 'SHA256SUMS'), '');
  for (const pkg of ['countries', 'countries-browser', 'timezones', 'currencies', 'translations', 'phonecodes', 'postalcodes', 'geojson', 'cli', 'sdk']) {
    fs.writeFileSync(path.join(dir, `countrystatecity-${pkg}-1.0.0.tgz`), 'test archive');
  }
  const script = workflow.split('      - name: Verify and publish\n')[1]
    .split('        run: |\n')[1].replace(/^          /gm, '')
    .replace('SECONDS + 900', `SECONDS + ${deadline}`);
  const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
    cwd: dir, encoding: 'utf8',
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, TEST_DIR: dir,
      GITHUB_SHA: sha, EXPECTED_COMMIT: sha, GITHUB_REPOSITORY: 'test/repo',
      MOCK_HTTP: http, MOCK_NEXT_HTTP: replacementHttp, MOCK_NPM_STATUS: String(npmStatus), MOCK_QUEUE_ALL: String(queueAll),
      MOCK_INTEGRITY: validIntegrity ? `sha512-${crypto.createHash('sha512').update('test archive').digest('base64')}` : 'sha512-tampered' },
  });
  return { ...result, calls: fs.existsSync(path.join(dir, 'npm-calls')) ? fs.readFileSync(path.join(dir, 'npm-calls'), 'utf8') : '',
    releases: fs.existsSync(path.join(dir, 'releases')) ? fs.readFileSync(path.join(dir, 'releases'), 'utf8') : '' };
}

test('registry errors never trigger publishing and existing versions are skipped', t => {
  for (const http of ['403', '429', '500', '503']) {
    const result = publish(t, http);
    assert.notEqual(result.status, 0);
    assert.equal(result.calls, '');
  }
  const result = publish(t, '200');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.calls, '');
  assert.equal(result.releases, '');
});

test('queues uploads before waiting for processing, but never succeeds with mismatched bytes', t => {
  const result = publish(t, '404', 0, '200', { queueAll: true });
  assert.notEqual(result.status, 0);
  assert.equal(result.calls.split('\n').filter(Boolean).length, 10);
  assert.equal(result.releases, '');
});

test('processing timeout fails closed without retrying accepted uploads', t => {
  const result = publish(t, '404', 0, '404', { queueAll: true, deadline: 0 });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /Publication not yet visible; inspect before retrying/);
  assert.equal(result.calls.split('\n').filter(Boolean).length, 10);
  assert.equal(result.releases, '');
});

test('announces releases only after all accepted uploads pass integrity and provenance checks', t => {
  const result = publish(t, '404', 0, '200', { queueAll: true, validIntegrity: true });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.calls.split('\n').filter(Boolean).length, 10);
  assert.equal(result.releases.split('\n').filter(Boolean).length, 10);
});

test('OIDC failure stops without fallback, and a mismatched published archive fails verification', t => {
  const rejected = publish(t, '404', 1);
  assert.notEqual(rejected.status, 0);
  assert.equal(rejected.calls.split('\n').filter(Boolean).length, 1);
  assert.match(rejected.calls, /--provenance --ignore-scripts/);
  const tampered = publish(t, '404', 0, '200');
  assert.notEqual(tampered.status, 0);
  assert.equal(tampered.calls.split('\n').filter(Boolean).length, 1);
});
