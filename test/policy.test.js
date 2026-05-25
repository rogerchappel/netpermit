import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultPolicy, parsePolicy } from "../src/policy.js";

test("parses allowlist policy aliases and normalizes values", () => {
  const policy = parsePolicy(`
version: 1
mode: STRICT
allow:
  - host: GitHub.com
    port: "443"
    purpose: source-control
    command: Git
`);

  assert.equal(policy.mode, "strict");
  assert.deepEqual(policy.allowed, [
    {
      host: "github.com",
      ports: [443],
      purposes: ["source-control"],
      commands: ["git"],
      description: undefined,
    },
  ]);
});

test("default policy is valid", () => {
  assert.equal(parsePolicy(createDefaultPolicy()).version, 1);
});

