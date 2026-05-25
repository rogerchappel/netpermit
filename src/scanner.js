import { readFile } from "node:fs/promises";
import { destinationFromUrl, normalizeDestination, parseGitRemote } from "./destination.js";

const URL_PATTERN = /\b(?:https?|git|ssh):\/\/[^\s"'`<>)]+/gi;

export async function scanScript(scriptPath) {
  const content = await readFile(scriptPath, "utf8");
  return scanScriptText(content, scriptPath);
}

export function scanScriptText(content, source = "script") {
  const destinations = [];
  const lines = String(content).split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    destinations.push(...scanUrls(line, source, lineNumber));
    destinations.push(...scanKnownCommands(line, source, lineNumber));
  });

  return dedupeDestinations(destinations);
}

function scanUrls(line, source, lineNumber) {
  return [...line.matchAll(URL_PATTERN)]
    .map((match) =>
      destinationFromUrl(cleanToken(match[0]), {
        purpose: inferPurpose(line),
        command: inferCommand(line),
        source,
        line: lineNumber,
      }),
    )
    .filter(Boolean);
}

function scanKnownCommands(line, source, lineNumber) {
  const trimmed = stripComment(line).trim();
  if (!trimmed) return [];

  const destinations = [];
  const gitClone = trimmed.match(/\bgit\s+clone\s+([^\s]+)/);
  if (gitClone) {
    const destination = parseGitRemote(cleanToken(gitClone[1]), {
      purpose: "source-control",
      command: "git",
      source,
      line: lineNumber,
    });
    if (destination) destinations.push(destination);
  }

  if (/\bnpm\s+(?:install|i|ci|update|publish)\b/.test(trimmed)) {
    destinations.push(
      normalizeDestination({
        host: "registry.npmjs.org",
        port: 443,
        purpose: "package-install",
        command: "npm",
        source,
        line: lineNumber,
      }),
    );
  }

  if (/\bpip(?:3)?\s+install\b/.test(trimmed)) {
    destinations.push(
      normalizeDestination({
        host: "pypi.org",
        port: 443,
        purpose: "package-install",
        command: "pip",
        source,
        line: lineNumber,
      }),
      normalizeDestination({
        host: "files.pythonhosted.org",
        port: 443,
        purpose: "package-install",
        command: "pip",
        source,
        line: lineNumber,
      }),
    );
  }

  return destinations.filter(Boolean);
}

function inferCommand(line) {
  const match = stripComment(line).trim().match(/^([A-Za-z0-9_.-]+)/);
  return match ? match[1].toLowerCase() : undefined;
}

function inferPurpose(line) {
  if (/\bgit\s+clone\b/.test(line)) return "source-control";
  if (/\b(?:npm|pip3?|pnpm|yarn)\b/.test(line)) return "package-install";
  if (/\b(?:curl|wget)\b/.test(line)) return "download";
  return "unknown";
}

function cleanToken(token) {
  return token.replace(/[),.;]+$/, "").replace(/^['"]|['"]$/g, "");
}

function stripComment(line) {
  return line.replace(/(^|\s)#.*$/, "");
}

function dedupeDestinations(destinations) {
  const seen = new Set();
  return destinations.filter((destination) => {
    const key = [
      destination.host,
      destination.port ?? "",
      destination.purpose ?? "",
      destination.command ?? "",
      destination.source ?? "",
      destination.line ?? "",
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
