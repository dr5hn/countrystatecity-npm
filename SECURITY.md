# Package and publishing security

Report suspected vulnerabilities privately using GitHub security advisories for this repository. If private reporting is not enabled, contact the maintainer privately; do not post credentials or an exploit in a public issue.

## Release safeguards

- Dependency installs use the committed lockfile and do not run install scripts.
- Newly selected dependency versions must be at least three days old. Missing publication dates fail the check.
- Trust evidence must not decrease. One exact historical exception, `chokidar@4.0.3`, is documented in the workspace settings; it remains integrity-pinned and signature-checked. Do not add broad exceptions to make CI green.
- CI and release builds check known vulnerabilities and registry signatures. These checks reduce risk but cannot prove that a dependency is harmless.
- External Actions use fixed commit hashes. Dependabot proposes updates; maintainers still review and test them.
- Builds run without npm credentials, write permissions, or OIDC permission. Publishing happens in a separate job that does not install dependencies, build code, or run package hooks.
- Release builds use fresh runners without dependency caches. Packed files are checked for unexpected files, links, install hooks, package identity, dependency sources, and required data notices.
- The publisher uses npm trusted publishing and provenance, with no stored-token fallback. For newly published versions it checks archive integrity and provenance metadata before creating the GitHub release.
- Release assets are checked against the pinned GitHub release's SHA-256 digest before decompression. All data comes from one release, never a mixture with database master.

## Maintainer setup required before publishing

For each package in this repository, open its npm settings and add a trusted publisher:

| Setting | Value |
|---|---|
| Provider | GitHub Actions |
| Organization or user | `dr5hn` |
| Repository | `countrystatecity-npm` |
| Workflow filename | `publish.yml` |
| Environment name | `npm-publish` |
| Allowed action | Direct publishing with `npm publish` |

There are ten packages: `countries`, `countries-browser`, `timezones`, `currencies`, `translations`, `phonecodes`, `postalcodes`, `geojson`, `cli`, and `sdk`, all under `@countrystatecity`.

Restrict the GitHub environment `npm-publish` to the `main` branch only. The environment name must also be set in every npm trusted-publisher configuration; otherwise that configuration does not enforce this branch restriction.

Use hardware-backed two-factor authentication on npm and GitHub. After trusted publishing is verified, revoke the old publishing token in npm and remove the unused `NPM_TOKEN` GitHub secret. Removing a GitHub secret alone does not revoke its npm token.

Enable Dependabot alerts and security updates in GitHub. Add repository rules requiring owner review of workflow, manifest, lockfile, and security-script changes; `CODEOWNERS` alone does not enforce review. The current version-bump workflow writes to main, so design its permitted release path before enforcing a rule that blocks that push. Do not silently exempt all administrators or all bots.

## When a check fails

Stop the release and investigate the exact version, source, and failure. Do not bypass signature checks, use an unpinned action, run an unknown install script, or switch back to a stored publishing token.

Accepted uploads can remain unavailable while npm processes them. Uploads are submitted once, then checked together within a 15-minute verification window. No GitHub release is announced until all new uploads pass integrity and provenance checks.

If publication succeeds but registry verification times out, inspect npm first. The version may already exist or still be processing. Never blindly bump or republish it. For a bad published version, keep users on the last known-good release and prepare a reviewed correction; published versions cannot be overwritten.

Reference guidance: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/), [GitHub Actions security](https://docs.github.com/en/actions/reference/security/secure-use), and [pnpm dependency security settings](https://pnpm.io/settings/dependency-resolution).
