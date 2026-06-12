# CSC CLI Modernization — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Scope:** CLI visual overhaul, interactive explorer, export integration, API enhancements, CLI website

---

## Context

The CLI (`@countrystatecity/cli`) is a developer tool for the Country State City API. Three audience segments use it:

1. **Direct integration** — developers building apps with the API
2. **AI-assisted development** — AI agents (Cursor, Claude Code) calling `csc` programmatically
3. **CLI-as-infrastructure** — piping `csc` output into scripts, CI/CD, or other tools

The CLI must be fast and professional for daily use, machine-readable for automation, and visually polished enough to represent the brand.

---

## 1. ASCII Art Branding

**Style:** Figlet-style block letters with blue-to-green brand gradient.

**Brand colors:**
- Primary blue: `#2296f3`
- Green accent: `#cddc39`
- Orange accent: `#f97316`
- Text: `#94a3b8` (dim), `#475569` (secondary)

**ASCII art (gradient top-to-bottom):**
```
   ██████ ███████  ██████
  ██      ██      ██
  ██      ███████ ██
  ██           ██ ██
   ██████ ███████  ██████

  Country State City CLI v0.1.0
```

Each row is a step in the blue→green gradient using chalk's `hex()`:
- Row 1: `#2296f3`
- Row 2: `#2ba8e8`
- Row 3: `#4dbe9e`
- Row 4: `#8ecf5e`
- Row 5: `#cddc39`

**Where shown:**
- `csc --help` (always)
- First run after `csc auth login` (once)
- NOT shown when `--quiet` or `--json` flags are set
- NOT shown on subcommand help (e.g., `csc search --help`)

**Dependency:** Use `chalk.hex()` (already available, chalk v5 supports it).

---

## 2. Modernized Help Screen

**`csc --help` output structure:**

```
[ASCII art]

COMMANDS
  auth        Login, logout, check API key status
  search      Browse countries, states, and cities
  get         Get detailed info for a country or state
  explore     Interactive geographic data browser
  usage       View API quota and plan details
  upgrade     Compare plans and upgrade
  generate    Generate dropdown components and seed files
  export      Open the export tool in your browser

GLOBAL FLAGS
  --json      Output raw JSON (for piping)
  --quiet     Suppress decorative output (spinners, footer, ASCII art)
  --no-footer Hide usage footer

Run csc <command> --help for details
```

**Implementation:**
- Override Commander's default help with custom `helpInformation()` or `addHelpText('beforeAll', ...)`
- Command names in blue (`#2296f3`), descriptions in dim gray
- Section headers ("COMMANDS", "GLOBAL FLAGS") in orange (`#f97316`)
- Subcommand help (e.g., `csc search --help`) uses Commander's default formatting — no ASCII art

---

## 3. Interactive Explorer (`csc explore`)

**New command** — flagship interactive experience for TTY sessions.

**Dependency:** `@inquirer/prompts` (specifically `@inquirer/search` for searchable select).

**Flow:**
1. Fetch all countries from API
2. Show searchable select: "Select a country" (type to filter, arrow keys to navigate)
3. User selects a country → fetch states
4. Show searchable select: "Select a state"
5. User selects a state → show action menu:
   - View cities (table)
   - View country details
   - View state details
   - Generate dropdown component
   - Generate seed file
   - Go back
6. User picks an action → execute and return to action menu
7. "Go back" returns to state selection, then country selection

**Non-TTY behavior:** If stdin is not a TTY, print help text and exit. Interactive prompts require a terminal.

**Error handling:** If API call fails mid-flow, show error and offer to retry or quit.

---

## 4. Hybrid Command Behavior

When a command is run without required arguments in a TTY, prompt interactively instead of showing an error.

**Commands that get hybrid behavior:**

| Command | Missing args | Interactive fallback |
|---------|-------------|---------------------|
| `csc search` (no subcommand) | entity type | Prompt: "What do you want to search?" → countries/states/cities |
| `csc search states` (no `--country`) | country code | Prompt: searchable country select |
| `csc search cities` (no flags) | country + state | Prompt: country select → state select |
| `csc get country` (no ISO) | ISO code | Prompt: searchable country select |
| `csc get state` (no ISOs) | country + state | Prompt: country select → state select |
| `csc generate dropdown` (no flags) | entity + format | Prompt: entity select → format select |
| `csc generate seed` (no flags) | entity + format | Prompt: entity select → format select |

**Non-TTY:** If stdin is not a TTY (piped/scripted), show the error message as today. No prompts.

**Detection:** `process.stdin.isTTY` — true when human is at terminal, false when piped.

---

## 5. Export Command (`csc export`)

**Behavior:** Opens `export.countrystatecity.in` in the browser. No CLI-side export logic.

```
$ csc export

  Export geographic data in JSON, CSV, SQL, and more formats.
  Uses credits from the Export Tool (separate from API quota).

  Opening export.countrystatecity.in...
```

**Implementation:**
- Uses `open` package (already a dependency)
- Shows a brief description before opening
- If `--json` flag: output `{ "url": "https://export.countrystatecity.in" }` instead of opening browser
- No auth integration — the export tool handles its own authentication

