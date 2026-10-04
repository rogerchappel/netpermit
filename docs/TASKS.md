# netpermit Task Breakdown

This breakdown keeps release readiness work concrete and reviewable for netpermit.

## Current v0.1.0 Tasks

- Keep the README quickstart aligned with the commands exposed by `package.json`.
- Maintain at least one local verification path that exercises the package before release.
- Keep package metadata, license details, and public repository links complete enough for install-time inspection.
- Record follow-up behavior gaps in this file or the roadmap instead of implying finished coverage.

## Verification Tasks

- Run the package test script before opening a release PR.
- Run the package smoke or pack check when package contents, CLI entry points, or docs change.
- Re-run ReleaseBox readiness after changing release workflows, package metadata, or public documentation.
- Before a release PR, run `npm run release:readiness` to validate release metadata and repository readiness, then `npm run release:check` for the complete verification sequence (readiness, build, tests, smoke checks, production dependency audit, and package smoke check). Both command names are defined in `package.json`.
