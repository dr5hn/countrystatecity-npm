const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

const { downloadGzipAsset, sha256 } = require('./download.cjs');

function tmpDest(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'download-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return path.join(dir, 'out.json');
}

test('downloads, decompresses, and integrity-checks a well-formed gzip asset', async (t) => {
  const content = Buffer.from(JSON.stringify({ hello: 'world' }));
  const compressed = zlib.gzipSync(content);
  const destPath = tmpDest(t);

  const fetchImpl = async () => new Response(compressed, { status: 200 });

  const result = await downloadGzipAsset({ url: 'https://x/asset.gz', destPath, fetchImpl });

  assert.equal(fs.readFileSync(destPath, 'utf-8'), content.toString('utf-8'));
  assert.equal(result.contentSha256, crypto.createHash('sha256').update(content).digest('hex'));
  assert.equal(result.compressedSha256, crypto.createHash('sha256').update(compressed).digest('hex'));
  assert.equal(result.decompressedBytes, content.length);
  assert.equal(result.compressedBytes, compressed.length);
});

test('leaves no output file and throws on a non-200 response', async (t) => {
  const destPath = tmpDest(t);
  const fetchImpl = async () => new Response('not found', { status: 404 });

  await assert.rejects(downloadGzipAsset({ url: 'https://x/asset.gz', destPath, fetchImpl }), /HTTP 404/);
  assert.equal(fs.existsSync(destPath), false);
});

test('rejects an empty response body without writing a file', async (t) => {
  const destPath = tmpDest(t);
  const fetchImpl = async () => new Response(Buffer.alloc(0), { status: 200 });

  await assert.rejects(downloadGzipAsset({ url: 'https://x/asset.gz', destPath, fetchImpl }), /empty file/);
  assert.equal(fs.existsSync(destPath), false);
});

test('rejects corrupt (non-gzip) bytes without writing a file — this is the "broken download" case', async (t) => {
  const destPath = tmpDest(t);
  const fetchImpl = async () => new Response(Buffer.from('this is not gzip data'), { status: 200 });

  await assert.rejects(downloadGzipAsset({ url: 'https://x/asset.gz', destPath, fetchImpl }), /decompress/);
  assert.equal(fs.existsSync(destPath), false);
});

test('rejects a stalled download once the timeout elapses, without writing a file', async (t) => {
  const destPath = tmpDest(t);
  const fetchImpl = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    });

  await assert.rejects(downloadGzipAsset({ url: 'https://x/asset.gz', destPath, fetchImpl, timeoutMs: 20 }), /timed out/);
  assert.equal(fs.existsSync(destPath), false);
});

test('a re-fetch failure never disturbs a previously-good file at destPath', async (t) => {
  const destPath = tmpDest(t);
  fs.writeFileSync(destPath, 'previously-good content');

  const fetchImpl = async () => new Response('boom', { status: 500 });
  await assert.rejects(downloadGzipAsset({ url: 'https://x/asset.gz', destPath, fetchImpl }));

  assert.equal(fs.readFileSync(destPath, 'utf-8'), 'previously-good content');
});

test('sha256() matches a known test vector', () => {
  assert.equal(sha256(Buffer.from('hello')), '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
});
