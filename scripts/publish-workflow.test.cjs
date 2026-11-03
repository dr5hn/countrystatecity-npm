/** Exercise the publish gate without contacting GitHub or publishing anything. */
const assert = require('node:assert/strict');
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
function publish(t, http, npmStatus = 0, replacementHttp = http) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-publisher-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const executable = (name, content) => fs.writeFileSync(path.join(dir, name), `#!/bin/sh\n${content}\n`, { mode: 0o755 });
  executable('sha256sum', 'exit 0'); // Digest enforcement is also exercised on real archives separately.
  executable('gh', 'exit 0');
  executable('curl', `if [ -f "$TEST_DIR/request" ]; then printf '%s' "$MOCK_NEXT_HTTP"; else touch "$TEST_DIR/request"; printf '%s' "$MOCK_HTTP"; fi
printf '%s' '{"dist":{"integrity":"sha512-tampered","attestations":{"url":"https://registry.npmjs.org/attestations"}}}' > metadata.json`);
  executable('npm', 'printf "%s\\n" "$*" >> "$TEST_DIR/npm-calls"\nexit "$MOCK_NPM_STATUS"');
  const sha = 'a'.repeat(40);
  fs.writeFileSync(path.join(dir, 'source-sha.txt'), sha);
  fs.writeFileSync(path.join(dir, 'SHA256SUMS'), '');
  for (const pkg of ['countries', 'countries-browser', 'timezones', 'currencies', 'translations', 'phonecodes', 'postalcodes', 'geojson', 'cli', 'sdk']) {
    fs.writeFileSync(path.join(dir, `countrystatecity-${pkg}-1.0.0.tgz`), 'test archive');
  }
  const script = workflow.split('      - name: Verify and publish\n')[1]
    .split('        run: |\n')[1].replace(/^          /gm, '');
  const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
    cwd: dir, encoding: 'utf8',
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, TEST_DIR: dir,
      GITHUB_SHA: sha, EXPECTED_COMMIT: sha, GITHUB_REPOSITORY: 'test/repo',
      MOCK_HTTP: http, MOCK_NEXT_HTTP: replacementHttp, MOCK_NPM_STATUS: String(npmStatus) },
  });
  return { ...result, calls: fs.existsSync(path.join(dir, 'npm-calls')) ? fs.readFileSync(path.join(dir, 'npm-calls'), 'utf8') : '' };
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
