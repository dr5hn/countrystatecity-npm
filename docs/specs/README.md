# CSC API Growth Work: Task List

This folder breaks the main PRD into small tasks. Each task explains:

- Why we need it.
- Which GitHub repository to change.
- What the developer needs to build.
- How to check that the work is complete.

Read the [short product PRD](../PRD-NPM-TO-API-GROWTH-PLATFORM.md) first.

## GitHub repository map

| Repository | What is inside |
|---|---|
| [`dr5hn/countrystatecity-npm`](https://github.com/dr5hn/countrystatecity-npm) | npm packages, the new API SDK, data scripts, and the current CLI |
| [`dr5hn/csc-app`](https://github.com/dr5hn/csc-app) | API server in `api/` and customer dashboard in `web/` |
| [`dr5hn/csc-website-v2`](https://github.com/dr5hn/csc-website-v2) | Public website and pricing page |
| [`dr5hn/csc-docs`](https://github.com/dr5hn/csc-docs) | Public API and product documentation |
| [`dr5hn/csc-swagger`](https://github.com/dr5hn/csc-swagger) | API playground |
| [`dr5hn/countries-states-cities-database`](https://github.com/dr5hn/countries-states-cities-database) | Source data used by the API and npm packages |

## Work order

| No. | Task | Main repository | Start after |
|---|---|---|---|
| 01 | [Download and check source data](./01-data-ingestion-and-manifest.md) | `dr5hn/countrystatecity-npm` | Start now |
| 02 | [Separate cities from admin places](./02-place-classification.md) | `dr5hn/csc-app` | Task 01 |
| 03 | [Keep plans and feature access in one place](./03-entitlements-and-errors.md) | `dr5hn/csc-app` | Start now |
| 04 | [Show the data version](./04-data-version-metadata.md) | `dr5hn/csc-app` | Task 01 |
| 05 | [Build the TypeScript API SDK](./05-typescript-api-sdk.md) | `dr5hn/countrystatecity-npm` | Tasks 03 and 04 |
| 06 | [Measure npm-to-API conversion](./06-conversion-analytics.md) | `dr5hn/csc-app` | Task 03 |
| 07 | [Improve npm and website API links](./07-npm-docs-funnel.md) | `dr5hn/countrystatecity-npm` | Tasks 05 and 06 |
| 08 | [Improve the CLI](./08-cli-api-experience.md) | `dr5hn/countrystatecity-npm` | Task 05 |
| 09 | [Build location autocomplete](./09-autocomplete-api.md) | `dr5hn/csc-app` | Tasks 01, 02 and 03 |
| 10 | [Generate ready-to-use location UI](./10-location-component-generators.md) | `dr5hn/countrystatecity-npm` | Tasks 05, 08 and 09 |
| 11 | [Find places near a location](./11-nearby-search.md) | `dr5hn/csc-app` | Tasks 01, 02, 03 and 05 |
| 12 | [Add translated state and city names](./12-localized-place-data.md) | `dr5hn/csc-app` | Tasks 01, 05 and 09 |
| 13 | [Show what data changed](./13-data-change-feed.md) | `dr5hn/csc-app` | Tasks 01, 03 and 04 |

## Work that can happen at the same time

- Tasks 01 and 03 can start together.
- Tasks 05 and 06 can start after their foundation work is ready.
- Tasks 07 and 08 can start together after the SDK is ready.
- Tasks 09 and 11 can be built at the same time.
- Task 13 does not need to wait for search work.

## Rule for every task

A task is complete only when:

- The feature works.
- Automated tests pass.
- The public documentation is updated.
- Old API and npm users are not broken.
- API keys and private customer data are not written to logs.
- There is a safe way to undo the release if it causes a problem.

