/** Regression coverage for pinned full-state downloads and the FIPS identity join. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { downloadStateSource, verifyStateContent, joinStateFields } = require('./state-source.cjs');

const source = { id: 10, country_id: 1, country_code: 'AA', iso2: 'S', fips_code: '01' };
const countries = () => [{ id: 1, iso2: 'AA', states: [{ id: 10, iso2: 'S' }] }];

test('joins FIPS as strings, preserving zero prefixes and nulls', () => {
  const rows = countries();
  assert.deepEqual(joinStateFields(rows, [source]), { totalStates: 1, withFips: 1 });
  assert.equal(rows[0].states[0].fips_code, '01');
  joinStateFields(rows, [{ ...source, fips_code: null }]);
  assert.equal(rows[0].states[0].fips_code, null);
});

test('rejects missing, duplicate, extra and mismatched states or invalid FIPS values', () => {
  for (const rows of [[], [source, source], [{ ...source, id: 20 }], [{ ...source, country_code: 'BB' }],
    [{ ...source, iso2: 'X' }], [{ ...source, fips_code: 1 }], [source, { ...source, id: 20 }]]) {
    assert.throws(() => joinStateFields(countries(), rows));
  }
});

test('state content requires the exact Git blob checksum', () => {
  const content = Buffer.from(JSON.stringify([source]));
  const hash = crypto.createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
  assert.deepEqual(verifyStateContent(content, hash), [source]);
  assert.throws(() => verifyStateContent(content, '0'.repeat(40)), /checksum mismatch/);
});

test('resolves an annotated tag, downloads by commit, and keeps credentials on the API host', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'state-source-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const content = Buffer.from(JSON.stringify([source]));
  const blob = crypto.createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
  const commit = 'a'.repeat(40);
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push(url);
    if (url.includes('/git/ref/')) return Response.json({ object: { type: 'tag', sha: 'b'.repeat(40) } });
    if (url.includes('/git/tags/')) return Response.json({ object: { type: 'commit', sha: commit } });
    if (url.includes('/contents/')) { assert.ok(url.endsWith(`?ref=${commit}`)); return Response.json({ sha: blob }); }
    assert.ok(url.includes(`/${commit}/`));
    assert.equal(options.headers?.Authorization, undefined);
    return new Response(content);
  };
  const result = await downloadStateSource({ tag: 'v5.2.0-export.1', destPath: path.join(dir, 'states.json'), token: 'test-token', fetchImpl });
  assert.equal(result.sourceCommit, commit);
  assert.equal(result.gitBlobSha, blob);
  assert.equal(calls.length, 4);
});
