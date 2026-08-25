# Task 12: Add Translated State and City Names

**Status:** Start after Tasks 01, 05, and 09  
**Main owner:** Data and API search developer

## What this task is

Import state and city translations and let Professional customers display and search place names in another language.

## Problem it solves

The source release contains millions of place translations, but current npm packages mainly offer country translations. The smaller city source file also leaves out city translations. Global apps must download and manage a very large file to show local names. The API can do this work for them.

## Where changes should go

| GitHub repository | Area to change |
|---|---|
| [`dr5hn/countrystatecity-npm`](https://github.com/dr5hn/countrystatecity-npm) | Download/check translation source and add SDK types/options |
| [`dr5hn/csc-app`](https://github.com/dr5hn/csc-app) | `api/` translation storage, API output, and search |
| [`dr5hn/csc-docs`](https://github.com/dr5hn/csc-docs) | Language options, fallback rules, and examples |
| [`dr5hn/csc-swagger`](https://github.com/dr5hn/csc-swagger) | Translated search examples in the playground |

## What to build

- Import translations for region, subregion, country, state, and city.
- Match each translation using place type and place ID.
- Add a `locale` option to supported API routes.
- Add `include_translations=true` for users who need all available names.
- Add translated and local/native names to fuzzy search and autocomplete.
- Always return the normal English name and stable place ID too.

## Name fallback order

If the requested language is missing, use:

1. The exact language and region, such as `pt-BR`.
2. The base language, such as `pt`.
3. The local/native name.
4. The English name.

## Important rules

- Full translated output is for Professional and Business plans.
- Do not add millions of city translations to the main browser npm packages.
- Report translations that point to a missing place.
- Keep search cache separate by language and plan.
- Never replace the stable English name or ID with a translation.

## Work steps

1. Download and check the translation file in Task 01's pipeline.
2. Create translation storage in the API database.
3. Import translations together with the active data version.
4. Add language options and fallback rules.
5. Add translated names to fuzzy search and autocomplete.
6. Add SDK, playground, and docs support.
7. Report translation counts by language and place type.

## Simple tests

- Find an exact language translation.
- Fall back from a regional language to its base language.
- Fall back to native, then English.
- Search examples using Latin and non-Latin writing.
- Confirm every result still includes the same ID and English name.
- Confirm lower plans cannot receive full translation data through another route or cache.

## Done when

- State and city translations can be requested without downloading all translations.
- Search works with translated and native names.
- Fallback results are always predictable.
- Data reports show translation coverage.
- Browser npm package size does not grow greatly.

## Not included

- Creating translations with AI or machine translation.
- Creating new spellings that do not exist in the source.
- Shipping all city translations in offline npm packages.

