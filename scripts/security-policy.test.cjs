/** Guard security-sensitive workflow settings against accidental regression. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('all external Actions are pinned and workflow defaults are read-only', () => {
  for (const file of fs.readdirSync(path.join(root, '.github/workflows'))) {
    const yaml = read(`.github/workflows/${file}`);
    assert.match(yaml, /^permissions:\n  contents: read$/m, file);
    assert.doesNotMatch(yaml, /pull_request_target|secrets\.NPM_TOKEN/, file);
    for (const [, action] of yaml.matchAll(/uses: ([^\s#]+)/g)) assert.match(action, /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/, file);
    for (const command of yaml.matchAll(/run: (pnpm install[^\n]*)/g)) {
      assert.match(command[1], /--frozen-lockfile/);
      assert.match(command[1], /--ignore-scripts/);
    }
  }
});

test('only the isolated publisher gets OIDC; release builds have no cache or credentials', () => {
  const yaml = read('.github/workflows/publish.yml');
  const build = yaml.split('\n  build:')[1].split('\n  publish:')[0];
  const publish = yaml.split('\n  publish:')[1];
  assert.doesNotMatch(build, /id-token: write|contents: write|secrets\.|cache: pnpm/);
  assert.match(build, /ref: \$\{\{ needs.verify-release.outputs.commit \}\}/);
  assert.match(build, /pnpm audit signatures/);
  assert.match(publish, /id-token: write/);
  assert.doesNotMatch(publish, /actions\/checkout@|pnpm install|pnpm build|NODE_AUTH_TOKEN|NPM_TOKEN/);
  assert.match(publish, /npm publish .*--provenance --ignore-scripts/);
  assert.match(publish, /elif \[ "\$HTTP" != '200' \]/);
  assert.match(publish, /\.dist.integrity/);
  assert.match(publish, /\.dist.attestations.url/);
});

test('dependency cooldown and script restrictions remain enabled', () => {
  const yaml = read('pnpm-workspace.yaml');
  assert.match(yaml, /^minimumReleaseAge: 4320$/m);
  assert.match(yaml, /^minimumReleaseAgeStrict: true$/m);
  assert.match(yaml, /^minimumReleaseAgeIgnoreMissingTime: false$/m);
  assert.match(yaml, /^trustPolicy: no-downgrade$/m);
  assert.match(yaml, /^ignoreScripts: true$/m);
  assert.match(yaml, /^pnpmfile: \[\]$/m);
  assert.doesNotMatch(yaml, /minimumReleaseAgeExclude:|trustLockfile: true|dangerouslyAllowAllBuilds: true/);
});
