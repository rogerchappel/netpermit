import { readFile } from "node:fs/promises";
import { assertObject, NetpermitError } from "./errors.js";
import { destinationFromUrl, normalizeDestination, parseGitRemote } from "./destination.js";

export async function loadManifest(manifestPath) {
  const content = await readFile(manifestPath, "utf8");
  return parseManifest(content, manifestPath);
}

export function parseManifest(content, source = "manifest") {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new NetpermitError(`Could not parse ${source}: ${error.message}`, "MANIFEST_PARSE_ERROR");
  }

  const records = Array.isArray(parsed) ? parsed : readManifestRecords(parsed, source);
  return records.map((record, index) => normalizeManifestRecord(record, source, index));
}

function readManifestRecords(parsed, source) {
  assertObject(parsed, source);
  const records = parsed.destinations ?? parsed.network ?? parsed.requests;
  if (!Array.isArray(records)) {
    throw new NetpermitError(
      `${source} must be an array or object with destinations, network, or requests`,
      "MANIFEST_DESTINATIONS",
    );
  }
  return records;
}

function normalizeManifestRecord(record, source, index) {
  assertObject(record, `${source}[${index}]`);
  const fields = {
    purpose: record.purpose,
    command: record.command,
    source: record.source ?? source,
  };

  const destination = record.url
    ? destinationFromUrl(record.url, fields)
    : record.remote
      ? parseGitRemote(record.remote, fields)
      : normalizeDestination({ ...record, ...fields });

  if (!destination) {
    throw new NetpermitError(`${source}[${index}] must include a host, url, or remote`, "MANIFEST_HOST");
  }
  return destination;
}
