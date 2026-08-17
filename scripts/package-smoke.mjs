import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const expectedFiles = [
  'CHANGELOG.md', 'CONTRIBUTING.md', 'LICENSE', 'README.md', 'SECURITY.md',
  'fixtures/advisory.yaml', 'fixtures/blocked.sh', 'fixtures/command-network.json',
  'fixtures/invalid-port.yaml', 'fixtures/netpermit.yaml', 'fixtures/safe.sh',
  'package.json', 'src/cli.js', 'src/destination.js', 'src/errors.js',
  'src/index.js', 'src/manifest.js', 'src/matcher.js', 'src/policy.js',
  'src/report.js', 'src/scanner.js',
];

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'netpermit-package-'));
try {
  const packed = spawnSync('npm', ['pack', '--json', '--pack-destination', temporaryDirectory], {
    encoding: 'utf8',
  });
  assert.equal(packed.status, 0, packed.stderr || packed.stdout);
  const [manifest] = JSON.parse(packed.stdout);
  assert.deepEqual(manifest.files.map(({ path: file }) => file).sort(), [...expectedFiles].sort(),
    'packed files must match the reviewed runtime and documentation contract');

  const archive = path.join(temporaryDirectory, manifest.filename);
  const extracted = spawnSync('tar', ['-xzf', archive, '-C', temporaryDirectory], { encoding: 'utf8' });
  assert.equal(extracted.status, 0, extracted.stderr);
  const packageDirectory = path.join(temporaryDirectory, 'package');
  const install = spawnSync('npm', ['install', '--ignore-scripts', '--omit=dev'], {
    cwd: packageDirectory,
    encoding: 'utf8',
  });
  assert.equal(install.status, 0, install.stderr || install.stdout);
  const cli = spawnSync(process.execPath, ['src/cli.js', '--help'], {
    cwd: packageDirectory,
    encoding: 'utf8',
  });
  assert.equal(cli.status, 0, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /Usage: netpermit/);
  console.log(`Package smoke passed (${manifest.entryCount} reviewed files; CLI entrypoint exits 0).`);
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
