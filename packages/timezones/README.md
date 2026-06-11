# @countrystatecity/timezones

[![npm](https://img.shields.io/npm/v/@countrystatecity/timezones)](https://www.npmjs.com/package/@countrystatecity/timezones)
[![CI](https://github.com/dr5hn/countrystatecity-timezones/workflows/CI/badge.svg)](https://github.com/dr5hn/countrystatecity-timezones/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/@countrystatecity/timezones)](https://www.npmjs.com/package/@countrystatecity/timezones)

Comprehensive timezone data with conversion utilities and iOS/Safari support.

**Environment:** 🖥️ **Server-side only** (Node.js, Next.js API routes, Express, etc.)

## ✨ Features

- 🌐 **392 IANA Timezones**: Complete timezone database
- 🗺️ **223 Countries**: Timezones organized by country
- 🔄 **Time Conversion**: Convert between timezones easily
- ⏰ **Current Time**: Get current time in any timezone
- 📅 **DST Support**: Detect daylight saving time
- 📱 **iOS Compatible**: No stack overflow errors on Safari/iOS
- 🚀 **Minimal Bundle**: <20KB initial load with lazy loading
- 📝 **TypeScript**: Full type definitions included
- 🔧 **Tree-Shakeable**: Only bundle what you use

## 📦 Installation

```bash
npm install @countrystatecity/timezones
# or
yarn add @countrystatecity/timezones
# or
pnpm add @countrystatecity/timezones
```

## 🚀 Quick Start

```typescript
import {
  getTimezones,
  getTimezonesByCountry,
  convertTime,
  getCurrentTime
} from '@countrystatecity/timezones';

// Get all timezones (~74KB - lazy loaded)
const timezones = await getTimezones();
console.log(timezones.length); // 392

// Get timezones for a specific country (~0.3KB per country)
const usTimezones = await getTimezonesByCountry('US');
console.log(usTimezones);
// [
//   { zoneName: 'America/New_York', abbreviation: 'EST', ... },
//   { zoneName: 'America/Chicago', abbreviation: 'CST', ... },
//   ...
// ]

// Get current time in a timezone
const currentTime = await getCurrentTime('America/New_York');
console.log(currentTime); // "2025-10-18T08:30:00.000Z"

// Convert time between timezones
const converted = await convertTime(
  '2025-10-18 14:00',
  'America/New_York',
  'Asia/Tokyo'
);
console.log(converted);
// {
//   originalTime: "2025-10-18T14:00:00.000Z",
//   fromTimezone: "America/New_York",
//   convertedTime: "2025-10-19T04:00:00.000Z",
//   toTimezone: "Asia/Tokyo",
//   timeDifference: 14
// }
```

## 📖 API Reference

### Core Functions

#### `getTimezones()`

Get all available timezones.

```typescript
const timezones = await getTimezones();
// Returns: ITimezone[]
```

**Bundle Impact**: ~74KB

#### `getTimezonesByCountry(countryCode: string)`

Get timezones for a specific country.

```typescript
const timezones = await getTimezonesByCountry('US');
// Returns: ITimezone[]
```

**Parameters:**
- `countryCode` - ISO 3166-1 alpha-2 country code (e.g., 'US', 'IN')

**Bundle Impact**: ~0.3KB per country

#### `getTimezoneInfo(timezoneName: string)`

Get detailed information about a timezone including current time.

```typescript
const info = await getTimezoneInfo('America/New_York');
// Returns: ITimezoneInfo | null
```

**Returns:**
```typescript
{
  timezone: "America/New_York",
  currentTime: "2025-10-18T08:30:00.000Z",
  utcOffset: "UTC-05:00",
  isDST: false,
  gmtOffset: -18000
}
```

#### `getTimezoneAbbreviations()`

Get all timezone abbreviations (PST, EST, etc.).

```typescript
const abbreviations = await getTimezoneAbbreviations();
// Returns: ITimezoneAbbreviation[]
```

**Bundle Impact**: ~5KB

#### `getTimezonesByAbbreviation(abbreviation: string)`

Find timezones by abbreviation.

```typescript
const timezones = await getTimezonesByAbbreviation('EST');
// Returns: ITimezone[]
```

### Utility Functions

#### `convertTime(time, fromTimezone, toTimezone)`

Convert time from one timezone to another.

```typescript
const result = await convertTime(
  '2025-10-18 14:00',
  'America/New_York',
  'Europe/London'
);
// Returns: IConvertedTime
```

**Parameters:**
- `time` - Time to convert (ISO string or Date object)
- `fromTimezone` - Source timezone (IANA name)
- `toTimezone` - Target timezone (IANA name)

#### `getCurrentTime(timezoneName: string)`

Get current time in a specific timezone.

```typescript
const time = await getCurrentTime('Asia/Tokyo');
// Returns: string (ISO format)
```

#### `isDaylightSaving(timezoneName: string, date?: Date)`

Check if daylight saving time is active.

```typescript
const isDST = await isDaylightSaving('America/New_York');
// Returns: boolean
```

**Parameters:**
- `timezoneName` - IANA timezone name
- `date` - Optional date to check (defaults to now)

#### `getGMTOffset(timezoneName: string)`

Get GMT/UTC offset in seconds.

```typescript
const offset = await getGMTOffset('America/New_York');
// Returns: number (e.g., -18000 for UTC-05:00)
```

#### `formatGMTOffset(offsetSeconds: number)`

Format GMT offset from seconds to string.

```typescript
const formatted = formatGMTOffset(-18000);
// Returns: "UTC-05:00"
```

#### `isValidTimezone(timezoneName: string)`

Validate if a timezone name is valid.

```typescript
const isValid = await isValidTimezone('America/New_York');
// Returns: boolean
```

#### `searchTimezones(searchTerm: string)`

Search timezones by name (partial match).

```typescript
const results = await searchTimezones('america');
// Returns: ITimezone[]
```

#### `getUniqueAbbreviations()`

Get all unique timezone abbreviations.

```typescript
const abbreviations = await getUniqueAbbreviations();
// Returns: string[] (e.g., ['EST', 'PST', 'CST', ...])
```

#### `getTimezonesByOffset(offsetSeconds: number)`

Get timezones by GMT offset.

```typescript
const timezones = await getTimezonesByOffset(-18000); // UTC-05:00
// Returns: ITimezone[]
```

## 🌍 Real-World Examples

### Meeting Scheduler

```typescript
import { convertTime, getTimezonesByCountry } from '@countrystatecity/timezones';

async function scheduleMeeting(localTime: string, attendeeCountries: string[]) {
  const meetingTimes = [];

  for (const countryCode of attendeeCountries) {
    const timezones = await getTimezonesByCountry(countryCode);
    const primaryTz = timezones[0];

    const converted = await convertTime(
      localTime,
      'America/New_York',
      primaryTz.zoneName
    );

    meetingTimes.push({
      country: countryCode,
      timezone: primaryTz.zoneName,
      time: converted.convertedTime
    });
  }

  return meetingTimes;
}

// Schedule 2 PM EST meeting for US, UK, and Japan
const times = await scheduleMeeting('2025-10-18 14:00', ['US', 'GB', 'JP']);
```

### World Clock

```typescript
import { getTimezonesByCountry, getCurrentTime } from '@countrystatecity/timezones';

async function createWorldClock(countryCodes: string[]) {
  const clocks = [];

  for (const code of countryCodes) {
    const timezones = await getTimezonesByCountry(code);
    for (const tz of timezones) {
      const currentTime = await getCurrentTime(tz.zoneName);
      clocks.push({
        location: tz.tzName,
        timezone: tz.zoneName,
        currentTime,
        offset: tz.gmtOffsetName
      });
    }
  }

  return clocks;
}

const worldClock = await createWorldClock(['US', 'GB', 'IN', 'AU', 'JP']);
```

### DST Reminder

```typescript
import { isDaylightSaving, getTimezonesByCountry } from '@countrystatecity/timezones';

async function checkDSTStatus(countryCode: string) {
  const timezones = await getTimezonesByCountry(countryCode);

  const dstStatus = [];
  for (const tz of timezones) {
    const isDST = await isDaylightSaving(tz.zoneName);
    dstStatus.push({
      timezone: tz.tzName,
      isDST,
      message: isDST
        ? 'Daylight Saving Time is active'
        : 'Standard Time'
    });
  }

  return dstStatus;
}
```

## 🔧 TypeScript Types

```typescript
interface ITimezone {
  zoneName: string;        // "America/New_York"
  countryCode: string;     // "US"
  abbreviation: string;    // "EST"
  gmtOffset: number;       // -18000 (seconds)
  gmtOffsetName: string;   // "UTC-05:00"
  tzName: string;          // "Eastern Standard Time"
}

interface ITimezoneInfo {
  timezone: string;
  currentTime: string;     // ISO string
  utcOffset: string;       // "UTC-05:00"
  isDST: boolean;
  gmtOffset: number;
}

interface ITimezoneAbbreviation {
  abbreviation: string;    // "EST"
  name: string;            // "Eastern Standard Time"
  timezones: string[];     // ["America/New_York", ...]
}

interface IConvertedTime {
  originalTime: string;
  fromTimezone: string;
  convertedTime: string;
  toTimezone: string;
  timeDifference: number;  // hours
}
```

## 📊 Bundle Size

| Action | Bundle Size |
|--------|-------------|
| Install package + import function | ~5KB |
| Load all timezones | ~74KB |
| Load timezones for one country | ~0.3KB |
| Load abbreviations | ~5KB |
| **Typical usage** | **~10KB** |

### Data Coverage

- **390 IANA Timezones**: Covers 90.7% of canonical IANA timezones
- **223 Countries**: All countries with complete metadata
- **99%+ Population Coverage**: Includes all major populated regions

What is included: all major countries and territories, all business and residential timezones, complete DST information, and historical timezone data.

What is not included: Antarctica research station timezones (11), some small dependent territories (16), and some disputed/unrecognized territories (12).

See [TIMEZONE_COVERAGE.md](./TIMEZONE_COVERAGE.md) for detailed analysis.

**Note**: Timezone data is automatically sourced from the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database) and updates weekly.

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

All packages include comprehensive tests:
- ✅ Unit tests
- ✅ Integration tests
- ✅ iOS/Safari compatibility tests

## 🔄 CI/CD & Automation

### Continuous Integration
Every push and PR automatically:
- ✅ Runs type checking with TypeScript
- ✅ Executes comprehensive test suite
- ✅ Builds the package
- ✅ Validates bundle sizes
- ✅ Tests iOS/Safari compatibility

### Automated Data Updates
Weekly automated updates (Sundays at 00:00 UTC):
- 📥 Downloads latest timezone data from authoritative sources
- 🔄 Transforms into optimized structure
- 🧪 Runs full test suite
- 📝 Creates PR for review if changes detected

This ensures your application always has access to the most current timezone information without manual intervention.

### Automated Publishing
Automated publishing to NPM on version changes:
- 🔍 Detects version bumps in package.json
- 📦 Builds and tests before publishing
- 🚀 Publishes to NPM registry
- 🏷️ Creates GitHub release with changelog

## 📄 License

[ODbL-1.0](https://github.com/dr5hn/countrystatecity/blob/main/LICENSE) © [dr5hn](https://github.com/dr5hn)

This package and its data are licensed under the Open Database License (ODbL) v1.0. The data is sourced from the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database) which is also licensed under ODbL-1.0.

You are free to share, create, and adapt this database as long as you attribute the original sources, distribute adaptations under the same license, and don't use technical restrictions to lock down the data.

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR.

**For data-related issues** (incorrect timezone data, missing timezones, wrong offsets, etc.), please report them to the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database/issues) repository, which is the authoritative source of data for this package.

## 📦 Package Ecosystem

This package is part of the [@countrystatecity package ecosystem](https://github.com/dr5hn/countrystatecity-countries):

- **[@countrystatecity/countries](https://www.npmjs.com/package/@countrystatecity/countries)** — Server-side countries, states, and cities database. Environment: Node.js, Next.js API routes, Express. Bundle: <10KB initial load.

- **[@countrystatecity/countries-browser](https://www.npmjs.com/package/@countrystatecity/countries-browser)** — Browser-native version with jsDelivr CDN and lazy loading. Environment: React, Vue, Svelte, Vite, any browser. Same API as the server package — zero config, just import and use.

- **[@countrystatecity/timezones](https://www.npmjs.com/package/@countrystatecity/timezones)** (This package) — Comprehensive timezone data with conversion utilities. Environment: Server-side only. Bundle: <20KB initial load.

## 🔗 Links

- [GitHub Repository](https://github.com/dr5hn/countrystatecity-timezones)
- [Issues](https://github.com/dr5hn/countrystatecity-timezones/issues)
- [NPM Package](https://www.npmjs.com/package/@countrystatecity/timezones)
- [NPM Organization](https://www.npmjs.com/org/countrystatecity)
