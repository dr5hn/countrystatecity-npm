const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { beginStagedWrite } = require('./staged-write.cjs');

function tmpBase(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'staged-write-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('stagingDir is a sibling of finalDir (same parent, for atomic same-filesystem rename)', (t) => {
  const base = tmpBase(t);
  const finalDir = path.join(base, 'pkg', 'src', 'data');
  const { stagingDir, discard } = beginStagedWrite(finalDir);

  assert.equal(path.dirname(stagingDir), path.dirname(finalDir));
  assert.ok(fs.existsSync(stagingDir));
  discard();
});

test('commit() replaces an existing finalDir with the staged content', (t) => {
  const base = tmpBase(t);
  const finalDir = path.join(base, 'data');
  fs.mkdirSync(finalDir, { recursive: true });
  fs.writeFileSync(path.join(finalDir, 'old.json'), 'old');

  const { stagingDir, commit } = beginStagedWrite(finalDir);
  fs.writeFileSync(path.join(stagingDir, 'new.json'), 'new');
  commit();

  assert.deepEqual(fs.readdirSync(finalDir), ['new.json']);
  assert.equal(fs.readFileSync(path.join(finalDir, 'new.json'), 'utf-8'), 'new');
  assert.equal(fs.existsSync(`${finalDir}.bak-${process.pid}`), false);
});

test('commit() creates finalDir when it did not exist before (first run)', (t) => {
  const base = tmpBase(t);
  const finalDir = path.join(base, 'brand-new', 'data');

  const { stagingDir, commit } = beginStagedWrite(finalDir);
  fs.writeFileSync(path.join(stagingDir, 'file.json'), 'content');
  commit();

  assert.equal(fs.readFileSync(path.join(finalDir, 'file.json'), 'utf-8'), 'content');
});

test('a run that never calls commit() (simulated crash) leaves finalDir completely untouched', (t) => {
  const base = tmpBase(t);
  const finalDir = path.join(base, 'data');
  fs.mkdirSync(finalDir, { recursive: true });
  fs.writeFileSync(path.join(finalDir, 'original.json'), 'original-content');

  const { stagingDir } = beginStagedWrite(finalDir);
  fs.writeFileSync(path.join(stagingDir, 'partial.json'), 'partial-content');
  // Simulated crash: commit() is never called.

  assert.deepEqual(fs.readdirSync(finalDir), ['original.json']);
  assert.equal(fs.readFileSync(path.join(finalDir, 'original.json'), 'utf-8'), 'original-content');
});

test('discard() removes the staging dir and leaves finalDir untouched', (t) => {
  const base = tmpBase(t);
  const finalDir = path.join(base, 'data');
  fs.mkdirSync(finalDir, { recursive: true });
  fs.writeFileSync(path.join(finalDir, 'original.json'), 'original-content');

  const { stagingDir, discard } = beginStagedWrite(finalDir);
  fs.writeFileSync(path.join(stagingDir, 'partial.json'), 'partial-content');
  discard();

  assert.equal(fs.existsSync(stagingDir), false);
  assert.deepEqual(fs.readdirSync(finalDir), ['original.json']);
});

test('rolls back to the original content if the final rename step fails', (t) => {
  const base = tmpBase(t);
  const finalDir = path.join(base, 'data');
  fs.mkdirSync(finalDir, { recursive: true });
  fs.writeFileSync(path.join(finalDir, 'original.json'), 'original-content');

  const { stagingDir, commit } = beginStagedWrite(finalDir);
  fs.writeFileSync(path.join(stagingDir, 'new.json'), 'new-content');
  // Force the staging->final rename to fail by removing the staging dir out from under it.
  fs.rmSync(stagingDir, { recursive: true, force: true });

  assert.throws(commit);
  assert.deepEqual(fs.readdirSync(finalDir), ['original.json']);
  assert.equal(fs.readFileSync(path.join(finalDir, 'original.json'), 'utf-8'), 'original-content');
});
