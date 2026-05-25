export function formatJsonReport(result) {
  return `${JSON.stringify(result, null, 2)}\n`;
}

export function formatReadableReport(result) {
  const lines = [];
  const verdict = result.ok ? "PASS" : result.mode === "advisory" ? "ADVISORY" : "FAIL";
  lines.push(`netpermit ${verdict}`);
  lines.push(`mode: ${result.mode}`);
  if (result.policy) lines.push(`policy: ${result.policy}`);
  lines.push(
    `summary: ${result.summary.allowed} allowed, ${result.summary.blocked} blocked, ${result.summary.unknown} unknown, ${result.summary.total} total`,
  );

  if (result.findings.length > 0) {
    lines.push("");
    for (const finding of result.findings) {
      const destination = finding.destination;
      const location = destination.line ? `:${destination.line}` : "";
      const port = destination.port ? `:${destination.port}` : "";
      const source = destination.source ? `${destination.source}${location} ` : "";
      lines.push(
        `${symbolFor(finding.status)} ${finding.status.toUpperCase()} ${source}${destination.host}${port} purpose=${destination.purpose} command=${destination.command ?? "unknown"}`,
      );
      if (finding.status !== "allowed") {
        lines.push(`  ${finding.message}`);
      }
    }
  }

  lines.push("");
  lines.push("Note: netpermit is a preflight checker, not a runtime sandbox or firewall.");
  return `${lines.join("\n")}\n`;
}

function symbolFor(status) {
  if (status === "allowed") return "OK";
  if (status === "blocked") return "BLOCK";
  return "REVIEW";
}
