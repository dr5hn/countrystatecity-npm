# Task 02: Separate Cities from Admin Places

**Status:** Start after Task 01  
**Main owner:** API and data developer

## What this task is

Give every city/place record a simple group so users can ask for settlements only. Keep the original source type for users who need it.

## Problem it solves

The source city list also contains counties, parishes, districts, and other government areas. A customer building a city dropdown can show wrong choices. Customers should not need to understand many source type names to get a clean list.

## Where changes should go

| GitHub repository | Area to change |
|---|---|
| [`dr5hn/csc-app`](https://github.com/dr5hn/csc-app) | `api/` database, city routes, filters, and tests |
| [`dr5hn/countrystatecity-npm`](https://github.com/dr5hn/countrystatecity-npm) | Data-generation scripts and types if npm should show the new group |
| [`dr5hn/csc-docs`](https://github.com/dr5hn/csc-docs) | Explain the new filter and the source-data limitation |

## What to build

Add a new field named `kind` with one of these values:

- `settlement` — city, town, village, municipality, or capital.
- `administrative` — county, parish, or government area.
- `section` — a smaller part of a place.
- `unknown` — not understood yet.

Keep the original `type` value from the source.

Add API filters such as:

- `kind=settlement`
- `kind=administrative`
- `type=city,municipality` for plans that can use detailed fields.

## Important rules

- Do not delete source records.
- Do not change the normal `/cities` result in the first release.
- A user gets the cleaner list only when they use the new filter.
- New or unknown source types must be shown in the weekly data report.

## Work steps

1. List every source type and its record count.
2. Create one simple mapping file from source `type` to CSC `kind`.
3. Ask for review when a source type is not clear.
4. Save or generate the new `kind` value.
5. Add API filters and database indexes if needed.
6. Update documentation and examples.

## Simple tests

- US counties and parishes are `administrative`.
- Normal cities and towns are `settlement`.
- Unknown types remain available as `unknown`.
- A request without the new filter returns the same result as before.
- Test examples from the US, India, Bangladesh, Taiwan, and Estonia.

## Done when

- Customers can request settlement-only results.
- Every source type is mapped or clearly reported as unknown.
- No source record is lost.
- Existing city requests still work as before.

## Not included

- A separate worldwide counties product.
- Changing the default meaning of `/cities`.

