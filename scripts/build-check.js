#!/usr/bin/env node
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { parseManifest, parsePolicy, scanScriptText } from "../src/index.js";

const requiredFiles = [
  "src/cli.js",
  "src/index.js",
  "src/destination.js",
  "src/errors.js",
  "src/manifest.js",
  "src/matcher.js",
  "src/policy.js",
  "src/report.js",
  "src/scanner.js",
];

for (const file of requiredFiles) {
  await access(file, constants.R_OK);
}

parsePolicy("version: 1\nmode: strict\nallowed: []\n");
parseManifest('{"destinations":[{"host":"example.com","port":443}]}');
scanScriptText("curl https://example.com\n");

