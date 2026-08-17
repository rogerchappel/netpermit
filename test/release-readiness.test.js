import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'netpermit-readiness-'));
  for (const entry of ['package.json', 'README.md', 'SECURITY.md', 'scripts', '.github']) {
    fs.cpSync(path.join(root, entry), path.join(directory, entry), { recursive: true });
  }
  for (const entry of ['src', 'fixtures', 'LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md']) {
    fs.cpSync(path.join(root, entry), path.join(directory, entry), { recursive: true });
  }
  return directory;
}

function validate(directory) {
  return spawnSync(process.execPath, ['scripts/validate-release-readiness.mjs'], {
    cwd: directory,
    encoding: 'utf8',
  });
}

test('release readiness accepts the maintained repository contract', (t) => {
  const directory = fixture();
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  assert.equal(validate(directory).status, 0);
});

test('release readiness rejects stale files allowlist entries', (t) => {
  const directory = fixture();
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const packagePath = path.join(directory, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath));
  packageJson.files.push('examples');
  fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
  const result = validate(directory);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /files must exactly match maintained entries|does not exist: examples/);
});

test('release readiness rejects placeholder support text', (t) => {
  const directory = fixture();
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.appendFileSync(path.join(directory, 'SECURITY.md'), '\nReplace this section before release.\n');
  const result = validate(directory);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /SECURITY\.md still contains placeholder/);
});
