/** Exercise the publish gate without contacting GitHub or publishing anything. */
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/publish.yml'), 'utf8');
const gate = workflow.split('      - name: Check release job\n')[1]
  .split('        run: |\n')[1].split('\n  publish:')[0].replace(/^          /gm, '');

/** Run the actual shell gate with a local stand-in for the GitHub API client. */
function check(t, conclusion, event = 'workflow_run', status = 0) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-publish-gate-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'gh'), '#!/bin/sh\nprintf "%s" "$MOCK_CONCLUSION"\nexit "$MOCK_STATUS"\n', { mode: 0o755 });
  const output = path.join(dir, 'output');
  const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', gate], {
    encoding: 'utf8',
    env: {
      ...process.env, PATH: `${dir}:${process.env.PATH}`, GITHUB_OUTPUT: output,
      GITHUB_REPOSITORY: 'test/repo', RELEASE_RUN_ID: '123', EVENT_NAME: event,
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
  assert.equal(result.output, 'proceed=true\n');
});

test('API errors fail closed', (t) => {
  const result = check(t, '', 'workflow_run', 1);
  assert.notEqual(result.status, 0);
  assert.equal(result.output, '');
});

test('explicit manual dispatch remains available without an API request', (t) => {
  const result = check(t, '', 'workflow_dispatch', 1);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.output, 'proceed=true\n');
});
