# Task 09: Build Location Autocomplete

**Status:** Start after Tasks 01, 02, and 03  
**Main owner:** API search developer

## What this task is

Add a fast API route that suggests countries, states, or cities while a user types.

## Problem it solves

The API already has fuzzy search, but app developers still need to build their own autocomplete rules, place labels, filters, and sorting. They may also download a full city list for every search. A ready autocomplete API saves work and gives customers a strong reason to use the Professional plan.

## Where changes should go

| GitHub repository | Area to change |
|---|---|
| [`dr5hn/csc-app`](https://github.com/dr5hn/csc-app) | `api/` search route, search logic, database indexes, and tests |
| [`dr5hn/countrystatecity-npm`](https://github.com/dr5hn/countrystatecity-npm) | Add autocomplete to the SDK after the API is ready |
| [`dr5hn/csc-swagger`](https://github.com/dr5hn/csc-swagger) | Add autocomplete to the public API playground |
| [`dr5hn/csc-docs`](https://github.com/dr5hn/csc-docs) | API instructions and examples |

## What to build

Add:

```text
GET /v1/search/autocomplete
```

The route accepts:

- Search text. Minimum 2 characters.
- Place type: country, state, or city.
- Optional country and state filters.
- Optional `kind` filter from Task 02.
- Optional language after Task 12.
- Result limit. Default 10, maximum 50.

Each result should include:

- Place ID and type.
- Main name.
- A clear label such as “Bangalore, Karnataka, India”.
- State and country codes.
- Match score.
- Which name matched.
- Other fields allowed by the user's plan.

## How results should be ordered

1. Exact name first.
2. Names that start with the search text.
3. Close spelling matches.
4. Better place type and country/state match.
5. Larger population may help when two results are otherwise close.

Use the place ID as the final tie-breaker so the order stays the same.

## Important rules

- Production use is for Professional and Business plans.
- Other plans can try it in the public playground.
- Repeated common searches should be cached.
- Cache results separately for each plan and language so paid fields cannot leak.
- The search must use database indexes and must not scan every city.

## Work steps

1. Reuse the existing fuzzy search where possible.
2. Add exact and starts-with matching.
3. Add country, state, type, and kind filters.
4. Create clear place labels.
5. Add caching and plan checks.
6. Add SDK, playground, and documentation support.
7. Test speed with common and misspelled searches.

## Simple tests

- `Banglore` finds Bangalore.
- Exact `Bangalore` appears before weaker matches.
- Places with the same name show different state/country labels.
- Admin areas do not appear above cities when settlements are requested.
- One-character and very long searches return a clear error.
- Lower plans get a clear upgrade message.
- Cached results never show fields from a higher plan.

## Done when

- Results are fast, useful, and always ordered in the same way.
- The old fuzzy-search route still works.
- The SDK and playground can use autocomplete.
- Speed targets are below 150 ms when cached and 300 ms when not cached.

## Not included

- Street or address search.
- Building the final user interface. That is Task 10.

