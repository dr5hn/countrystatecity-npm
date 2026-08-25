# Task 04: Show the Data Version

**Status:** Start after Task 01  
**Main owner:** API and npm developer

## What this task is

Show which source-data release is used by an API response or npm package.

## Problem it solves

Customers cannot easily tell if they are using old data. Support also cannot reproduce a data problem without knowing the exact source version. A small version value makes bugs easier to investigate and builds trust in the live API.

## Where changes should go

| GitHub repository | Area to change |
|---|---|
| [`dr5hn/csc-app`](https://github.com/dr5hn/csc-app) | `api/` response headers and data-version route |
| [`dr5hn/countrystatecity-npm`](https://github.com/dr5hn/countrystatecity-npm) | Country packages and generated version file |
| [`dr5hn/csc-docs`](https://github.com/dr5hn/csc-docs) | Explain how users can check their version |

## What to build

- Add a public API route: `GET /v1/meta/data-version`.
- Return the data version, source release, update date, and main record counts.
- Add these values to API response headers:
  - `X-CSC-Data-Version`
  - `X-CSC-Data-Updated-At`
  - `X-Request-ID`
- Add `getDataVersion()` to the country npm packages.
- Make sure `getDataVersion()` does not load all country or city data.

## Important rules

- The API route and response headers must always show the same version.
- Data and version information must be updated together.
- If a data update fails, the version must not change.
- Data-version information is available on every plan.

## Work steps

1. Decide a clear version format using the source release and date.
2. Read the active version from the Task 01 manifest.
3. Add the API route and headers.
4. Generate a small version file for npm packages.
5. Write steps for going back to the previous data version.

## Simple tests

- Check headers on both successful and failed API requests.
- Confirm the version route matches the active database.
- Confirm npm can read the version without loading city data.
- Make a data update fail and confirm the old version stays active.
- Test going back to the previous version.

## Done when

- A customer can share one data-version value with support.
- API headers, API route, and npm package all show the correct version.
- A failed update cannot publish a new version.

## Not included

- A list of every changed city or state. That is Task 13.

