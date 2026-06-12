# CSC CLI - Development Guide

## Quick Start
npm install
npm run dev -- auth login
npm run dev -- search countries
npm run build

## Architecture
- Entry: src/index.ts (commander setup)
- Commands: src/commands/*.ts (one file per command group)
- Core: src/lib/api.ts (API client), config.ts (conf storage), display.ts (formatting)
- Templates: src/templates/*.ts (code generation templates)

## Key Design Rules
1. EVERY command that calls the API MUST show the usage footer via printUsageFooter()
2. The `generate` command is tier-gated (Supporter+). Check dailyLimit from usage headers.
3. All API calls go through src/lib/api.ts - never call axios directly from commands
4. --json flag on all search/get commands outputs raw JSON (for piping)
5. Error messages must always suggest the next action (e.g., "Run `csc auth login`")

## API
- Base: https://api.countrystatecity.in/v1
- Auth header: X-CSCAPI-KEY
- Usage headers: X-CSC-Daily-Used, X-CSC-Daily-Limit, X-CSC-Monthly-Used, X-CSC-Monthly-Limit

## Testing
npm test (vitest)
Mock API calls in tests - do not hit the live API.

## Build & Publish
npm run build (tsup -> dist/)
npm publish --access public
