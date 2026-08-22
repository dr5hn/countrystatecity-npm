/**
 * Stage-then-atomic-swap helper for destructive data generators — satisfies
 * "prepare new files in a temporary location first, replace live files only
 * after all checks pass" / "a failed update never replaces the old data."
 *
 * The staging directory is a SIBLING of `finalDir` (same parent, same
 * filesystem/volume) rather than the OS temp dir, because fs.renameSync is
 * only atomic within a single filesystem — renaming across filesystems
 * throws EXDEV.
 */

const fs = require('fs');
const path = require('path');

/**
 * @param {string} finalDir - the live directory a generator is about to replace
 * @returns {{stagingDir: string, commit: () => void, discard: () => void}}
 */
function beginStagedWrite(finalDir) {
  const stagingDir = `${finalDir}.staging-${process.pid}-${Date.now()}`;
  // Best-effort cleanup of an orphaned staging dir left by a prior crash.
  fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.mkdirSync(stagingDir, { recursive: true });

  function commit() {
    fs.mkdirSync(path.dirname(finalDir), { recursive: true });

    const backupDir = `${finalDir}.bak-${process.pid}`;
    fs.rmSync(backupDir, { recursive: true, force: true });

    const hadExisting = fs.existsSync(finalDir);
    if (hadExisting) {
      fs.renameSync(finalDir, backupDir);
    }

    try {
      fs.renameSync(stagingDir, finalDir);
    } catch (err) {
      // Roll back immediately so the live directory is never left missing.
      if (hadExisting) fs.renameSync(backupDir, finalDir);
      throw err;
    }

    if (hadExisting) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
  }

  function discard() {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }

  return { stagingDir, commit, discard };
}

module.exports = { beginStagedWrite };
