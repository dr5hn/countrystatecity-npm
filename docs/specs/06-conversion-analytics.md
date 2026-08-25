# Task 06: Measure npm-to-API Conversion

**Status:** Start after Task 03  
**Main owner:** API and product analytics developer

## What this task is

Measure how many people move from npm or CLI to API registration, first API use, regular use, and a paid plan.

## Problem it solves

The npm packages have many downloads, but there is no clear report showing how many of those users become API customers. Without this report, the team cannot know whether README links, the SDK, CLI changes, or premium features are helping the business.

## Where changes should go

| GitHub repository | Area to change |
|---|---|
| [`dr5hn/csc-app`](https://github.com/dr5hn/csc-app) | `api/` events and `web/` reporting dashboard |
| [`dr5hn/csc-website-v2`](https://github.com/dr5hn/csc-website-v2) | Keep safe tracking values when a user moves to registration/pricing |
| [`dr5hn/countrystatecity-npm`](https://github.com/dr5hn/countrystatecity-npm) | Add safe tracking values only to README and CLI links |

## What to build

Build reports that measure these steps:

1. A user opens an API link from npm, GitHub, SDK docs, CLI, or playground.
2. Registration starts.
3. An API key is created.
4. The key makes its first successful API request.
5. The account uses the API again in a later week.
6. The account moves to a paid plan.

Also count:

- Paid-feature errors.
- Request-limit errors.
- Use of fuzzy search, autocomplete, and nearby search.

## Safe tracking values

Use simple link values such as:

- Source: `npm`, `github`, `cli`, `sdk_docs`, or `playground`.
- Campaign: `sdk_api_migration`.
- Package name: for example `countries`.

## Important privacy rules

- Do not send tracking from offline npm package code.
- Do not save raw API keys in reports.
- Do not save full search words, latitude/longitude, or private customer data in product events.
- Use internal random IDs when reports need to connect events.
- Keep detailed events for 90 days; keep totals for longer if needed.

## Work steps

1. Save current numbers for 30 days before changing links.
2. Keep safe source information during registration.
3. Record the first successful request only once per key.
4. Record paid-feature and request-limit errors.
5. Connect paid-plan changes to the same internal account ID.
6. Build a simple funnel dashboard.
7. Alert the team if tracking suddenly stops or doubles.

## Simple tests

- Confirm only approved source names are accepted.
- Refresh or retry registration and confirm events are not counted twice.
- Confirm API keys, search words, and coordinates are not in event data.
- Compare dashboard totals with registration, API, and billing totals.

## Done when

- The team can see conversion for each npm package and CLI.
- The team can see first use, later use, and paid upgrades.
- Reports do not contain API keys or private location searches.
- Numbers match the main account and billing systems.

## Not included

- Advertising tracking.
- Recording what users do inside offline npm packages.
