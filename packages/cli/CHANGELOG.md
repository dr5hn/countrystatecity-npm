# Changelog

All notable changes to this project will be documented in this file.

## 0.2.0 - 2026-08-29

### Added

- Fuzzy search, field selection, sorting, and nearby place search.
- `csc generate` templates for live autocomplete and location-picker components in Next.js and browser React projects.
- Live plan and pricing information in the upgrade command.

### Changed

- API and upgrade links now point to the public pricing page and include safe campaign tracking values.

### Fixed

- `csc --version`, branded help, and the HTTP User-Agent now use the package version instead of reporting 0.1.1.
- Read-only `--version` and `--help` commands no longer create the persistent config directory.

## 0.1.2 - 2026-06-12

### Changed
- Moved into the `countrystatecity-npm` monorepo (`packages/cli`).
- Updated repository, homepage, and bugs URLs to point to the monorepo.

### Fixed
- `export` command: add `vi.clearAllMocks()` in `beforeEach` so the `--json` test no longer inherits call state from the previous test.

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
