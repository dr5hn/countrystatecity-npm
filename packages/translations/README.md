# @countrystatecity/translations

[![npm](https://img.shields.io/npm/v/@countrystatecity/translations)](https://www.npmjs.com/package/@countrystatecity/translations)
[![CI](https://github.com/dr5hn/countrystatecity-npm/workflows/Pipeline/badge.svg)](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/@countrystatecity/translations)](https://www.npmjs.com/package/@countrystatecity/translations)
[![npm downloads](https://img.shields.io/npm/dw/@countrystatecity/translations?label=downloads/week)](https://www.npmjs.com/package/@countrystatecity/translations)

Country name translations in 19 languages — Arabic, Chinese, French, German, Spanish, Japanese, and more.

## ✨ Features

- 🌍 **250 Countries**: Full ISO 3166-1 coverage
- 🗣️ **19 Languages**: `ar`, `br`, `de`, `es`, `fa`, `fr`, `hi`, `hr`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `tr`, `uk`, `zh-CN`
- 🔍 **Flexible Lookup**: Find by country code, locale, or translated name
- 🔄 **Safe Fallback**: Falls back to secondary locale or English name automatically
- 🚀 **Minimal Bundle**: <3KB initial load with lazy-loaded data file
- 📦 **ESM + CJS**: Works in Node.js, browsers, and edge runtimes
- 📝 **TypeScript**: Full type definitions included
- 🔧 **Tree-Shakeable**: Only bundle what you use

## 📦 Installation

```bash
npm install @countrystatecity/translations
# or
yarn add @countrystatecity/translations
# or
pnpm add @countrystatecity/translations
```

## 🚀 Quick Start

```typescript
import {
  getTranslations,
  getCountryTranslations,
  getTranslation,
  getLocales,
  searchByTranslatedName,
  getTranslationOrFallback,
} from '@countrystatecity/translations';

// Get translated name for a country in a specific locale
const name = await getTranslation('DE', 'fr');
console.log(name); // "Allemagne"

// Get all translations for a country
const entry = await getCountryTranslations('JP');
console.log(entry);
// {
//   iso2: 'JP',
//   name: 'Japan',
//   translations: { ar: 'اليابان', fr: 'Japon', de: 'Japan', zh-CN: '日本', ... }
// }

// Get all countries with translations (e.g. for a French dropdown)
const all = await getTranslations();
const frenchDropdown = all.map(c => ({
  iso2: c.iso2,
  label: c.translations['fr'] ?? c.name,
}));

// List all available locales
const locales = await getLocales();
console.log(locales);
// ['ar', 'br', 'de', 'es', 'fa', 'fr', 'hi', 'hr', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'pt-BR', 'ru', 'tr', 'uk', 'zh-CN']
```

## 📖 API Reference

### Core Functions

#### `getTranslations()`

Get all 250 country translation records.

```typescript
const translations = await getTranslations();
// Returns: ICountryTranslation[]
```

#### `getCountryTranslations(iso2: string)`

Get the full translation record for a country by ISO 3166-1 alpha-2 code.

```typescript
const entry = await getCountryTranslations('US');
// Returns: ICountryTranslation | undefined
```

**Parameters:**
- `iso2` — ISO 3166-1 alpha-2 country code (e.g., `'US'`, `'DE'`). Case-insensitive.

#### `getTranslation(iso2: string, locale: string)`

Get the translated country name for a specific locale.

```typescript
const name = await getTranslation('FR', 'de'); // "Frankreich"
const name = await getTranslation('IN', 'hi'); // "भारत"
const name = await getTranslation('JP', 'zh-CN'); // "日本"
// Returns: string | undefined
```

**Parameters:**
- `iso2` — ISO 3166-1 alpha-2 country code. Case-insensitive.
- `locale` — Locale code (e.g., `'fr'`, `'de'`, `'zh-CN'`).

#### `getLocales()`

Get all available locale codes.

```typescript
const locales = await getLocales();
// Returns: string[]  — sorted array of 19 locale codes
```

#### `searchByTranslatedName(query: string, locale?: string)`

Search for countries by translated name (case-insensitive, partial match).

```typescript
const results = await searchByTranslatedName('Allemagne', 'fr');
// Returns: ICountryTranslation[]  — [{ iso2: 'DE', ... }]

// Search across all locales when no locale given
const results = await searchByTranslatedName('united');
// Returns: ICountryTranslation[]  — [US, GB, AE, ...]
```

### Utility Functions

#### `getTranslationOrFallback(entry, locale, fallbackLocale?)`

Sync helper — returns the translation for the given locale, falling back to `fallbackLocale` if provided, then to the English `name`.

```typescript
const entry = await getCountryTranslations('US');

getTranslationOrFallback(entry, 'fr');           // "États-Unis"
getTranslationOrFallback(entry, 'xx', 'fr');     // "États-Unis" (fell back to fr)
getTranslationOrFallback(entry, 'xx');           // "United States" (fell back to English)
// Returns: string  — never undefined
```

## 🌍 Real-World Examples

### Localized Country Dropdown

```typescript
import { getTranslations } from '@countrystatecity/translations';

async function getCountryOptions(locale: string) {
  const all = await getTranslations();
  return all.map(c => ({
    value: c.iso2,
    label: c.translations[locale] ?? c.name,
  }));
}

const options = await getCountryOptions('fr');
// [{ value: 'AF', label: 'Afghanistan' }, { value: 'AL', label: 'Albanie' }, ...]
```

### Country Name in User's Language

```typescript
import { getTranslation, getTranslationOrFallback, getCountryTranslations } from '@countrystatecity/translations';

async function getLocalizedCountryName(iso2: string, userLocale: string) {
  const entry = await getCountryTranslations(iso2);
  if (!entry) return null;
  return getTranslationOrFallback(entry, userLocale, 'en');
}

console.log(await getLocalizedCountryName('DE', 'fr')); // "Allemagne"
console.log(await getLocalizedCountryName('DE', 'ja')); // "ドイツ"
console.log(await getLocalizedCountryName('DE', 'xx')); // "Germany" (fallback)
```

### Search Countries by Translated Name

```typescript
import { searchByTranslatedName } from '@countrystatecity/translations';

// Find all countries whose German name contains "land"
const results = await searchByTranslatedName('land', 'de');
// → [Ireland (Irland), Iceland (Island), Finland (Finnland), ...]

// Find across all locales
const results = await searchByTranslatedName('Stati Uniti');
// → [{ iso2: 'US', name: 'United States', translations: { it: 'Stati Uniti', ... } }]
```

### i18n Integration

```typescript
import { getTranslation } from '@countrystatecity/translations';

// Works with any i18n framework — just pass the active locale
async function formatAddress(countryCode: string, locale: string) {
  const countryName = await getTranslation(countryCode, locale);
  return countryName ?? countryCode;
}
```

## 🔧 TypeScript Types

```typescript
interface ICountryTranslation {
  iso2: string;                         // "DE" — ISO 3166-1 alpha-2
  name: string;                         // "Germany" — English name
  translations: Record<string, string>; // { "fr": "Allemagne", "de": "Deutschland", ... }
}
```

## 🗣️ Available Locales

| Code | Language | Code | Language |
|------|----------|------|----------|
| `ar` | Arabic | `ko` | Korean |
| `br` | Breton | `nl` | Dutch |
| `de` | German | `pl` | Polish |
| `es` | Spanish | `pt` | Portuguese |
| `fa` | Persian | `pt-BR` | Portuguese (Brazil) |
| `fr` | French | `ru` | Russian |
| `hi` | Hindi | `tr` | Turkish |
| `hr` | Croatian | `uk` | Ukrainian |
| `it` | Italian | `zh-CN` | Chinese (Simplified) |
| `ja` | Japanese | | |

## 📊 Bundle Size

| Action | Bundle Size |
|--------|-------------|
| Install package + import function | ~3KB |
| Load all translations | ~158KB |
| **Typical usage** | **~3KB** |

### Data Coverage

- **250 countries**: Full ISO 3166-1 coverage
- **19 locales**: Major world languages
- **Auto-updated**: Synced weekly from [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database)

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

All packages include comprehensive tests:
- ✅ Unit tests for every function
- ✅ Integration tests
- ✅ iOS/Safari compatibility tests

## 🔄 CI/CD & Automation

### Continuous Integration
Every push and PR automatically:
- ✅ Runs type checking with TypeScript
- ✅ Executes comprehensive test suite across Node.js 20 and 22
- ✅ Builds the package

### Automated Data Updates
Weekly automated updates (Sundays at 00:00 UTC):
- 📥 Downloads latest data from [countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database)
- 🔄 Regenerates `translations.json` with updated country names
- 🧪 Runs full test suite
- 📝 Creates PR for review if changes detected

### Automated Publishing
Automated publishing to npm on version bump:
- 📦 Builds and tests before publishing
- 🚀 Publishes to npm registry
- 🏷️ Creates GitHub Release linked to the exact source commit

## 📄 License

[ODbL-1.0](https://github.com/dr5hn/countrystatecity/blob/main/LICENSE) © [dr5hn](https://github.com/dr5hn)

This package and its data are licensed under the Open Database License (ODbL) v1.0. The data is sourced from the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database) which is also licensed under ODbL-1.0.

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR.

**For data-related issues** (incorrect translations, missing locales, etc.), please report them to the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database/issues) repository, which is the authoritative source of data for this package.

## 📦 Package Ecosystem

This package is part of the [@countrystatecity package ecosystem](https://github.com/dr5hn/countrystatecity-npm):

- **[@countrystatecity/countries](https://www.npmjs.com/package/@countrystatecity/countries)** — Server-side countries, states, and cities database. Bundle: <10KB initial load.

- **[@countrystatecity/timezones](https://www.npmjs.com/package/@countrystatecity/timezones)** — Comprehensive timezone data with conversion utilities. Bundle: <20KB initial load.

- **[@countrystatecity/currencies](https://www.npmjs.com/package/@countrystatecity/currencies)** — ISO 4217 currency data with symbols and country mappings. Bundle: <3KB initial load.

- **[@countrystatecity/translations](https://www.npmjs.com/package/@countrystatecity/translations)** (This package) — Country name translations in 19 languages. Bundle: <3KB initial load.

## 🔗 Links

- [GitHub Repository](https://github.com/dr5hn/countrystatecity-npm/tree/main/packages/translations)
- [Issues](https://github.com/dr5hn/countrystatecity-npm/issues)
- [NPM Package](https://www.npmjs.com/package/@countrystatecity/translations)
- [NPM Organization](https://www.npmjs.com/org/countrystatecity)
