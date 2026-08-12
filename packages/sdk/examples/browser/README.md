# Browser example

`index.html` + `main.js` call `@countrystatecity/sdk` directly from browser JavaScript.

## Before you use a real key here

Any API key referenced in browser code is **public** — visible in your shipped bundle and in every outgoing network request, regardless of how it's stored client-side. Do not use an unrestricted or server-side key.

Instead, in your CSC dashboard, create a key **restricted to specific allowed origins** (e.g. `https://your-app.example.com`). Requests from any other origin are rejected server-side, which is what actually protects the key here — the SDK itself adds no additional protection on top of this.

## Running this example

Any static server works, e.g.:

```bash
npx serve .
```

`main.js` imports `@countrystatecity/sdk` as a bare specifier — resolve it with an import map, a bundler, or by pointing to a CDN build in a real project.
