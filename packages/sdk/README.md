# @countrystatecity/sdk

[![npm](https://img.shields.io/npm/v/@countrystatecity/sdk)](https://www.npmjs.com/package/@countrystatecity/sdk)
[![CI](https://github.com/dr5hn/countrystatecity-npm/workflows/Pipeline/badge.svg)](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml)

Official JS/TS client for the live [CountryStateCity REST API](https://countrystatecity.in) — countries, states, cities, counties, postcodes, regions, currencies, phone codes, timezones, fuzzy search, and account usage. Zero runtime dependencies, dual ESM/CJS builds, full TypeScript types.

**Environment:** 🌐 **Node.js 18+ / Browser**

Need offline/bundled data instead of a live API call? See [`@countrystatecity/countries`](https://www.npmjs.com/package/@countrystatecity/countries) (Node) or [`@countrystatecity/countries-browser`](https://www.npmjs.com/package/@countrystatecity/countries-browser) (browser) and the [migration guide](./MIGRATION.md) below.

## ✨ Features

- 📦 Typed resource groups: `countries`, `states`, `cities`, `counties`, `postcodes`, `regions`, `currencies`, `iso`, `phone`, `timezones`, `search`, `usage`
- 🪶 No runtime dependencies — built on native `fetch`, `URL`/`URLSearchParams`, `AbortController`
- 🛡️ Structured errors (`AuthenticationError`, `ValidationError`, `FeatureRestrictedError`, `RateLimitError`, `NotFoundError`, `NetworkError`, `TimeoutError`) instead of generic exceptions
- 🔁 Automatic retries with jittered backoff for transient failures, respecting `Retry-After`
- ✅ Client-side input validation (ISO codes, coordinates, limits) before any network call
- 📊 Response metadata (request id, rate-limit usage, data version, cache status) exposed alongside — never merged into — the entity data

## 📦 Installation

```bash
npm install @countrystatecity/sdk
```

You'll need an API key — get one at [countrystatecity.in](https://countrystatecity.in).

## 🚀 Quick Start

```typescript
import { createCSCClient } from '@countrystatecity/sdk';

const csc = createCSCClient({ apiKey: process.env.CSC_API_KEY! });

const { data: countries } = await csc.countries.list();
const { data: states } = await csc.states.list({ country: 'IN' });
const { data: cities } = await csc.cities.list({ country: 'IN', state: 'MH' });

const { data: matches } = await csc.search.fuzzy({
  query: 'Mumbay',
  type: 'city',
  country: 'IN',
  limit: 10,
});
```

Every resource method returns `{ data, meta }` — `data` is exactly the API's entity payload, unwrapped and untouched; `meta` carries request/rate-limit/cache metadata alongside it. See [Response metadata](#-response-metadata).

## ⚙️ Configuration

```typescript
const csc = createCSCClient({
  apiKey: 'your-api-key',        // required — never read from env or persisted by the SDK
  baseUrl: 'https://api.countrystatecity.in/v1', // default
  timeout: 10_000,                // ms, per request attempt, default 10000
  fetch: myCustomFetch,           // optional custom fetch implementation
  headers: { 'X-Trace-Id': 'x' }, // extra headers merged into every request
  retry: { retries: 2, baseDelayMs: 200, maxDelayMs: 2000 }, // or `false` to disable
  userAgent: 'my-app/1.0',        // overrides the default countrystatecity-sdk-js/<version>
});
```

The SDK never reads `apiKey` from an environment variable and never writes it to disk — pass it explicitly at construction time.

## 📖 Resource reference

Every `list`/`get`/etc. method also accepts a trailing `{ signal?, timeout?, headers? }` for per-call overrides (see [Retries & timeouts](#-retries--timeouts)).

| Resource | Methods |
|---|---|
| `csc.countries` | `list({ limit?, offset?, fields?, sort?, locale?, includeTranslations? })`, `get(iso2, { locale?, includeTranslations? })` |
| `csc.states` | `list({ country?, limit?, offset?, fields?, sort?, locale?, includeTranslations? })`, `get(country, stateCode, { locale?, includeTranslations? })` |
| `csc.cities` | `list({ country, state?, kind?, limit?, offset?, fields?, sort?, locale?, includeTranslations? })` — `country` is required, unlike `countries`/`states`; `get(country, stateCode, cityId)` always throws `ValidationError`, see note below |
| `csc.counties` | `list({ country, state?, q?, fields?, sort?, locale?, includeTranslations? })`, `get(country, countyId, { fields?, locale?, includeTranslations? })`, `cities(country, countyId, { q?, kind?, type?, fields?, sort?, locale?, includeTranslations? })` |
| `csc.postcodes` | `get(country, code, { fields? })`, `list({ country, q?, stateCode?, cityId?, type?, limit?, cursor?, fields? })` — exact matches and cursor pages keep their API envelopes |
| `csc.regions` | `list()`, `get(id)`, `subregions(regionId)`, `getSubregion(id)`, `countries(subregionId)` — each accepts localization options |
| `csc.currencies` | `list()`, `get(code)`, `byCountry(iso2)` |
| `csc.iso` | `lookup({ iso2? \| iso3? \| numeric? })` |
| `csc.phone` | `list()`, `get(iso2)`, `byDialCode(dialCode)` |
| `csc.timezones` | `list()`, `byCountry(iso2)`, `convert({ time, from, to })` |
| `csc.search` | `fuzzy({ query, type?, country?, limit?, threshold?, locale?, includeTranslations? })` — typo-tolerant and translated-name search; results include `match_score`/`matched_alias` and a client-injected `type` field |
| `csc.search` | `autocomplete({ query, type?, country?, state?, limit?, locale?, includeTranslations? })` — type-ahead search with a ready display `label`; `matched_field` can be `name`, `native`, or `translation`; Supporter or higher plan |
| `csc.search` | `nearby({ lat, lng, type?, kind?, country?, state?, minPopulation?, radius?, limit?, locale?, includeTranslations? })` — localized nearby places, nearest first; radius 1–500 km; Supporter or higher plan. [Compare plans](https://countrystatecity.in/pricing?source=sdk_docs&campaign=nearby_search&package=sdk). |
| `csc.usage` | `get()` — returns cached rate-limit usage from the last request when available, otherwise makes one lightweight request |
| `csc.changes` | `list({ startDate?, placeType?, countryCode?, changeType?, limit?, nextPageToken? })` — cursor-paginated country, state, city, county, and postcode changes; Professional+ plan. [Compare plans](https://countrystatecity.in/pricing?source=sdk_docs&campaign=data_change_feed&package=sdk). |

`csc.cities.list()` requires `country` (the real API has no bare `GET /cities` route) — a `ValidationError` is thrown client-side if it's missing, same as `state` without `country`. `csc.cities.get()` always throws a `ValidationError` — the real API has no single-city-by-ID endpoint at all; fetch the containing `list({ country, state })` and find the city in the results instead.

`fields`/`sort` (e.g. `fields: ['name', 'iso2']`, `sort: ['name:desc']`) map to the API's `?fields=`/`?sort=` (Starter+ plan) — validated server-side, so an unknown field throws a `ValidationError`-mapped error from the response rather than client-side.

`locale` adds `localized_name` and `matched_locale` while keeping the English `name` and stable `id`. The fallback order is exact locale, base language, native name, then English. `includeTranslations: true` adds the full translation JSON string only when needed. Geographic routes and fuzzy, autocomplete, and nearby search support both options for Supporter and higher plans. [Compare plans](https://countrystatecity.in/pricing?source=sdk_docs&campaign=localized_place_data&package=sdk).

`csc.changes.list()` returns `{ results, next_page_token }`. Pass `next_page_token` back as `nextPageToken` to continue the same fixed snapshot; changes published after page one appear in a new request, not halfway through the current one. Tokens expire after 24 hours and changes are retained for 90 days. `old_values` and `new_values` contain only caller-visible fields; updates include only changed fields. When `startDate` is too old, `ValidationError.details` includes the API's `earliestAvailableDate`.

## Counties and postcodes

```ts
const { data: counties } = await csc.counties.list({ country: 'NZ', state: 'WKO' });
const { data: county } = await csc.counties.get('NZ', '14024');
// county.states keeps every membership; its primary state_id/state_code may be null.
const { data: cities } = await csc.counties.cities('NZ', '14024');

const { data: matches } = await csc.postcodes.get('LK', '11104');
console.log(matches.meta.match_count, matches.data); // all matching localities

const { data: page } = await csc.postcodes.list({ country: 'IN', q: '11', limit: 20 });
if (page.pagination.next_cursor) {
  const { data: nextPage } = await csc.postcodes.list({
    country: 'IN', cursor: page.pagination.next_cursor,
  });
}
```

County lists and linked-city lists are complete arrays, without pagination. Basic county and exact-postcode lookups are available on all plans; county `q`/field selection/sorting and postcode list/search require Starter+. Localization and additional fields depend on your plan. Postcode cursors expire after 24 hours and are bound to their country and filters; keep them opaque. The SDK fetches one page per call. Postcode `cityId` must be a string to preserve 64-bit IDs. Coverage and locality links vary by country; a postcode can match multiple localities and has no direct county link.

Since 0.3.0, `ICity` includes optional `county_id` and `population_year`. State links and coordinates may be null; plan-gated fields may be absent. The API serializes geographic IDs and populations as strings. City IDs accept `string | number` in types for compatibility with older fixtures; compare IDs using `String(id)`. County/postcode IDs are typed as strings. County/city coordinates are strings, while postcode coordinates are numbers. `population_year` is a number or null; an unknown year stays null. Field selection can narrow any response further. Since SDK 0.4.0, the change feed supports `placeType: 'county'` and `placeType: 'postcode'`. Unfiltered pages can contain all five place types; handle both new discriminators when updating an exhaustive switch. New entity history starts after the API baseline extension, without retroactive additions. County membership moves and postcode code/locality edits retain the same event envelope.

## 🛡️ Error handling

All errors extend `CSCError` (`message`, `statusCode`, `requestId`, `url`, `retryCount`):

```typescript
import {
  AuthenticationError,
  ForbiddenError,
  ValidationError,
  FeatureRestrictedError,
  RateLimitError,
  NotFoundError,
  NetworkError,
  TimeoutError,
} from '@countrystatecity/sdk';

try {
  await csc.search.fuzzy({ query: 'Mumbai' });
} catch (err) {
  if (err instanceof ValidationError) {
    console.error(`Bad input: ${err.field} — ${err.reason}`);
  } else if (err instanceof AuthenticationError) {
    console.error('Invalid or missing API key.');
  } else if (err instanceof ForbiddenError) {
    console.error('Request blocked by API-key domain or IP restrictions.');
  } else if (err instanceof FeatureRestrictedError) {
    console.error(`"${err.feature}" needs the ${err.requiredPlan} plan (you're on ${err.currentPlan}).`);
    console.error(`Upgrade: ${err.upgradeUrl}`);
  } else if (err instanceof RateLimitError) {
    console.error(`Rate limited (${err.scope}). Retry after ${err.retryAfter}s.`);
    console.error(`Upgrade: ${err.upgradeUrl}`);
  } else if (err instanceof NotFoundError) {
    console.error(`${err.resource} "${err.identifier}" not found.`);
  } else if (err instanceof TimeoutError) {
    console.error(`Timed out after ${err.timeoutMs}ms.`);
  } else if (err instanceof NetworkError) {
    console.error('Network or server error:', err.message);
  }
}
```

`ValidationError` is also thrown synchronously-as-a-rejection for malformed input (bad ISO codes, out-of-range coordinates, invalid limits) before any network call is made.

## 🔁 Retries & timeouts

GET requests are retried automatically on transient network errors, `429`, and `5xx` responses — never on `401`/`403`/`404`/`400`-class responses, and never on a caller-initiated `AbortSignal` cancellation. Defaults: 2 retries, full-jitter exponential backoff (200ms base, 2000ms cap), and any `Retry-After` response header takes precedence over the computed delay.

```typescript
const csc = createCSCClient({ apiKey: 'k', retry: false }); // disable entirely
const csc2 = createCSCClient({ apiKey: 'k', retry: { retries: 5, baseDelayMs: 100, maxDelayMs: 5000 } });
```

`timeout` applies **per attempt**, not as a total budget — worst-case latency for a call is roughly `timeout × attempts + sum(backoff delays)`. Override per call:

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 3000);

await csc.countries.list(undefined, { signal: controller.signal, timeout: 5000 });
```

## 📊 Response metadata

```typescript
const { data, meta } = await csc.countries.list();

meta.requestId;        // string | undefined
meta.rateLimit;         // { dailyUsed, dailyLimit, monthlyUsed, monthlyLimit } | undefined
meta.dataVersion;        // string | undefined
meta.cache;               // 'HIT' | 'MISS' | 'DYNAMIC' | undefined
meta.retryCount;           // number of retries this call needed
```

`csc.getLastResponseMeta()` returns the metadata from the most recent successful request on that client instance, useful for surfacing usage without an extra call.

## 🌐 Browser usage

```typescript
import { createCSCClient } from '@countrystatecity/sdk';

const csc = createCSCClient({ apiKey: PUBLISHABLE_RESTRICTED_KEY });
const { data } = await csc.countries.list();
```

**A key embedded in browser JavaScript is public** — visible in your bundle and every outgoing request. Never use an unrestricted/server key here. Instead, create a key in your CSC dashboard that's **restricted to specific allowed origins** (your site's domain(s)); requests from any other origin will be rejected server-side. The SDK does not add any additional protection on top of this — origin restriction is an account/dashboard setting, not a client-side one.

## 🟢 Node.js usage

See [`examples/node`](./examples/node) for runnable scripts covering the happy path and full error handling.

## ▲ Next.js usage

Keep the SDK **server-side** — in a Route Handler, Server Component, or Server Action — so your API key never reaches the client bundle. See [`examples/nextjs`](./examples/nextjs) for an annotated Route Handler.

## 🔧 TypeScript types

```typescript
import type {
  CSCClientOptions,
  CSCResponse,
  CSCResponseMeta,
  ICountry,
  IState,
  ICity,
  IRegion,
  ISubregion,
  ICurrency,
  IPhonecode,
  ITimezone,
  IConvertedTime,
  ISearchResult,
  IUsageSnapshot,
} from '@countrystatecity/sdk';
```

## 🔀 Migrating from a local data package?

If you're calling `@countrystatecity/countries` and want live/quota-aware data instead of the bundled snapshot, see [MIGRATION.md](./MIGRATION.md).

## 📄 License

MIT
