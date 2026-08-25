# Task 01: Download and Check Source Data

**Status:** Ready to start  
**Main owner:** Data developer

## What this task is

Improve the scripts that download and prepare CountryStateCity data. The scripts must use one fixed source release, keep useful city fields, and stop when the source data is broken.

## Problem it solves

The current script downloads the latest file, which can change without warning. It also uses a smaller city file that does not include fields such as place type, population, local name, and WikiData ID. This makes the data harder to trust and removes useful information that the API can sell as managed data.

## Where changes should go

| GitHub repository | Area to change |
|---|---|
| [`dr5hn/countrystatecity-npm`](https://github.com/dr5hn/countrystatecity-npm) | `scripts/` and package data-generation scripts |
| [`dr5hn/csc-app`](https://github.com/dr5hn/csc-app) | `api/` only if the API has a separate data-import job |
| [`dr5hn/countries-states-cities-database`](https://github.com/dr5hn/countries-states-cities-database) | Source only; no change is required for this task |

## What to build

- Find the exact latest release number before downloading files.
- Download all files from that same release.
- Keep the current country/state/city file.
- Also download the full city file and translation file.
- Match the two city files by city ID.
- Add these city fields: `type`, `native`, `population`, and `wikiDataId`.
- Create a small report with the source release, file checksums, date, and record counts.
- Check names, IDs, country/state links, and latitude/longitude values.
- Prepare new files in a temporary location first. Replace live files only after all checks pass.

## Important rules

- Do not put all city translations inside the main npm city files. They are too large.
- Keep empty source values as empty. Do not invent missing data.
- Stop the update if country, state, or city counts change by more than 10%. A person must review and approve a large change.
- If the update fails, the old working data must stay in place.

## Work steps

1. Add a script that finds the exact source release.
2. Download the required files and check that each download finished correctly.
3. Join the full city details to the current city records.
4. Run data checks.
5. Create `data-manifest.json` and a short update report.
6. Update CI to show the release number and count changes.

## Simple tests

- Try a broken download and confirm the update stops.
- Add a duplicate city ID and confirm the update stops.
- Add an invalid latitude or longitude and confirm the update stops.
- Run the same fixed release twice and confirm the generated data is the same.
- Confirm a known city now has the extra fields.

## Done when

- One command downloads, checks, and generates all data.
- The report shows the exact source release and record counts.
- City files contain real values for the new fields when the source has them.
- A failed update never replaces the old data.
- CI clearly shows what changed.

## Not included

- Deciding which records are real cities. That is Task 02.
- Keeping a history of every change. That is Task 13.

