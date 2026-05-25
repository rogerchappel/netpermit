import assert from "node:assert/strict";
import test from "node:test";
import { scanScriptText } from "../src/scanner.js";

test("scans urls, package managers, and git remotes", () => {
  const destinations = scanScriptText(`
npm ci
pip install requests
git clone git@github.com:rogerchappel/netpermit.git
curl https://example.com/file.tgz
`);

  assert.deepEqual(
    destinations.map((destination) => [destination.host, destination.port, destination.purpose, destination.command]),
    [
      ["registry.npmjs.org", 443, "package-install", "npm"],
      ["pypi.org", 443, "package-install", "pip"],
      ["files.pythonhosted.org", 443, "package-install", "pip"],
      ["github.com", 22, "source-control", "git"],
      ["example.com", 443, "download", "curl"],
    ],
  );
});

