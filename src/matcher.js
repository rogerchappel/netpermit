export function evaluateDestinations(destinations, policy, options = {}) {
  const mode = options.mode ?? policy.mode ?? "strict";
  const findings = destinations.map((destination) => evaluateDestination(destination, policy.allowed));
  const summary = summarizeFindings(findings);

  return {
    ok: summary.blocked === 0 && summary.unknown === 0,
    mode,
    policy: policy.source,
    summary,
    findings,
  };
}

export function evaluateDestination(destination, rules) {
  const matchedRule = rules.find((rule) => ruleMatches(rule, destination));
  if (matchedRule) {
    return {
      status: "allowed",
      destination,
      rule: describeRule(matchedRule),
      message: `${formatDestination(destination)} is allowed`,
    };
  }

  const hostRule = rules.find((rule) => hostMatches(rule.host, destination.host));
  const status = hostRule ? "blocked" : "unknown";
  return {
    status,
    destination,
    message:
      status === "blocked"
        ? `${formatDestination(destination)} matched host policy but not port/purpose/command`
        : `${formatDestination(destination)} is not declared in policy`,
  };
}

export function shouldExitNonZero(result) {
  if (result.mode === "advisory") return false;
  return !result.ok;
}

function ruleMatches(rule, destination) {
  return (
    hostMatches(rule.host, destination.host) &&
    valueMatches(rule.ports, destination.port) &&
    valueMatches(rule.purposes, destination.purpose?.toLowerCase()) &&
    valueMatches(rule.commands, destination.command?.toLowerCase())
  );
}

function hostMatches(pattern, host) {
  if (pattern === "*") return true;
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(1);
    return host.endsWith(suffix) && host !== pattern.slice(2);
  }
  return pattern === host;
}

function valueMatches(allowed, value) {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(value);
}

function summarizeFindings(findings) {
  return findings.reduce(
    (summary, finding) => {
      summary.total += 1;
      summary[finding.status] += 1;
      return summary;
    },
    { total: 0, allowed: 0, blocked: 0, unknown: 0 },
  );
}

function describeRule(rule) {
  return {
    host: rule.host,
    ports: rule.ports,
    purposes: rule.purposes,
    commands: rule.commands,
  };
}

function formatDestination(destination) {
  const port = destination.port ? `:${destination.port}` : "";
  const purpose = destination.purpose ? ` purpose=${destination.purpose}` : "";
  const command = destination.command ? ` command=${destination.command}` : "";
  return `${destination.host}${port}${purpose}${command}`;
}
