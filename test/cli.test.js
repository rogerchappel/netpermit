import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const cliPath = fileURLToPath(new URL("../src/cli.js", import.meta.url));

function runCli(...args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });
}

test("check accepts strict and advisory mode overrides", () => {
  const strict = runCli(
    "check",
    "fixtures/blocked.sh",
    "--policy",
    "fixtures/netpermit.yaml",
    "--mode",
    "strict",
    "--json",
  );
  const advisory = runCli(
    "check",
    "fixtures/blocked.sh",
    "--policy",
    "fixtures/netpermit.yaml",
    "--mode",
    "advisory",
    "--json",
  );

  assert.equal(strict.status, 1);
  assert.equal(JSON.parse(strict.stdout).mode, "strict");
  assert.equal(advisory.status, 0);
  assert.equal(JSON.parse(advisory.stdout).mode, "advisory");
});

test("check rejects unsupported modes before emitting a report", () => {
  const result = runCli(
    "check",
    "fixtures/blocked.sh",
    "--policy",
    "fixtures/netpermit.yaml",
    "--mode",
    "nonsense",
    "--json",
  );

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Allowed choices are strict, advisory/);
});

test("check-manifest rejects unsupported modes before emitting a report", () => {
  const result = runCli(
    "check-manifest",
    "fixtures/command-network.json",
    "--policy",
    "fixtures/netpermit.yaml",
    "--mode",
    "nonsense",
    "--json",
  );

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Allowed choices are strict, advisory/);
});
