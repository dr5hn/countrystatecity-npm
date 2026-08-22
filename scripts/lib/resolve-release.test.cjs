const assert = require('node:assert/strict');
const test = require('node:test');

const { resolveLatestRelease, resolveReleaseByTag, requireAsset } = require('./resolve-release.cjs');

function fakeGithubResponse(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body };
}

test('resolveLatestRelease parses tag, publishedAt, htmlUrl, and an assets Map keyed by name', async () => {
  let capturedUrl;
  let capturedHeaders;
  const fetchImpl = async (url, init) => {
    capturedUrl = url;
    capturedHeaders = init.headers;
    return fakeGithubResponse({
      tag_name: 'v3.2-export.7',
      published_at: '2026-07-29T09:01:18Z',
      html_url: 'https://github.com/dr5hn/countries-states-cities-database/releases/tag/v3.2-export.7',
      assets: [
        { name: 'json-countries+states+cities.json.gz', browser_download_url: 'https://x/combined.gz', size: 100 },
        { name: 'json-cities.json.gz', browser_download_url: 'https://x/cities.gz', size: 200 },
      ],
    });
  };

  const release = await resolveLatestRelease({ repo: 'dr5hn/countries-states-cities-database', fetchImpl });

  assert.equal(release.tag, 'v3.2-export.7');
  assert.equal(release.publishedAt, '2026-07-29T09:01:18Z');
  assert.match(capturedUrl, /\/repos\/dr5hn\/countries-states-cities-database\/releases\/latest$/);
  assert.equal(capturedHeaders.Authorization, undefined);
  assert.deepEqual(release.assets.get('json-cities.json.gz'), { url: 'https://x/cities.gz', size: 200 });
});

test('resolveLatestRelease sends a bearer Authorization header when a token is supplied', async () => {
  let capturedHeaders;
  const fetchImpl = async (_url, init) => {
    capturedHeaders = init.headers;
    return fakeGithubResponse({ tag_name: 'v1', published_at: '2026-01-01T00:00:00Z', html_url: 'https://x', assets: [] });
  };

  await resolveLatestRelease({ token: 'secret-token', fetchImpl });
  assert.equal(capturedHeaders.Authorization, 'Bearer secret-token');
});

test('resolveLatestRelease throws with the HTTP status on a non-ok response', async () => {
  const fetchImpl = async () => fakeGithubResponse({}, { ok: false, status: 404 });
  await assert.rejects(resolveLatestRelease({ fetchImpl }), /HTTP 404/);
});

test('resolveLatestRelease throws when the response has no tag_name', async () => {
  const fetchImpl = async () => fakeGithubResponse({ assets: [] });
  await assert.rejects(resolveLatestRelease({ fetchImpl }), /missing tag_name/);
});

test('resolveReleaseByTag hits the tags/:tag endpoint, not /latest', async () => {
  let capturedUrl;
  const fetchImpl = async (url) => {
    capturedUrl = url;
    return fakeGithubResponse({
      tag_name: 'v3.2-export.6',
      published_at: '2026-07-01T00:00:00Z',
      html_url: 'https://x',
      assets: [{ name: 'json-postcodes.json.gz', browser_download_url: 'https://x/postcodes.gz', size: 50 }],
    });
  };

  const release = await resolveReleaseByTag({ tag: 'v3.2-export.6', fetchImpl });

  assert.match(capturedUrl, /\/releases\/tags\/v3\.2-export\.6$/);
  assert.equal(release.tag, 'v3.2-export.6');
  assert.deepEqual(release.assets.get('json-postcodes.json.gz'), { url: 'https://x/postcodes.gz', size: 50 });
});

test('resolveReleaseByTag URL-encodes the tag and throws without one', async () => {
  await assert.rejects(resolveReleaseByTag({ fetchImpl: async () => fakeGithubResponse({}) }), /requires a tag/);

  let capturedUrl;
  const fetchImpl = async (url) => {
    capturedUrl = url;
    return fakeGithubResponse({ tag_name: 'a/b', published_at: '2026-01-01T00:00:00Z', html_url: 'https://x', assets: [] });
  };
  await resolveReleaseByTag({ tag: 'a/b', fetchImpl });
  assert.ok(capturedUrl.endsWith('/releases/tags/a%2Fb'));
});

test('resolveReleaseByTag throws with the HTTP status and tag on a non-ok response', async () => {
  const fetchImpl = async () => fakeGithubResponse({}, { ok: false, status: 404 });
  await assert.rejects(resolveReleaseByTag({ tag: 'v9.9', fetchImpl }), /v9\.9.*HTTP 404/);
});

test('requireAsset returns the asset when present', () => {
  const release = { tag: 'v1', assets: new Map([['a.gz', { url: 'https://x/a.gz', size: 1 }]]) };
  assert.deepEqual(requireAsset(release, 'a.gz'), { url: 'https://x/a.gz', size: 1 });
});

test('requireAsset throws naming the release tag and the missing asset', () => {
  const release = { tag: 'v3.2-export.7', assets: new Map() };
  assert.throws(() => requireAsset(release, 'missing.gz'), /v3\.2-export\.7.*missing\.gz/);
});
