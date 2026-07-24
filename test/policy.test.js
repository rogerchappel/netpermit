import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createDefaultPolicy, loadPolicy, parsePolicy } from "../src/policy.js";

const fixturePath = (name) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

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

test("loads the maintained strict policy fixture", async () => {
  const source = fixturePath("netpermit.yaml");
  const policy = await loadPolicy(source);

  assert.deepEqual(policy, {
    version: 1,
    mode: "strict",
    allowed: [
      {
        host: "registry.npmjs.org",
        ports: [443],
        purposes: ["package-install"],
        commands: ["npm"],
        description: undefined,
      },
      {
        host: "pypi.org",
        ports: [443],
        purposes: ["package-install"],
        commands: ["pip"],
        description: undefined,
      },
      {
        host: "files.pythonhosted.org",
        ports: [443],
        purposes: ["package-install"],
        commands: ["pip"],
        description: undefined,
      },
      {
        host: "github.com",
        ports: [22, 443],
        purposes: ["source-control"],
        commands: ["git"],
        description: undefined,
      },
      {
        host: "example.com",
        ports: [443],
        purposes: ["download"],
        commands: ["curl"],
        description: undefined,
      },
    ],
    source,
  });
});

test("loads the maintained advisory policy fixture", async () => {
  const source = fixturePath("advisory.yaml");
  const policy = await loadPolicy(source);

  assert.deepEqual(policy, {
    version: 1,
    mode: "advisory",
    allowed: [
      {
        host: "example.com",
        ports: [443],
        purposes: ["download"],
        commands: ["curl"],
        description: undefined,
      },
    ],
    source,
  });
});
