import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const release = fs.readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
const dryRun = fs.readFileSync(new URL('../.github/workflows/release-dry-run.yml', import.meta.url), 'utf8');
const docs = fs.readFileSync(new URL('../docs/releasing.md', import.meta.url), 'utf8');

test('tag-triggered GitHub release requires protected human-reviewed environment', () => {
  assert.match(release, /tags:\s*\n\s*- 'v\*\.\*\.\*'/);
  assert.match(release, /environment:\s*github-release/);
  assert.match(release, /permissions:\s*\n\s+contents: write/);
  assert.match(release, /gh release create/);
  assert.doesNotMatch(release, /id-token:\s*write/);
  assert.match(docs, /required reviewers/);
  assert.match(docs, /prevent self-review/);
});

test('pull request release dry run cannot create a release or run on tag pushes', () => {
  assert.match(dryRun, /pull_request:/);
  assert.match(dryRun, /workflow_dispatch:/);
  assert.doesNotMatch(dryRun, /tags:/);
  assert.doesNotMatch(dryRun, /gh release create|npm publish/);
  assert.match(dryRun, /contents: read/);
});
