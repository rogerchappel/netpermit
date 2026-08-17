import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packagePath = path.join(root, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts ?? {};
const failures = [];
const expectedFiles = ['src', 'fixtures', 'README.md', 'LICENSE', 'SECURITY.md', 'CHANGELOG.md', 'CONTRIBUTING.md'];

function requireField(condition, message) {
  if (!condition) failures.push(message);
}

requireField(packageJson.repository, 'package.json must declare repository metadata');
requireField(Array.isArray(packageJson.files), 'package.json must declare a files allowlist');
if (Array.isArray(packageJson.files)) {
  requireField(JSON.stringify(packageJson.files) === JSON.stringify(expectedFiles),
    `package.json files must exactly match maintained entries: ${expectedFiles.join(', ')}`);
  for (const entry of packageJson.files) {
    requireField(fs.existsSync(path.join(root, entry)), `package.json files entry does not exist: ${entry}`);
  }
}
requireField(scripts['package:smoke'] === 'node scripts/package-smoke.mjs',
  'package:smoke must run the maintained package contract assertions');
requireField(scripts['release:check'], 'package.json scripts must include release:check');
requireField(scripts['release:check']?.includes('release:readiness'), 'release:check must run release:readiness');

for (const file of ['README.md', 'SECURITY.md']) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  requireField(!/replace (this|the default)|\.\.\/netpermit|template becomes an app|customization TODO/i.test(content),
    `${file} still contains placeholder release or support text`);
}

const workflowDir = path.join(root, '.github', 'workflows');
if (fs.existsSync(workflowDir)) {
  const workflowFiles = fs.readdirSync(workflowDir).filter((file) => /\.ya?ml$/.test(file));
  requireField(workflowFiles.length > 0, 'repository must include at least one workflow file');

  for (const file of workflowFiles) {
    const workflow = fs.readFileSync(path.join(workflowDir, file), 'utf8');
    requireField(!/TODO|FIXME|template becomes an app|customization TODO/i.test(workflow), '.github/workflows/' + file + ' still contains placeholder text');
  }

  const combined = workflowFiles.map((file) => fs.readFileSync(path.join(workflowDir, file), 'utf8')).join('\n');
  requireField(/release:check/.test(combined), 'CI workflows must run npm run release:check');
}

if (failures.length > 0) {
  console.error('Release readiness validation failed:');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log('Release readiness validation passed.');
