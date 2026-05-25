#!/usr/bin/env bash
set -euo pipefail

npm ci
git clone git@github.com:rogerchappel/netpermit.git /tmp/netpermit
curl https://example.com/archive.tgz >/tmp/archive.tgz

