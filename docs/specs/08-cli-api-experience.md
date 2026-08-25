# Task 08: Improve the CLI

**Status:** Start after Task 05  
**Main owner:** CLI developer

## What this task is

Use the new SDK inside the CLI and add commands that show the strongest API features.

## Problem it solves

The CLI has its own API request code, filters some large results on the user's computer, and does not show fuzzy or nearby search. Its plan list can also become different from the website. This makes the CLI harder to maintain and less useful for showing why someone should use the paid API.

## Where changes should go

| GitHub repository | Area to change |
|---|---|
| [`dr5hn/countrystatecity-npm`](https://github.com/dr5hn/countrystatecity-npm) | `packages/cli` |
| [`dr5hn/csc-docs`](https://github.com/dr5hn/csc-docs) | CLI command examples |

The older [`dr5hn/countrystatecity-cli`](https://github.com/dr5hn/countrystatecity-cli) repository should not be used for this task unless the team first decides to move the newer CLI back there.

## What to build

- Replace the CLI's API request code with `@countrystatecity/sdk`.
- Keep all current commands working.
- Send search, field, and sort options to the API instead of downloading everything first.
- Add fuzzy search for country, state, or city names.
- Add nearby search after Task 11 is ready.
- Read plans and limits from Task 03 instead of keeping a plan list in CLI code.
- Keep `--json`, `--quiet`, and `--no-footer` working.

Example commands:

```bash
csc search "Banglore" --type city --country IN --fuzzy
csc search cities --country IN --state MH --kind settlement
csc nearby --lat 19.076 --lng 72.878 --radius 25
```

## Important rules

- A paid-feature error must show the required plan and pricing link.
- A failed normal command must not open a browser by itself.
- The user-run `csc upgrade` command may open the pricing page.
- Never print the full saved API key.
- JSON output must stay clean for scripts.

## Work steps

1. Add the SDK to the CLI.
2. Remove the old request and error code after SDK tests pass.
3. Move supported filters to the API request.
4. Add fuzzy search.
5. Read live plan information.
6. Add nearby search when its API is ready.
7. Update CLI help and docs.

## Simple tests

- Run all current CLI tests.
- Confirm search options are sent to the API.
- Confirm fuzzy search shows match score and place details.
- Confirm paid-feature and request-limit errors are different.
- Confirm `--json` prints only JSON.
- Search all output to confirm the API key is hidden.

## Done when

- The CLI uses the SDK for API requests.
- Old CLI commands still work.
- Fuzzy search works from the terminal.
- Plan information matches the website/API.
- API keys remain hidden.

## Not included

- Building the SDK. That is Task 05.
- Generating location UI. That is Task 10.

