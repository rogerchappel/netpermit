import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDestinations, shouldExitNonZero } from "../src/matcher.js";

const policy = {
  source: "test-policy",
  mode: "strict",
  allowed: [
    {
      host: "*.example.com",
      ports: [443],
      purposes: ["download"],
      commands: ["curl"],
    },
  ],
};

test("evaluates allowed, blocked, and unknown destinations", () => {
  const result = evaluateDestinations(
    [
      { host: "cdn.example.com", port: 443, purpose: "download", command: "curl" },
      { host: "cdn.example.com", port: 80, purpose: "download", command: "curl" },
      { host: "other.test", port: 443, purpose: "download", command: "curl" },
    ],
    policy,
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.summary, { total: 3, allowed: 1, blocked: 1, unknown: 1 });
  assert.equal(shouldExitNonZero(result), true);
  assert.equal(shouldExitNonZero({ ...result, mode: "advisory" }), false);
});

