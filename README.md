# netpermit

Local-first preflight policy checker for outbound network intent.

## Status

This repository is early-stage. Confirm the current support, release, and
security posture before using it in production.

## Install

Install from npm once published, or run directly from a checkout:

```sh
npm install
npx netpermit --help
```

## Use

Create a starter allowlist:

```sh
netpermit init --out netpermit.yaml
```

Check a script before running it:

```sh
netpermit check scripts/bootstrap.sh --policy netpermit.yaml
```

Check a declared command manifest and emit JSON:

```sh
netpermit check-manifest command-network.json --policy netpermit.yaml --json
```

Policy files use YAML:

```yaml
version: 1
mode: strict
allowed:
  - host: registry.npmjs.org
    ports: [443]
    purposes: [package-install]
    commands: [npm]
```

`mode: strict` exits non-zero for blocked or unknown destinations.
`mode: advisory` reports findings without failing the command.

## Scope

`netpermit` is a preflight checker. It scans explicit declarations and obvious
script patterns, then compares them to a local policy. It is not a runtime
sandbox, firewall, packet filter, or guarantee that a command will only access
reported destinations.

## Development

Install dependencies:

```sh
npm install
```

Run all package checks:

```sh
npm run check
```

Run the CLI smoke test:

```sh
npm run smoke
```

## Verify

Run the local validation script before opening a pull request:

```sh
bash scripts/validate.sh
```

`scripts/validate.sh` runs the repository's standard local checks when they are defined and will also run `agent-qc ready` when `agent-qc` is installed. Missing `agent-qc` is treated as a skip, not a failure.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes
should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance. Replace
the default security policy before publishing the generated repository.

These links assume this README has been copied to the generated repository root.

## License

MIT

## Verification

Run these checks before opening a PR or publishing a release:

```bash
npm test
npm run smoke
npm run package:smoke
npm run release:check
```
