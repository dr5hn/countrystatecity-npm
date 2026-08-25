# Task 11: Find Places Near a Location

**Status:** Start after Tasks 01, 02, 03, and 05  
**Main owner:** API and database developer

## What this task is

Add an API route that returns known countries, states, or cities near a latitude and longitude.

## Problem it solves

The source data already has coordinates, but customers must download many records and calculate distance themselves. Large applications need a location database and special search setup to do this quickly. The API can provide this as a managed Professional feature.

## Where changes should go

| GitHub repository | Area to change |
|---|---|
| [`dr5hn/csc-app`](https://github.com/dr5hn/csc-app) | `api/` database location index, nearby route, plan checks, and tests |
| [`dr5hn/countrystatecity-npm`](https://github.com/dr5hn/countrystatecity-npm) | SDK nearby method and CLI nearby command |
| [`dr5hn/csc-swagger`](https://github.com/dr5hn/csc-swagger) | Nearby search in the public playground |
| [`dr5hn/csc-docs`](https://github.com/dr5hn/csc-docs) | Nearby API guide and limitations |

## What to build

Add:

```text
GET /v1/search/nearby
```

The route accepts:

- Latitude between -90 and 90.
- Longitude between -180 and 180.
- Country, state, or city type.
- Optional settlement/admin `kind`.
- Optional country and state filters.
- Optional minimum population.
- Search distance. Default 25 km, maximum 500 km.
- Result limit. Default 20, maximum 100.

Return each place with its normal details and distance. Show results from nearest to farthest.

## Important rules

- Production use is for Professional and Business plans.
- Other plans can try it in the public playground.
- Use a database location index. Do not check every city for every request.
- Exclude places with missing or invalid coordinates.
- Cache repeated searches separately for each plan and filter set.

## Be clear about what this is not

This feature finds nearby known points. It does not:

- Find a street address.
- Prove that a point is inside a map boundary.
- Return country or state map shapes.
- Calculate travel time or road distance.

## Work steps

1. Add and fill the database location field/index.
2. Add input checks.
3. Build the nearby search.
4. Add type, kind, country, state, and population filters.
5. Add plan checks and caching.
6. Add SDK, CLI, playground, and docs support.
7. Test speed in large cities and wide search areas.

## Simple tests

- Mumbai coordinates return nearby Mumbai places in distance order.
- A place's exact coordinates return almost zero distance.
- Test locations near the international date line and near the poles.
- Invalid coordinates and very large limits return clear errors.
- Check that the database uses the location index.
- Confirm lower plans get the correct upgrade message.

## Done when

- Results are correct and ordered by distance.
- The database does not scan every city.
- SDK, CLI, and API use the same options.
- Speed is below 150 ms when cached and 300 ms when not cached.
- Documentation clearly says this is not address search.

## Not included

- Address search.
- Map boundary shapes.
- Road or travel distance.

