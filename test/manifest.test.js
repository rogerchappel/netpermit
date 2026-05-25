import assert from "node:assert/strict";
import test from "node:test";
import { parseManifest } from "../src/manifest.js";

test("parses manifest object destinations", () => {
  const destinations = parseManifest(
    JSON.stringify({
      destinations: [
        { url: "https://registry.npmjs.org/netpermit", purpose: "package-install", command: "npm" },
        { remote: "git@github.com:rogerchappel/netpermit.git" },
      ],
    }),
  );

  assert.deepEqual(
    destinations.map((destination) => [destination.host, destination.port, destination.purpose, destination.command]),
    [
      ["registry.npmjs.org", 443, "package-install", "npm"],
      ["github.com", 22, "source-control", "git"],
    ],
  );
});

