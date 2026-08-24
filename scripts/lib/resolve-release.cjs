/**
 * Resolves an exact release of countries-states-cities-database via the
 * GitHub Releases API, so every asset downloaded in a run comes from the
 * SAME release even if upstream publishes a new one mid-run.
 */

const DEFAULT_API_BASE_URL = 'https://api.github.com';
const DEFAULT_REPO = 'dr5hn/countries-states-cities-database';

function buildHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'countrystatecity-monorepo',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function parseRelease(body, repo) {
  if (!body.tag_name) {
    throw new Error(`Unexpected release response from ${repo}: missing tag_name`);
  }

  const assets = new Map();
  for (const asset of body.assets ?? []) {
    assets.set(asset.name, { url: asset.browser_download_url, size: asset.size });
  }

  return {
    tag: body.tag_name,
    publishedAt: body.published_at,
    htmlUrl: body.html_url,
    assets,
  };
}

/**
 * @param {object} [options]
 * @param {string} [options.apiBaseUrl]
 * @param {string} [options.repo]
 * @param {string} [options.token] - optional token to avoid the unauthenticated GitHub API rate limit
 * @param {typeof fetch} [options.fetchImpl]
 * @returns {Promise<{tag: string, publishedAt: string, htmlUrl: string, assets: Map<string, {url: string, size: number}>}>}
 */
async function resolveLatestRelease(options = {}) {
  const { apiBaseUrl = DEFAULT_API_BASE_URL, repo = DEFAULT_REPO, token, fetchImpl = fetch } = options;

  const url = `${apiBaseUrl}/repos/${repo}/releases/latest`;
  const response = await fetchImpl(url, { headers: buildHeaders(token) });
  if (!response.ok) {
    throw new Error(`Failed to resolve latest release of ${repo}: HTTP ${response.status}`);
  }

  return parseRelease(await response.json(), repo);
}

/**
 * Resolves one SPECIFIC release by tag — used to look up an asset (e.g.
 * postcodes) within a release another script already pinned to, without
 * re-hitting /releases/latest and risking a different tag if upstream
 * published something new in between.
 *
 * @param {object} options
 * @param {string} options.tag
 * @param {string} [options.apiBaseUrl]
 * @param {string} [options.repo]
 * @param {string} [options.token]
 * @param {typeof fetch} [options.fetchImpl]
 * @returns {Promise<{tag: string, publishedAt: string, htmlUrl: string, assets: Map<string, {url: string, size: number}>}>}
 */
async function resolveReleaseByTag(options) {
  const { tag, apiBaseUrl = DEFAULT_API_BASE_URL, repo = DEFAULT_REPO, token, fetchImpl = fetch } = options;
  if (!tag) throw new Error('resolveReleaseByTag requires a tag');

  const url = `${apiBaseUrl}/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`;
  const response = await fetchImpl(url, { headers: buildHeaders(token) });
  if (!response.ok) {
    throw new Error(`Failed to resolve release ${tag} of ${repo}: HTTP ${response.status}`);
  }

  return parseRelease(await response.json(), repo);
}

/** Looks up a required asset by name, throwing a clear error naming the release if it's missing. */
function requireAsset(release, assetName) {
  const asset = release.assets.get(assetName);
  if (!asset) {
    throw new Error(`Release ${release.tag} does not contain expected asset "${assetName}"`);
  }
  return asset;
}

module.exports = {
  resolveLatestRelease,
  resolveReleaseByTag,
  requireAsset,
  DEFAULT_API_BASE_URL,
  DEFAULT_REPO,
};
