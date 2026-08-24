# Migrating from `@countrystatecity/countries`

`@countrystatecity/countries` (and its browser counterpart, `@countrystatecity/countries-browser`) ship a bundled/CDN-hosted snapshot of the database — free, offline-capable, no API key, no network call. `@countrystatecity/sdk` instead calls the live REST API — quota-aware, always current, and covering endpoints (`search`, `usage`, and live currency/timezone/phone lookups) that don't exist in the local snapshot.

## Why migrate

- You need data more current than the weekly-updated local snapshot.
- You need `search` or `usage`, which have no local-package equivalent.
- You're already calling the live API elsewhere and want one typed client instead of hand-rolled `fetch` calls.

## Why *not* to migrate

If you don't need any of the above, staying on the local package is usually the better choice — it's free, has no network latency, and isn't subject to plan quotas.

## The three primary hierarchy calls

| `@countrystatecity/countries` | `@countrystatecity/sdk` | Notes |
|---|---|---|
| `getCountries()` | `const { data } = await csc.countries.list()` | Local: synchronous-ish, bundled snapshot, no quota. SDK: live network call, subject to your plan's rate limits, wrapped in `{ data, meta }`. |
| `getStatesOfCountry('US')` | `const { data } = await csc.states.list({ country: 'US' })` | |
| `getCitiesOfState('US', 'CA')` | `const { data } = await csc.cities.list({ country: 'US', state: 'CA' })` | |

```typescript
// Before
import { getCountries, getStatesOfCountry, getCitiesOfState } from '@countrystatecity/countries';

const countries = await getCountries();
const states = await getStatesOfCountry('US');
const cities = await getCitiesOfState('US', 'CA');
```

```typescript
// After
import { createCSCClient } from '@countrystatecity/sdk';

const csc = createCSCClient({ apiKey: process.env.CSC_API_KEY! });

const { data: countries } = await csc.countries.list();
const { data: states } = await csc.states.list({ country: 'US' });
const { data: cities } = await csc.cities.list({ country: 'US', state: 'CA' });
```

## Things that change

- **An API key is required.** The local package needs none.
- **Every call is async and can fail with a network-shaped error** (`RateLimitError`, `NetworkError`, `TimeoutError`, ...) in addition to the local package's simpler failure modes — see the [error handling](./README.md#-error-handling) section of the README.
- **Results are quota-limited** per your plan (`RateLimitError`), not just rate-limited by your own code.
- **The shape is `{ data, meta }`**, not the bare array/object the local package returns — destructure `data` at the call site, as shown above.

## You can use both

Nothing stops you from keeping `@countrystatecity/countries` for offline/bundled lookups and adding `@countrystatecity/sdk` only for the capabilities it uniquely provides (`search`, `usage`, guaranteed-current data). They don't conflict.
