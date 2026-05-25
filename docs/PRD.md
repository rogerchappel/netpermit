# netpermit PRD

Status: in-progress

## Summary

`netpermit` is a tiny local-first policy checker for outbound network intent. Developers and agents can declare allowed hosts, ports, and purposes in a plain YAML file, then lint scripts or command manifests before running them.

## Problem

Agentic workflows frequently run install scripts, test suites, or CLIs that might touch the network. Teams need a lightweight, auditable way to say which destinations are expected and which should be reviewed, without installing a full firewall or sandbox.

## V1 Goals

- Parse a simple `netpermit.yaml` allowlist.
- Validate command manifests that describe intended network destinations.
- Scan shell scripts for obvious network commands such as `curl`, `wget`, `git clone`, `npm`, and `pip`.
- Emit readable pass/fail reports and JSON.
- Provide strict and advisory modes.
- Include fixtures with safe, blocked, and unknown destinations.

## Non-Goals

- No packet interception or kernel firewalling.
- No guarantee of runtime enforcement.
- No background daemon.

## CLI

```bash
netpermit check scripts/bootstrap.sh --policy netpermit.yaml
netpermit check-manifest command-network.json --policy netpermit.yaml --json
netpermit init --out netpermit.yaml
```

## Safety

`netpermit` must make clear that it is a preflight policy checker, not a runtime sandbox.

## Inspiration

Inspired by least-privilege agent workflows, repository security review, and dependency install audits.
