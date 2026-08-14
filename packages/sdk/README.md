# @countrystatecity/sdk

[![npm](https://img.shields.io/npm/v/@countrystatecity/sdk)](https://www.npmjs.com/package/@countrystatecity/sdk)
[![CI](https://github.com/dr5hn/countrystatecity-npm/workflows/Pipeline/badge.svg)](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml)

Official JS/TS client for the live [CountryStateCity REST API](https://countrystatecity.in) — countries, states, cities, regions, currencies, phone codes, timezones, fuzzy search, and account usage. Zero runtime dependencies, dual ESM/CJS builds, full TypeScript types.

**Environment:** 🌐 **Node.js 18+ / Browser**

Need offline/bundled data instead of a live API call? See [`@countrystatecity/countries`](https://www.npmjs.com/package/@countrystatecity/countries) (Node) or [`@countrystatecity/countries-browser`](https://www.npmjs.com/package/@countrystatecity/countries-browser) (browser) and the [migration guide](./MIGRATION.md) below.

## ✨ Features

- 📦 Typed resource groups: `countries`, `states`, `cities`, `regions`, `currencies`, `iso`, `phone`, `timezones`, `search`, `usage`, `changes`
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
| `csc.regions` | `list({ locale?, includeTranslations? })`, `get(id, { locale?, includeTranslations? })`, `subregions(id, { locale?, includeTranslations? })` |
| `csc.currencies` | `list()`, `get(code)`, `byCountry(iso2)` |
| `csc.iso` | `lookup({ iso2? \| iso3? \| numeric? })` |
| `csc.phone` | `list()`, `get(iso2)`, `byDialCode(dialCode)` |
| `csc.timezones` | `list()`, `byCountry(iso2)`, `convert({ time, from, to })` |
| `csc.search` | `fuzzy({ query, type?, country?, limit?, threshold? })` — `type` defaults to `'city'`; results include `match_score`/`matched_alias` and a client-injected `type` field |
| `csc.search` | `autocomplete({ query, type?, country?, state?, limit? })` — type-ahead search with a computed `label` (e.g. `"Bangalore, Karnataka, India"`), `match_score`, and `matched_field`; `state` requires `country`; Professional+ plan |
| `csc.search` | `nearby({ lat, lng, type?, country?, state?, minPopulation?, radius?, limit? })` — places near a coordinate, nearest-first; results include `distance_km` and unconditional `country_name`/`state_name` (never tier-gated); `radius` 1-500km (default 25), `limit` 1-100 (default 20); `state` requires `country`; Professional+ plan |
| `csc.usage` | `get()` — returns cached rate-limit usage from the last request when available, otherwise makes one lightweight request |
| `csc.changes` | `list({ startDate?, placeType?, countryCode?, changeType?, limit?, nextPageToken? })` — cursor-paginated feed of country/state/city changes; Business plan |

`csc.cities.list()` requires `country` (the real API has no bare `GET /cities` route) — a `ValidationError` is thrown client-side if it's missing, same as `state` without `country`. `csc.cities.get()` always throws a `ValidationError` — the real API has no single-city-by-ID endpoint at all; fetch the containing `list({ country, state })` and find the city in the results instead.

`fields`/`sort` (e.g. `fields: ['name', 'iso2']`, `sort: ['name:desc']`) map to the API's `?fields=`/`?sort=` (Supporter+ plan) — validated server-side, so an unknown field throws a `ValidationError`-mapped error from the response rather than client-side.

`locale`/`includeTranslations` map to the API's `?locale=`/`?include_translations=` (Professional+ plan). When `locale` is set (e.g. `'pt-BR'`), matching results gain `localized_name`/`matched_locale` (which fallback tier actually matched: the exact locale, base language, `native`, or `name` itself) — `name`/`id` are never replaced. `includeTranslations: true` adds the full raw `translations` object (previously always included for full-tier callers; now opt-in, since it can roughly triple response size on large unpaginated lists). Both are silently omitted — not a `403` — for plans below Professional, same treatment as `fields`/`sort`. Not available on `cities.get()`: the real API has no single-city-by-ID endpoint at all. `csc.search.fuzzy()` now also matches translated/native names automatically server-side — no new SDK param needed, and there's no per-locale filter on fuzzy search itself since it searches across all languages at once. `csc.search.autocomplete()`/`csc.search.nearby()` don't support `locale`/`includeTranslations` yet.

`csc.changes.list()` returns `{ results, next_page_token }` — an object, not a bare array like every other `list()` method — since pagination is cursor-based, not `limit`/`offset`. Pass the previous page's `nextPageToken` alone to continue; resending a filter param that disagrees with the token's original filters is a `400` server-side, not silently dropped. Each result's `old_values`/`new_values` are tier-filtered subsets of the place's public fields (`null` for `'added'`/`'removed'` respectively) — `change_id`/`data_version`/`place_id`/`changed_at` are never redacted.

## 🛡️ Error handling

All errors extend `CSCError` (`message`, `statusCode`, `requestId`, `url`, `retryCount`):

```typescript
import {
  AuthenticationError,
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
  } else if (err instanceof FeatureRestrictedError) {
    console.error(`"${err.feature}" needs the ${err.requiredPlan} plan (you're on ${err.currentPlan}).`);
    console.error(`Upgrade: ${err.upgradeUrl}`);
  } else if (err instanceof RateLimitError) {
    console.error(`Rate limited (${err.scope}). Retry after ${err.retryAfter}s.`);
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
  IChangeEvent,
} from '@countrystatecity/sdk';
```

## 🔀 Migrating from a local data package?

If you're calling `@countrystatecity/countries` and want live/quota-aware data instead of the bundled snapshot, see [MIGRATION.md](./MIGRATION.md).

## 📄 License

MIT
