# Task 07: Improve npm and Website API Links

**Status:** Start after Tasks 05 and 06  
**Main owner:** Documentation and npm developer

## What this task is

Clearly explain when a developer should use local npm data and when the live API is a better choice. Show a small example for moving from npm to the SDK.

## Problem it solves

Most developers first find CSC through npm. The current README files explain local data well but do not clearly show the API upgrade path. Developers may keep old data or build their own search system without knowing that the CSC API already solves the problem.

## Where changes should go

| GitHub repository | Area to change |
|---|---|
| [`dr5hn/countrystatecity-npm`](https://github.com/dr5hn/countrystatecity-npm) | Root README and every package README |
| [`dr5hn/csc-docs`](https://github.com/dr5hn/csc-docs) | SDK guide and npm-to-API migration pages |
| [`dr5hn/csc-website-v2`](https://github.com/dr5hn/csc-website-v2) | Pricing and product links |
| [`dr5hn/csc-app`](https://github.com/dr5hn/csc-app) | `web/` registration must keep the safe source information from Task 06 |

## What to build

Add a small section called **“Local package or live API?”** near the first full example.

Use local npm data when:

- The app must work offline.
- A fixed snapshot is enough.
- Only simple dropdowns or lookups are needed.

Use the API when:

- Data should update without a package release.
- The app needs server search or filters.
- The app needs fuzzy, translated, or nearby search.
- The app needs larger limits and support.

Also add:

- “Start free with 3,000 requests per month.”
- SDK install command.
- Short examples for countries, states, and cities.
- Safe source values in registration and pricing links.

## Important rules

- Keep the local npm quick start first.
- Do not show ads through console messages, install scripts, warnings, or popups.
- Do not say that raw fields are API-only when the source database already has them.
- Sell the API using freshness, easy search, speed, limits, and support.
- Do not promise address search or map boundary shapes.

## Work steps

1. List all npm README and public documentation pages.
2. Create one short common text block.
3. Update `countries` and `countries-browser` first.
4. Update other packages and public docs.
5. Correct old package counts and “coming soon” SDK text.
6. Check that registration keeps the source information.
7. Add automatic link and example checks.

## Simple tests

- Open every API, pricing, and registration link.
- Run or compile the SDK examples.
- Preview each important README as it will appear on npm.
- Confirm a test registration records the correct source package.

## Done when

- A developer can quickly choose between local npm and live API.
- All migration examples work.
- The business can see which package sent the registration.
- npm package code works exactly as before.

## Not included

- Changing npm data.
- Runtime advertising.
- Paid advertising campaigns.
