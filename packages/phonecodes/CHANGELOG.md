# @countrystatecity/phonecodes

## 1.0.0 - 2026-06-12

### Initial Release

- 250 country phone/dial codes sourced from countries-states-cities-database
- `getPhonecodes()` — all entries
- `getPhonecodeByCountry(iso2)` — lookup by country ISO2
- `getCountriesByDialCode(dialCode)` — reverse lookup (e.g. "+1" → US, CA, …)
- `isValidDialCode(dialCode)` — validate a dial code
- `searchPhonecodes(query)` — search by name, ISO2, or dial code
- `getDialCode(iso2)` — shorthand for dial code string
- `getPhonecode(iso2)` — raw phonecode without + prefix
- `formatWithDialCode(number, iso2)` — format a local number with dial code
