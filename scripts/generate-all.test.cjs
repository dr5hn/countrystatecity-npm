const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { runParallel } = require('./generate-all.cjs');

test('runParallel waits for every child before reporting failures', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-all-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const failingScript = path.join(dir, 'fail.cjs');
  const writingScript = path.join(dir, 'write.cjs');
  const marker = path.join(dir, 'complete');
  fs.writeFileSync(failingScript, 'process.exit(2);');
  fs.writeFileSync(
    writingScript,
    "setTimeout(() => require('node:fs').writeFileSync(process.argv[2], 'done'), 100);",
  );

  await assert.rejects(
    runParallel([
      { label: 'failing child', args: [failingScript], cwd: dir },
      { label: 'writing child', args: [writingScript, marker], cwd: dir },
    ]),
    /failing child failed/,
  );
  assert.equal(fs.readFileSync(marker, 'utf8'), 'done');
});
