# Next.js example

`app/api/countries/route.ts` is a single annotated Route Handler — not a full app — showing the pattern to follow: the SDK (and your `CSC_API_KEY`) stay server-side, and browser code calls your own same-origin API route instead of importing `@countrystatecity/sdk` directly.

```bash
# .env.local
CSC_API_KEY=your-key
```

The same pattern applies to Server Components and Server Actions — construct `createCSCClient` in server-only code, never in a `'use client'` file.

If you do need to call the CSC API directly from the browser (e.g. a client-heavy app with no backend), see [`../browser`](../browser) instead — it requires a differently-configured, origin-restricted key.
