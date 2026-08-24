# Node examples

- `basic-usage.mjs` — construct a client, list/get countries and states, run a fuzzy search.
- `error-handling.mjs` — catches every `@countrystatecity/sdk` error class with an actionable message.

Both run against the real `@countrystatecity/sdk` package once installed:

```bash
npm install @countrystatecity/sdk
CSC_API_KEY=your-key node basic-usage.mjs
CSC_API_KEY=your-key node error-handling.mjs
```
