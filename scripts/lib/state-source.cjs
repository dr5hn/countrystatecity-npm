/** Read full state records from the export tag's exact Git commit, not master. */
const crypto = require('node:crypto');
const fs = require('node:fs');
const { sha256 } = require('./download.cjs');

const REPO = 'dr5hn/countries-states-cities-database';
const FILE = 'contributions/states/states.json';

/** Verify GitHub's blob identity before returning parsed state records. */
function verifyStateContent(content, blobSha) {
  const actual = crypto.createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
  if (!/^[0-9a-f]{40}$/.test(blobSha ?? '') || actual !== blobSha) throw new Error('Full state source Git blob checksum mismatch');
  const states = JSON.parse(content.toString('utf8'));
  if (!Array.isArray(states) || !states.length) throw new Error('Full state source must be a nonempty array');
  return states;
}

/** Download the state file at the release tag commit and record its provenance. */
async function downloadStateSource({ tag, destPath, token, fetchImpl = fetch }) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'countrystatecity-monorepo', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const api = async endpoint => {
    const response = await fetchImpl(`https://api.github.com/repos/${REPO}/${endpoint}`, { headers, signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`State source metadata HTTP ${response.status}`);
    return response.json();
  };
  let object = (await api(`git/ref/tags/${encodeURIComponent(tag)}`)).object;
  for (let depth = 0; object?.type === 'tag' && depth < 5; depth++) {
    if (!/^[0-9a-f]{40}$/.test(object.sha ?? '')) throw new Error('Invalid state source tag object');
    object = (await api(`git/tags/${object.sha}`)).object;
  }
  if (object?.type !== 'commit' || !/^[0-9a-f]{40}$/.test(object.sha ?? '')) throw new Error('State source tag must resolve to a Git commit');
  const sourceCommit = object.sha;
  const metadata = await api(`contents/${FILE}?ref=${sourceCommit}`);
  const url = `https://raw.githubusercontent.com/${REPO}/${sourceCommit}/${FILE}`;
  // Never forward the GitHub token to a downloaded URL.
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`State source download HTTP ${response.status}`);
  const content = Buffer.from(await response.arrayBuffer());
  const states = verifyStateContent(content, metadata.sha);
  fs.writeFileSync(destPath, content);
  return { asset: FILE, role: 'states-full', url, sourceCommit, gitBlobSha: metadata.sha,
    contentSha256: sha256(content), decompressedBytes: content.length, recordCount: states.length };
}

/** Join FIPS values by stable identity, rejecting missing, duplicate or mismatched states. */
function joinStateFields(countries, fullStates) {
  const byId = new Map();
  for (const state of fullStates) {
    if (!Number.isInteger(state.id) || state.id <= 0 || byId.has(state.id)) throw new Error(`Invalid or duplicate full state ID: ${state.id}`);
    if (state.fips_code != null && typeof state.fips_code !== 'string') throw new Error(`Invalid FIPS value for state ${state.id}`);
    byId.set(state.id, state);
  }
  const seen = new Set();
  let withFips = 0;
  for (const country of countries) for (const state of country.states ?? []) {
    const full = byId.get(state.id);
    if (!full || seen.has(state.id) || full.country_id !== country.id || full.country_code !== country.iso2 || full.iso2 !== state.iso2) {
      throw new Error(`Combined/full state identity mismatch: ${state.id}`);
    }
    state.fips_code = full.fips_code ?? null;
    if (state.fips_code !== null) withFips++;
    seen.add(state.id);
  }
  if (seen.size !== fullStates.length) throw new Error('Combined/full state coverage mismatch');
  return { totalStates: seen.size, withFips };
}

module.exports = { downloadStateSource, verifyStateContent, joinStateFields };
