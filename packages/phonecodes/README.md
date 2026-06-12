# @countrystatecity/phonecodes

[![npm](https://img.shields.io/npm/v/@countrystatecity/phonecodes)](https://www.npmjs.com/package/@countrystatecity/phonecodes)
[![CI](https://github.com/dr5hn/countrystatecity-npm/workflows/Pipeline/badge.svg)](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/@countrystatecity/phonecodes?label=phonecodes)](https://www.npmjs.com/package/@countrystatecity/phonecodes)
[![npm downloads](https://img.shields.io/npm/dw/@countrystatecity/phonecodes?label=phonecodes%2Fweek)](https://www.npmjs.com/package/@countrystatecity/phonecodes)

Country phone/dial codes for all 250 countries — lookup by ISO2, reverse lookup by dial code, search, and formatting utilities.

## Install

```bash
npm install @countrystatecity/phonecodes
```

## Quick Start

```typescript
import {
  getPhonecodeByCountry,
  getCountriesByDialCode,
  formatWithDialCode,
} from '@countrystatecity/phonecodes';

const india = await getPhonecodeByCountry('IN');
// { iso2: 'IN', name: 'India', dialCode: '+91', phonecode: '91' }

const countries = await getCountriesByDialCode('+1');
// [{ iso2: 'US', ... }, { iso2: 'CA', ... }, ...]

const formatted = await formatWithDialCode('9876543210', 'IN');
// "+91 9876543210"
```

## API

### `getPhonecodes()`
Returns all 250 country phonecode entries sorted by ISO2.

```typescript
const all = await getPhonecodes();
// [{ iso2: 'AD', name: 'Andorra', dialCode: '+376', phonecode: '376' }, ...]
```

### `getPhonecodeByCountry(iso2)`
Returns the phonecode entry for a country by ISO2 code, or `undefined`.

```typescript
await getPhonecodeByCountry('GB');
// { iso2: 'GB', name: 'United Kingdom', dialCode: '+44', phonecode: '44' }
```

### `getCountriesByDialCode(dialCode)`
Returns all countries sharing a dial code (useful for +1, +7, +44, etc.).

```typescript
await getCountriesByDialCode('+1');
// [{ iso2: 'AG', ... }, { iso2: 'AI', ... }, { iso2: 'CA', ... }, { iso2: 'US', ... }, ...]
```

### `isValidDialCode(dialCode)`
Returns `true` if the dial code exists.

```typescript
await isValidDialCode('+91');  // true
await isValidDialCode('+9999'); // false
```

### `searchPhonecodes(query)`
Searches by country name, ISO2, or dial code (case-insensitive).

```typescript
await searchPhonecodes('india');
// [{ iso2: 'IN', name: 'India', dialCode: '+91', phonecode: '91' }]

await searchPhonecodes('+44');
// [{ iso2: 'GB', name: 'United Kingdom', dialCode: '+44', phonecode: '44' }]
```

### `getDialCode(iso2)`
Shorthand — returns just the dial code string.

```typescript
await getDialCode('IN'); // "+91"
```

### `getPhonecode(iso2)`
Returns the raw phonecode without the `+` prefix.

```typescript
await getPhonecode('IN'); // "91"
```

### `formatWithDialCode(localNumber, iso2)`
Prepends the country dial code to a local phone number.

```typescript
await formatWithDialCode('9876543210', 'IN'); // "+91 9876543210"
```

## Data Coverage

- 250 countries
- All entries include `iso2`, `name`, `dialCode` (with `+`), and `phonecode` (raw)
- Sourced from [dr5hn/countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database), updated weekly

## License

[ODbL-1.0](https://opendatacommons.org/licenses/odbl/1-0/) © [dr5hn](https://github.com/dr5hn)
