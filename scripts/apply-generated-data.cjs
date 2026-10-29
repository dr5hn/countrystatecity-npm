/** Replace generated datasets after artifact download, including deletions. */
const fs = require('node:fs');
const path = require('node:path');
const { beginStagedWrite } = require('./lib/staged-write.cjs');

/** Validate the complete artifact before replacing any package data directory. */
function applyGeneratedData(sourceDir, packagesDir = path.join(__dirname, '../packages')) {
  if (!sourceDir) throw new Error('Generated-data artifact directory is required');
  const packages = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(packagesDir, entry.name, 'src/data')))
    .map((entry) => entry.name);
  if (packages.length === 0) throw new Error('No package data directories found');
  for (const pkg of packages) {
    const source = path.join(sourceDir, pkg, 'src/data');
    if (!fs.existsSync(source) || !fs.statSync(source).isDirectory() || fs.readdirSync(source).length === 0) {
      throw new Error(`Missing or empty generated data for ${pkg}`);
    }
  }
  for (const pkg of packages) {
    const { stagingDir, commit, discard } = beginStagedWrite(path.join(packagesDir, pkg, 'src/data'));
    try {
      fs.cpSync(path.join(sourceDir, pkg, 'src/data'), stagingDir, { recursive: true });
      commit();
      for (const file of fs.readdirSync(path.join(sourceDir, pkg)).filter(name => /^NOTICE-[A-Za-z0-9_.-]+\.txt$/.test(name))) {
        fs.copyFileSync(path.join(sourceDir, pkg, file), path.join(packagesDir, pkg, file));
      }
    } finally {
      discard();
    }
  }
}

module.exports = { applyGeneratedData };
if (require.main === module) {
  try {
    applyGeneratedData(process.argv[2]);
  } catch (error) {
    console.error(`Failed to apply generated data: ${error.message}`);
    process.exitCode = 1;
  }
}
