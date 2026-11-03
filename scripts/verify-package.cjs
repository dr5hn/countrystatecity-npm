/** Check the exact release archive without executing anything inside it. */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const PACKAGES = ['countries', 'countries-browser', 'timezones', 'currencies', 'translations', 'phonecodes', 'postalcodes', 'geojson', 'cli', 'sdk'];

/** Reject unexpected files, install hooks, identities, and dependency sources. */
function verifyPackage(archive, pkg, version, notices = ['NOTICE-SOURCES.txt']) {
  if (!PACKAGES.includes(pkg) || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid package identity');
  const files = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim().split('\n');
  const entries = execFileSync('tar', ['-tvzf', archive], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim().split('\n');
  if (entries.some(entry => !/^[d-]/.test(entry))) throw new Error('Packed links and special files are forbidden');
  for (const file of files) {
    if (!/^package\/(?:$|dist\/|package\.json$|README\.md$|CHANGELOG\.md$|LICENSE(?:\.md)?$|NOTICE-[A-Za-z0-9_.-]+\.txt$)/.test(file) ||
        file.split('/').some(part => part === '..' || part.startsWith('.') || part === 'node_modules') ||
        /\.(?:pem|key|p12|pfx)$/.test(file)) throw new Error(`Unexpected packed file: ${file}`);
  }
  const manifest = JSON.parse(execFileSync('tar', ['-xzOf', archive, 'package/package.json'], { encoding: 'utf8' }));
  if (manifest.name !== `@countrystatecity/${pkg}` || manifest.version !== version ||
      manifest.repository?.url !== 'git+https://github.com/dr5hn/countrystatecity-npm.git') throw new Error('Packed identity does not match release');
  for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) {
    if (manifest.scripts?.[hook]) throw new Error(`Install hook forbidden: ${hook}`);
  }
  for (const dependencies of [manifest.dependencies, manifest.optionalDependencies]) {
    for (const spec of Object.values(dependencies ?? {})) {
      if (typeof spec !== 'string' || !/^[\d~^*<>=| ]/.test(spec) || /(?:https?:|git|file:|link:|workspace:|npm:)/.test(spec)) throw new Error(`Non-registry dependency: ${spec}`);
    }
  }
  if (!files.some(file => file.startsWith('package/dist/'))) throw new Error('Missing built output');
  if (!['cli', 'sdk'].includes(pkg) && notices.some(name => !files.includes(`package/${name}`))) throw new Error('Missing source notices');
  return files.length;
}

module.exports = { verifyPackage };
if (require.main === module) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../data-manifest.json'), 'utf8'));
    const notices = ['NOTICE-SOURCES.txt', ...manifest.files.filter(file => file.role === 'notice').map(file => file.asset)];
    console.log(`Verified ${verifyPackage(...process.argv.slice(2), notices)} packed files`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
