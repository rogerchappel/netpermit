import { readFile } from "node:fs/promises";
import yaml from "js-yaml";
import { assertObject, NetpermitError } from "./errors.js";
import { normalizeHost, normalizePort } from "./destination.js";

const DEFAULT_POLICY = {
  version: 1,
  mode: "strict",
  allowed: [],
};

export async function loadPolicy(policyPath) {
  const content = await readFile(policyPath, "utf8");
  return parsePolicy(content, policyPath);
}

export function parsePolicy(content, source = "policy") {
  let loaded;
  try {
    loaded = yaml.load(content);
  } catch (error) {
    throw new NetpermitError(`Could not parse ${source}: ${error.message}`, "POLICY_PARSE_ERROR");
  }

  assertObject(loaded, `${source}`);
  const policy = { ...DEFAULT_POLICY, ...loaded };
  if (policy.version !== 1) {
    throw new NetpermitError("Only netpermit policy version 1 is supported", "POLICY_VERSION");
  }

  const mode = normalizeMode(policy.mode);
  const allowed = normalizeRules(loaded.allowed ?? loaded.allow ?? []);
  return { version: 1, mode, allowed, source };
}

export function createDefaultPolicy() {
  return `# netpermit is a preflight checker, not a runtime sandbox.
version: 1
mode: strict
allowed:
  - host: registry.npmjs.org
    ports: [443]
    purposes: [package-install]
    commands: [npm]
  - host: github.com
    ports: [22, 443]
    purposes: [source-control]
    commands: [git]
`;
}

function normalizeRules(rules) {
  if (!Array.isArray(rules)) {
    throw new NetpermitError("policy.allowed must be a list", "POLICY_ALLOWED");
  }

  return rules.map((rule, index) => normalizeRule(rule, index));
}

function normalizeRule(rule, index) {
  assertObject(rule, `policy.allowed[${index}]`);
  const host = normalizeHost(rule.host);
  if (!host) {
    throw new NetpermitError(`policy.allowed[${index}].host is required`, "POLICY_HOST");
  }

  return {
    host,
    ports: normalizeList(rule.ports ?? rule.port, (value) => normalizePort(value, null)),
    purposes: normalizeStringList(rule.purposes ?? rule.purpose),
    commands: normalizeStringList(rule.commands ?? rule.command),
    description: rule.description ? String(rule.description) : undefined,
  };
}

function normalizeMode(mode) {
  const value = String(mode ?? "strict").toLowerCase();
  if (value === "strict" || value === "advisory") return value;
  throw new NetpermitError("policy.mode must be strict or advisory", "POLICY_MODE");
}

function normalizeStringList(value) {
  return normalizeList(value, (item) => String(item).trim().toLowerCase()).filter(Boolean);
}

function normalizeList(value, mapper) {
  if (value === undefined || value === null) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.map(mapper).filter((item) => item !== null && item !== "");
}
