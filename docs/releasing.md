# GitHub release authorization

`release.mode` is `reviewed`: pushing a version tag does not itself authorize a
GitHub release. The `Release` workflow targets the `github-release` environment
before it runs release checks or creates a release. Repository maintainers must
configure that environment with required reviewers (and prevent self-review)
in **Settings → Environments → github-release**. Without that protection, the
workflow's environment gate does not provide human authorization.

The release job requests only `contents: write`, needed by `gh release create`;
all other workflow permissions remain read-only. It does not publish to npm.

## Maintainer procedure

1. Review the proposed version/tag and release contents.
2. Ensure the `github-release` environment has required reviewers configured.
3. Push the version tag. The release workflow waits at the protected
   environment before running release checks or creating the GitHub release.
4. A designated reviewer inspects the run and approves the environment
   deployment only after the review is complete.
5. Verify the resulting GitHub release and attached package artifact.

The pull-request dry-run workflow is read-only and has no tag trigger. Changing
workflow YAML or release metadata runs its checks on the PR; it cannot create a
release.
