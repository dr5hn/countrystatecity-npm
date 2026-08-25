# Task 10: Generate Ready-to-Use Location UI

**Status:** Start after Tasks 05, 08, and 09  
**Main owner:** CLI and frontend developer

## What this task is

Let the CLI create a working location autocomplete or country/state/city picker for an application.

## Problem it solves

Even with an autocomplete API, developers still need to build loading states, keyboard controls, request delay, request canceling, and safe API-key use. These parts take time and are easy to build incorrectly. Generated code helps a developer see the API's value immediately.

## Where changes should go

| GitHub repository | Area to change |
|---|---|
| [`dr5hn/countrystatecity-npm`](https://github.com/dr5hn/countrystatecity-npm) | `packages/cli` templates, SDK examples, and generated test projects |
| [`dr5hn/csc-docs`](https://github.com/dr5hn/csc-docs) | Generator instructions and screenshots/examples |

## What to build first

```bash
csc generate autocomplete --target nextjs
csc generate location-picker --target nextjs
csc generate autocomplete --target react-browser
csc generate location-picker --target react-browser
```

### Next.js version

- Recommended version.
- Keeps the API key on the server.
- Generates the UI, a server API route, an environment-file example, and a short README.

### React browser version

- The API key is visible in browser code.
- Before creating files, show a warning that the key must allow only approved website domains.
- Repeat the warning in the generated README.

## UI behavior

- Wait about 250 ms after typing before searching.
- Do not search with fewer than 2 characters.
- Cancel an old search when a new search starts.
- Show loading, no results, plan error, request-limit error, and network error.
- Support arrow keys, Enter, Escape, and Tab.
- Work with screen readers.
- Show full place labels but return stable IDs and codes.
- In the three-level picker, clear state and city when country changes. Clear city when state changes.

## Important rules

- Never copy the real API key saved in the CLI into generated files.
- Generated files use placeholders only.
- The default Next.js version keeps the key on the server.
- Keep styling small and easy for the developer to replace.

## Work steps

1. Decide the input and output values for each component.
2. Build the Next.js autocomplete first.
3. Build the Next.js country/state/city picker.
4. Build the browser versions with a clear safety warning.
5. Add example projects to automated tests.
6. Update CLI help and docs.

## Simple tests

- Build every generated example project.
- Use only a keyboard to search, choose, and clear a place.
- Check the screen-reader labels.
- Confirm an old slow request cannot replace a newer result.
- Change country/state and confirm child values are cleared.
- Scan generated files and confirm no real API key is present.

## Done when

- The generated Next.js project builds using the written steps.
- The components work with keyboard and screen reader.
- No real API key is copied.
- Search errors are easy to understand.
- The picker always returns a valid country/state/city combination.

## Not included

- A full hosted UI library.
- Vue, Svelte, Angular, or mobile versions in the first release.
- Many design themes.

