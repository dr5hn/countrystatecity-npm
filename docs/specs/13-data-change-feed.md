# Task 13: Show What Data Changed

**Status:** Start after Tasks 01, 03, and 04  
**Main owner:** Data and API developer

## What this task is

Give Business customers a list of places that were added, removed, renamed, moved, or reclassified after a chosen date.

## Problem it solves

Customers who keep their own copy of CSC data must download full files and compare them after every update. This uses time and bandwidth and is easy to get wrong. A change API lets them update only the records that changed.

## Where changes should go

| GitHub repository | Area to change |
|---|---|
| [`dr5hn/csc-app`](https://github.com/dr5hn/csc-app) | `api/` change storage, update process, change route, and plan checks |
| [`dr5hn/countrystatecity-npm`](https://github.com/dr5hn/countrystatecity-npm) | Add change-list methods to the SDK |
| [`dr5hn/csc-docs`](https://github.com/dr5hn/csc-docs) | Change types, update examples, and 90-day limit |
| [`dr5hn/csc-swagger`](https://github.com/dr5hn/csc-swagger) | Add the change route to the playground/API reference |

## What to build

Keep these change types:

- Added.
- Removed.
- Renamed.
- Place group changed.
- Coordinates changed.
- Parent country/state changed.
- Other public fields changed.

Add:

```text
GET /v1/changes
```

Users can filter by:

- Start date.
- Country, state, or city.
- Country code.
- Change type.
- Result count.
- Next-page token.

Keep changes for 90 days. If a date is too old, return a clear message with the earliest available date.

## What each result needs

- A unique change ID.
- Data version.
- Change time.
- Place type and place ID.
- Change type.
- Old public values when needed.
- New public values when needed.

For a removed place, keep enough basic information so the customer knows what to delete.

## Important rules

- Business plan only.
- Compare the old approved data with the new approved data.
- Do not publish changes from a failed data update.
- Keep page order fixed even if another data update happens while the customer is reading pages.
- Next-page tokens must not show private database or customer information.
- Show only approved public fields.

## Work steps

1. Decide which public fields should be compared.
2. Build the comparison process.
3. Save changes with the new data version.
4. Publish data and its change list together.
5. Build filters and safe next-page tokens.
6. Add SDK and documentation support.
7. Delete changes older than 90 days.
8. Alert the team when a release has an unusually large number of changes.

## Simple tests

- Test every change type.
- Run the same comparison twice and get the same result.
- Start reading pages, publish a newer data version, and confirm the old page list stays stable.
- Test bad, changed, and expired next-page tokens.
- Confirm removed-place details contain no private fields.
- Make data checking fail and confirm no change list is published.

## Done when

- A Business customer can safely update a local copy using only the change API.
- Every change has a unique ID and correct data version.
- Page order stays stable.
- Failed updates never publish changes.
- Old changes are removed after 90 days.

## Not included

- Sending changes through webhooks in the first release.
- Keeping change history forever.
- Full database downloads.

