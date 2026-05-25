#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { NetpermitError } from "./errors.js";
import { evaluateDestinations, shouldExitNonZero } from "./matcher.js";
import { loadManifest } from "./manifest.js";
import { createDefaultPolicy, loadPolicy } from "./policy.js";
import { formatJsonReport, formatReadableReport } from "./report.js";
import { scanScript } from "./scanner.js";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);

const program = new Command();

program
  .name("netpermit")
  .description("Local-first preflight policy checker for outbound network intent.")
  .version(packageJson.version);

program
  .command("check")
  .argument("<script>", "script file to scan")
  .requiredOption("-p, --policy <path>", "netpermit YAML policy file")
  .option("--json", "emit JSON report")
  .option("--mode <mode>", "override policy mode: strict or advisory")
  .description("Scan a shell script for obvious network intent and evaluate it against policy.")
  .action(async (scriptPath, options) => {
    const policy = await loadPolicy(options.policy);
    const destinations = await scanScript(scriptPath);
    await writeReport(evaluateDestinations(destinations, policy, { mode: options.mode }), options);
  });

program
  .command("check-manifest")
  .argument("<manifest>", "JSON command network manifest")
  .requiredOption("-p, --policy <path>", "netpermit YAML policy file")
  .option("--json", "emit JSON report")
  .option("--mode <mode>", "override policy mode: strict or advisory")
  .description("Evaluate a declared command network manifest against policy.")
  .action(async (manifestPath, options) => {
    const policy = await loadPolicy(options.policy);
    const destinations = await loadManifest(manifestPath);
    await writeReport(evaluateDestinations(destinations, policy, { mode: options.mode }), options);
  });

program
  .command("init")
  .option("-o, --out <path>", "output policy path", "netpermit.yaml")
  .description("Write a starter netpermit policy.")
  .action(async (options) => {
    await mkdir(dirname(options.out), { recursive: true });
    await writeFile(options.out, createDefaultPolicy(), { flag: "wx" });
    process.stdout.write(`Created ${options.out}\n`);
  });

program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error.code === "commander.helpDisplayed" || error.code === "commander.version") {
    process.exit(0);
  }
  if (error.code?.startsWith("commander.")) {
    process.exit(error.exitCode ?? 1);
  }

  const message = error instanceof NetpermitError ? `${error.code}: ${error.message}` : error.message;
  process.stderr.write(`netpermit: ${message}\n`);
  process.exit(1);
}

async function writeReport(result, options) {
  process.stdout.write(options.json ? formatJsonReport(result) : formatReadableReport(result));
  if (shouldExitNonZero(result)) {
    process.exitCode = 1;
  }
}

export function cliPath() {
  return fileURLToPath(import.meta.url);
}

