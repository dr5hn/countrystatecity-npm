# Changelog

All notable changes to this project will be documented in this file.

## 0.1.1 - 2026-03-28

### Fixed
- Fail fast for `csc auth login` in non-interactive environments when `--key` is not provided.
- Restore correct root help behavior for `--json --help` and `--quiet --help`.
- Correct the `csc explore` seed-generation hint to use the supported `prisma` format.
- Make generated React dropdown components work with controlled `value` updates.
- Reduce published package contents to the intended release files only.

### Changed
- Bump the CLI package version to `0.1.1`.
- Align README tier limits with the current package behavior.
- Add a GitHub Actions publish workflow that tests, builds, publishes to npm, and creates a GitHub release.
- Replace the website hero ASCII rendering with a deterministic SVG logo for browser-safe branding.
