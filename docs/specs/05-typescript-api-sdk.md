# Task 05: Build the TypeScript API SDK

**Status:** Start after Tasks 03 and 04  
**Main owner:** npm and developer-tools developer

## What this task is

Publish `@countrystatecity/sdk`, an official JavaScript and TypeScript package for calling the live CSC API.

## Problem it solves

Today, developers must write request URLs, API-key headers, timeout code, retry code, and error handling themselves. This makes moving from an offline npm package to the API harder than it should be. The CLI also has its own copy of similar request code.

## Where changes should go

| GitHub repository | Area to change |
|---|---|
| [`dr5hn/countrystatecity-npm`](https://github.com/dr5hn/countrystatecity-npm) | Add a new `packages/sdk` package |
| [`dr5hn/csc-docs`](https://github.com/dr5hn/csc-docs) | SDK setup, examples, and migration guide |

## What to build

- Package name: `@countrystatecity/sdk`.
- Works in Node.js 18+ and modern browsers.
- TypeScript types included.
- Uses the built-in `fetch` function.
- Accepts API key, API URL, and timeout settings.
- Supports all public CSC API routes available at launch.
- Returns both the requested data and useful information such as request ID, request limits, and data version.
- Gives clear errors for:
  - Invalid API key.
  - Invalid input.
  - Feature not included in the plan.
  - Request limit finished.
  - Item not found.
  - Network problem.
  - Timeout.

## Main SDK sections

- Countries.
- States.
- Cities.
- Regions and subregions.
- Currencies.
- ISO lookup.
- Phone codes.
- Timezones.
- Fuzzy search.
- Plan and data-version information.

Later tasks will add autocomplete, nearby search, translations, and data changes.

## Important rules

- Never put the API key in a URL, log, or error message.
- Stop a request after the chosen timeout.
- Allow the application to cancel a request.
- Retry only safe read requests when there is a temporary network/server problem.
- Do not retry bad input, bad API keys, or unavailable paid features.
- Keep the installed package small. Target: 20 kB or less after minify and gzip.

## Work steps

1. Create the new package and build setup.
2. Build one shared request function.
3. Add clear error classes.
4. Add methods for all current public API routes.
5. Add examples for Node.js, Next.js, and browser use.
6. Add package-size and package-content checks.
7. Publish a test version and use it in the CLI before version `1.0.0`.

## Simple tests

- Test every SDK method with a fake API response.
- Test each error type.
- Test timeout, cancel, and retry behavior.
- Search all errors and URLs to confirm the API key is never shown.
- Test Node.js import, CommonJS import, and a browser build.
- Test with API keys for each plan in a test environment.

## Done when

- Developers can use every current public API route through typed methods.
- The CLI can use the SDK instead of its own request code.
- Errors clearly explain the problem and next step.
- The package is within the size target.
- Setup and migration examples work.

## Not included

- Saving a user's API key.
- Offline data inside the SDK.
- User tracking inside the SDK.