---

## 6. Global Flags

Three new global flags on the root `program`:

| Flag | Effect |
|------|--------|
| `--json` | All commands output JSON to stdout. No spinners, no colors, no footer. Exit codes only. |
| `--quiet` / `-q` | Suppress ASCII art, spinners, and usage footer. Data output still shown. |
| `--no-footer` | Suppress only the usage footer. Everything else normal. |

**Implementation:**
- Add options on root `program` command
- Pass flags through to commands via `program.opts()`
- `--json` implies `--quiet` and `--no-footer`
- Spinners: check `!opts.quiet && !opts.json` before creating spinner
- Usage footer: check `!opts.noFooter && !opts.json`
- ASCII art: check `!opts.quiet && !opts.json`

**`--json` on all commands** (not just search/get):
- `csc auth status --json` → `{ "authenticated": true, "key": "****...Zg==", "tier": "Supporter" }`
- `csc usage --json` → `{ "plan": "Supporter", "daily": { "used": 47, "limit": 1000 }, ... }`
- `csc upgrade --json` → `{ "plans": [...] }`
- `csc export --json` → `{ "url": "https://export.countrystatecity.in" }`

---

## 7. Machine-Readable Output

For AI agents and scripting:

**Consistent exit codes:**
- `0` — success
- `1` — error (API error, network error, invalid input)
- `2` — authentication required

**Stderr vs stdout:**
- **stdout** — data output only (tables, JSON, detail views)
- **stderr** — spinners, progress, error messages, usage footer

This ensures `csc search countries --json | jq '.'` works cleanly without spinner artifacts in the JSON.

**Implementation:** Change all `ora` spinner output and `printUsageFooter` to write to `process.stderr` instead of `process.stdout`. Data output (`printTable`, `printJson`, `printDetail`) stays on `process.stdout`.

---

## 8. API Changes Required

### Must-have (blocks CLI features)

**8.1 Usage Response Headers**

Set on ALL `/v1/*` responses in the `authenticateApiKey` middleware:

```
X-CSC-Daily-Used: 47
X-CSC-Daily-Limit: 1000
X-CSC-Monthly-Used: 1230
X-CSC-Monthly-Limit: 30000
X-CSC-Plan: supporter
```

Data source (already available in middleware):
- `UsageService.getDailyUsage(userId)` → daily count
- `pricingContext.dailyLimit` → daily cap
- `UsageService.getMonthlyUsageFast(userId)` → monthly count
- `pricingContext.monthlyLimit` → monthly cap
- `pricingContext.tier` → plan name

Where to add: After `authenticateApiKey` succeeds, before calling `next()`, set the headers on `res`.

**8.2 Plan Name Header**

`X-CSC-Plan` header with the tier name string (`community`, `starter`, `supporter`, etc.). Saves CLI from inferring tier by daily limit number.

### Nice-to-have

**8.3 Extended Country Fields**

Return `currency_name`, `currency_symbol`, `tld` on `GET /countries/:iso` for Supporter+ tiers (data access level `coordinates` or `full`). Currently these fields are not in the API response even though the data exists in the database.

**8.4 Plans API Alias**

Alias `GET /v1/plans` → existing `GET /plans` endpoint. Lets CLI fetch live pricing dynamically instead of hardcoding tier names and prices.

---

## 9. CLI Website — cli.countrystatecity.in

**Hosting:** GitHub Pages (static HTML/CSS/JS, no build step).

**Stack:** Single `index.html` file with inline CSS and minimal JS.

**Design:** Matches the main site brand — Cal Sans font, blue/green gradient, dark sections.

**Sections:**

1. **Hero** — ASCII art rendered in HTML, `npm install -g @countrystatecity/cli` with copy button, version badge
2. **Feature grid** — 4 cards: Search, Explore, Generate, Export — each with a terminal mockup screenshot or CSS animation
3. **Live demo** — Animated terminal showing `csc search countries --filter japan` → table output. CSS keyframe animation, no JS library.
4. **Quick start** — 3 steps: Install → Login → Search. Copy-paste ready commands.
5. **Pricing** — Tier comparison table (hardcoded, matching upgrade command output)
6. **Footer** — Links to API docs (`countrystatecity.in`), dashboard (`app.countrystatecity.in`), export tool (`export.countrystatecity.in`), GitHub repo

**Domain:** `cli.countrystatecity.in` → GitHub Pages CNAME

---

## 10. New Dependencies

| Package | Purpose | Size impact |
|---------|---------|-------------|
| `@inquirer/search` | Searchable select for explore + hybrid prompts | ~15KB |
| `@inquirer/select` | Action menu in explore | ~12KB |
| `@inquirer/confirm` | Confirmation prompts | ~8KB |

All from the `@inquirer/prompts` family — ESM-native, tree-shakeable.

---

## 11. What's NOT in Scope

- MCP server (future phase)
- Vue/vanilla/Laravel/Drizzle templates (Phase 2 per original plan)
- Tab completion (`csc completion`)
- Server-side search endpoint
- CLI-native export with credit system
- Dark/light theme switching
