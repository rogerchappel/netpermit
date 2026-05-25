#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

node src/cli.js init --out "$tmp_dir/netpermit.yaml" >/dev/null
node src/cli.js check fixtures/safe.sh --policy fixtures/netpermit.yaml >/dev/null

if node src/cli.js check fixtures/blocked.sh --policy fixtures/netpermit.yaml >/dev/null 2>&1; then
  echo "Expected blocked fixture to fail in strict mode." >&2
  exit 1
fi

node src/cli.js check fixtures/blocked.sh --policy fixtures/advisory.yaml >/dev/null
node src/cli.js check-manifest fixtures/command-network.json --policy fixtures/netpermit.yaml --json >/dev/null

