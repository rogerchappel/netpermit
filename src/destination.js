const DEFAULT_SCHEME_PORTS = new Map([
  ["http:", 80],
  ["https:", 443],
  ["ssh:", 22],
  ["git:", 9418],
]);

export function normalizeHost(host) {
  return String(host ?? "")
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .toLowerCase();
}

export function normalizePort(port, fallback) {
  if (port === undefined || port === null || port === "") {
    return fallback ?? null;
  }
  const parsed = Number(port);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : null;
}

export function destinationFromUrl(rawUrl, fields = {}) {
  const url = parseUrl(rawUrl);
  if (!url) return null;

  const fallbackPort = DEFAULT_SCHEME_PORTS.get(url.protocol) ?? null;
  return normalizeDestination({
    host: url.hostname,
    port: normalizePort(url.port, fallbackPort),
    scheme: url.protocol.replace(/:$/, ""),
    url: rawUrl,
    ...fields,
  });
}

export function normalizeDestination(input) {
  const host = normalizeHost(input.host);
  if (!host) return null;

  return {
    host,
    port: normalizePort(input.port, null),
    purpose: String(input.purpose ?? "unknown").trim() || "unknown",
    command: input.command ? String(input.command) : undefined,
    source: input.source ? String(input.source) : undefined,
    url: input.url ? String(input.url) : undefined,
    line: Number.isInteger(input.line) ? input.line : undefined,
  };
}

export function parseGitRemote(remote, fields = {}) {
  const value = String(remote ?? "").trim();
  if (!value) return null;

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    return destinationFromUrl(value, fields);
  }

  const scpLike = value.match(/^(?:[^@/\s]+@)?([^:/\s]+):[^ \t]+$/);
  if (scpLike) {
    return normalizeDestination({
      host: scpLike[1],
      port: 22,
      purpose: "source-control",
      command: "git",
      url: value,
      ...fields,
    });
  }

  return null;
}

function parseUrl(rawUrl) {
  try {
    return new URL(rawUrl);
  } catch {
    if (/^www\./i.test(rawUrl)) {
      return new URL(`https://${rawUrl}`);
    }
    return null;
  }
}
