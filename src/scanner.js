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
    const executable = stripComment(line);
    destinations.push(...scanUrls(executable, source, lineNumber));
    destinations.push(...scanKnownCommands(executable, source, lineNumber));
  });

  return dedupeDestinations(destinations);
}

function scanUrls(line, source, lineNumber) {
  return shellCommandSegments(line, "curl|wget").flatMap(({ command, text }) =>
    [...text.matchAll(URL_PATTERN)]
      .map((match) =>
        destinationFromUrl(cleanToken(match[0]), {
          purpose: "download",
          command,
          source,
          line: lineNumber,
        }),
      )
      .filter(Boolean),
  );
}

function scanKnownCommands(line, source, lineNumber) {
  const trimmed = line.trim();
  if (!trimmed) return [];

  const destinations = [];
  for (const gitClone of shellCommandSegments(trimmed, "git", "clone")) {
    const remote = gitCloneRemote(gitClone.text);
    if (!remote) continue;
    const destination = parseGitRemote(cleanToken(remote), {
      purpose: "source-control",
      command: "git",
      source,
      line: lineNumber,
    });
    if (destination) destinations.push(destination);
  }

  if (hasShellCommand(trimmed, "npm", ["install", "i", "ci", "update", "publish"])) {
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

  if (hasShellCommand(trimmed, "pnpm", ["install", "i", "add", "update", "up"])) {
    destinations.push(
      normalizeDestination({
        host: "registry.npmjs.org",
        port: 443,
        purpose: "package-install",
        command: "pnpm",
        source,
        line: lineNumber,
      }),
    );
  }

  if (hasShellCommand(trimmed, "yarn", ["install", "add", "upgrade", "up"])) {
    destinations.push(
      normalizeDestination({
        host: "registry.yarnpkg.com",
        port: 443,
        purpose: "package-install",
        command: "yarn",
        source,
        line: lineNumber,
      }),
    );
  }

  if (hasShellCommand(trimmed, "pip(?:3)?", ["install"])) {
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

const GIT_CLONE_VALUE_OPTIONS = new Set([
  "--branch",
  "--config",
  "--depth",
  "--filter",
  "--jobs",
  "--origin",
  "--reference",
  "--reference-if-able",
  "--separate-git-dir",
  "--server-option",
  "--shallow-exclude",
  "--shallow-since",
  "--template",
  "--upload-pack",
  "-b",
  "-c",
  "-j",
  "-o",
  "-u",
]);

const GIT_CLONE_FLAG_OPTIONS = new Set([
  "--bare",
  "--dissociate",
  "--local",
  "--mirror",
  "--no-checkout",
  "--no-hardlinks",
  "--no-local",
  "--no-reject-shallow",
  "--no-single-branch",
  "--no-tags",
  "--progress",
  "--quiet",
  "--recurse-submodules",
  "--reject-shallow",
  "--remote-submodules",
  "--shallow-submodules",
  "--shared",
  "--single-branch",
  "--sparse",
  "--tags",
  "--verbose",
  "-l",
  "-n",
  "-q",
  "-s",
  "-v",
]);

function gitCloneRemote(command) {
  const tokens = command.trim().split(/\s+/).slice(2);
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--") return tokens[index + 1] || null;
    if (!token.startsWith("-")) return token;
    if (GIT_CLONE_FLAG_OPTIONS.has(token) || token.startsWith("--recurse-submodules=")) continue;
    if ([...GIT_CLONE_VALUE_OPTIONS].some((option) => token.startsWith(`${option}=`))) continue;
    if (/^-[bcjou].+/.test(token) || /^-j\d+$/.test(token)) continue;
    if (!GIT_CLONE_VALUE_OPTIONS.has(token)) return null;
    const value = tokens[index + 1];
    if (!value || value.startsWith("-")) return null;
    index += 1;
  }
  return null;
}

function hasShellCommand(line, executable, subcommands) {
  const command = subcommands.join("|");
  const pattern = new RegExp(`(?:^|(?:&&|\\|\\||;)\\s*)${executable}\\s+(?:${command})(?=\\s|$)`);
  return pattern.test(line);
}

function shellCommandSegments(line, executable, subcommand) {
  const suffix = subcommand ? `\\s+${subcommand}(?=\\s|$)` : "(?=\\s|$)";
  const pattern = new RegExp(
    `(?:^|(?:&&|\\|\\||;)\\s*)(?<command>${executable})${suffix}[^;&|]*`,
    "gi",
  );
  return [...line.matchAll(pattern)].map((match) => ({
    command: match.groups.command.toLowerCase(),
    text: match[0].replace(/^(?:&&|\|\||;)\s*/, ""),
  }));
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
