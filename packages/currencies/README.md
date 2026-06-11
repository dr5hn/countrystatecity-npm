# @countrystatecity/currencies

[![npm](https://img.shields.io/npm/v/@countrystatecity/currencies)](https://www.npmjs.com/package/@countrystatecity/currencies)
[![CI](https://github.com/dr5hn/countrystatecity-npm/workflows/Pipeline/badge.svg)](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/@countrystatecity/currencies)](https://www.npmjs.com/package/@countrystatecity/currencies)

Comprehensive world currency data with ISO 4217 codes, symbols, and country mappings.

## ✨ Features

- 💰 **155 ISO 4217 Currencies**: Complete world currency database
- 🌍 **195 Countries**: Full country-to-currency and currency-to-countries mapping
- 🔍 **Flexible Lookup**: Find by code, name, symbol, or country
- 🖋️ **Native Symbols**: Both display (`$`) and native (`₹`) symbols included
- 🔢 **Decimal Rules**: Correct `decimalDigits` and `rounding` per currency
- 🎨 **Amount Formatting**: Format numbers as currency strings out of the box
- 🚀 **Minimal Bundle**: <3KB initial load with lazy-loaded data file
- 📦 **ESM + CJS**: Works in Node.js, browsers, and edge runtimes
- 📝 **TypeScript**: Full type definitions included
- 🔧 **Tree-Shakeable**: Only bundle what you use

## 📦 Installation

```bash
npm install @countrystatecity/currencies
# or
yarn add @countrystatecity/currencies
# or
pnpm add @countrystatecity/currencies
```

## 🚀 Quick Start

```typescript
import {
  getCurrencies,
  getCurrencyByCode,
  getCurrenciesByCountry,
  searchCurrencies,
  formatCurrencyAmount,
} from '@countrystatecity/currencies';

// Get all currencies
const currencies = await getCurrencies();
console.log(currencies.length); // 155

// Look up by ISO 4217 code
const usd = await getCurrencyByCode('USD');
console.log(usd);
// {
//   code: 'USD',
//   name: 'US Dollar',
//   namePlural: 'US dollars',
//   symbol: '$',
//   symbolNative: '$',
//   decimalDigits: 2,
//   rounding: 0,
//   countries: ['AS', 'EC', 'FM', 'GU', 'IO', 'MH', 'MP', 'PR', 'PW', 'SV', 'TC', 'TL', 'UM', 'US', 'VG', 'VI']
// }

// Get all currencies used in a country
const inCurrencies = await getCurrenciesByCountry('IN');
console.log(inCurrencies);
// [{ code: 'INR', name: 'Indian Rupee', symbol: '₹', ... }]

// Format an amount
const formatted = await formatCurrencyAmount(1234.5, 'USD');
console.log(formatted); // "$1,234.50"
```

## 📖 API Reference

### Core Functions

#### `getCurrencies()`

Get all available currencies.

```typescript
const currencies = await getCurrencies();
// Returns: ICurrency[]
```

#### `getCurrencyByCode(code: string)`

Get a currency by its ISO 4217 code.

```typescript
const currency = await getCurrencyByCode('EUR');
// Returns: ICurrency | undefined
```

**Parameters:**
- `code` — ISO 4217 currency code (e.g., `'USD'`, `'EUR'`). Case-insensitive.

#### `getCurrenciesByCountry(countryCode: string)`

Get all currencies used in a given country.

```typescript
const currencies = await getCurrenciesByCountry('US');
// Returns: ICurrency[]
```

**Parameters:**
- `countryCode` — ISO 3166-1 alpha-2 country code (e.g., `'US'`, `'IN'`). Case-insensitive.

#### `isValidCurrencyCode(code: string)`

Check whether a string is a valid ISO 4217 currency code.

```typescript
const valid = await isValidCurrencyCode('USD'); // true
const invalid = await isValidCurrencyCode('XYZ'); // false
// Returns: boolean
```

#### `searchCurrencies(query: string)`

Search currencies by name or code (case-insensitive, partial match).

```typescript
const results = await searchCurrencies('dollar');
// Returns: ICurrency[]  — USD, CAD, AUD, HKD, ...
```

### Utility Functions

#### `getCurrencySymbol(code: string)`

Get the display symbol for a currency code.

```typescript
const symbol = await getCurrencySymbol('USD');
// Returns: "$"
```

#### `getCurrencySymbolNative(code: string)`

Get the native/local symbol for a currency code.

```typescript
const symbol = await getCurrencySymbolNative('INR');
// Returns: "₹"
```

#### `getCurrencyBySymbol(symbol: string)`

Find a currency by its symbol (checks both `symbol` and `symbolNative`).

```typescript
const currency = await getCurrencyBySymbol('€');
// Returns: ICurrency | undefined  — EUR
```

#### `formatCurrencyAmount(amount: number, code: string)`

Format a number as a currency string using the currency's symbol and decimal rules.

```typescript
const formatted = await formatCurrencyAmount(1234567.5, 'USD');
// Returns: "$1,234,567.50"

const jpy = await formatCurrencyAmount(1234567, 'JPY');
// Returns: "¥1,234,567"  (JPY has 0 decimal digits)
```

**Parameters:**
- `amount` — The numeric amount to format
- `code` — ISO 4217 currency code

## 🌍 Real-World Examples

### Price Formatter

```typescript
import { formatCurrencyAmount, getCurrencyByCode } from '@countrystatecity/currencies';

async function displayPrice(amount: number, currencyCode: string) {
  const currency = await getCurrencyByCode(currencyCode);
  if (!currency) return String(amount);

  const formatted = await formatCurrencyAmount(amount, currencyCode);
  return `${formatted} (${currency.name})`;
}

console.log(await displayPrice(99.99, 'USD')); // "$99.99 (US Dollar)"
console.log(await displayPrice(8500, 'JPY'));   // "¥8,500 (Japanese Yen)"
console.log(await displayPrice(4999, 'INR'));   // "₹4,999 (Indian Rupee)"
```

### Country Currency Lookup

```typescript
import { getCurrenciesByCountry } from '@countrystatecity/currencies';

async function getCountryCurrencyInfo(countryCode: string) {
  const currencies = await getCurrenciesByCountry(countryCode);

  return currencies.map((c) => ({
    code: c.code,
    name: c.name,
    symbol: c.symbol,
    nativeSymbol: c.symbolNative,
  }));
}

const usCurrencies = await getCountryCurrencyInfo('US');
// [{ code: 'USD', name: 'US Dollar', symbol: '$', nativeSymbol: '$' }]

const paCurrencies = await getCountryCurrencyInfo('PA'); // Panama uses USD + PAB
// [{ code: 'PAB', ... }, { code: 'USD', ... }]
```

### Currency Search & Validator

```typescript
import { searchCurrencies, isValidCurrencyCode } from '@countrystatecity/currencies';

// Autocomplete: suggest currencies matching a query
async function autocompleteCurrency(input: string) {
  if (input.length < 2) return [];
  return searchCurrencies(input);
}

// Validate user input before processing payment
async function validatePayload(code: string, amount: number) {
  const isValid = await isValidCurrencyCode(code);
  if (!isValid) throw new Error(`Unknown currency code: ${code}`);
  if (amount <= 0) throw new Error('Amount must be positive');
  return true;
}

await validatePayload('USD', 100); // true
await validatePayload('XYZ', 100); // throws Error
```

### Multi-Currency Cart

```typescript
import { getCurrencyByCode, formatCurrencyAmount } from '@countrystatecity/currencies';

interface CartItem {
  name: string;
  price: number;
  currency: string;
}

async function renderCart(items: CartItem[]) {
  const rendered = [];

  for (const item of items) {
    const currency = await getCurrencyByCode(item.currency);
    const formatted = await formatCurrencyAmount(item.price, item.currency);
    rendered.push({
      name: item.name,
      price: formatted,
      decimals: currency?.decimalDigits ?? 2,
    });
  }

  return rendered;
}

const cart = await renderCart([
  { name: 'Book', price: 12.99, currency: 'USD' },
  { name: 'Manga', price: 880, currency: 'JPY' },
  { name: 'Tea', price: 250.5, currency: 'INR' },
]);
```

## 🔧 TypeScript Types

```typescript
interface ICurrency {
  code: string;          // "USD" — ISO 4217 code
  name: string;          // "US Dollar"
  namePlural: string;    // "US dollars"
  symbol: string;        // "$"
  symbolNative: string;  // "$" (or "₹" for INR, "د.إ.‏" for AED, etc.)
  decimalDigits: number; // 2 (0 for JPY, 3 for KWD, etc.)
  rounding: number;      // 0 (or 0.05 for CHF, etc.)
  countries: string[];   // ["US", "EC", "SV", ...] — ISO 3166-1 alpha-2
}
```

## 📊 Bundle Size

| Action | Bundle Size |
|--------|-------------|
| Install package + import function | ~3KB |
| Load all currencies | ~40KB |
| **Typical usage** | **~3KB** |

### Data Coverage

- **155 ISO 4217 Currencies**: All major and minor world currencies
- **195 Countries**: Complete country-to-currency mappings
- **Multi-currency countries**: Countries that use more than one currency (e.g., Panama, Zimbabwe) are fully supported

**Note**: Currency data is automatically sourced from the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database) and updates weekly.

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
- ✅ ESM + CJS compatibility tests

## 🔄 CI/CD & Automation

### Continuous Integration
Every push and PR automatically:
- ✅ Runs type checking with TypeScript
- ✅ Executes comprehensive test suite across Node.js 18, 20, and 22
- ✅ Builds the package

### Automated Data Updates
Weekly automated updates (Sundays at 00:00 UTC):
- 📥 Downloads latest currency data from authoritative sources
- 🔄 Regenerates `currencies.json` with updated mappings
- 🧪 Runs full test suite
- 📝 Creates PR for review if changes detected

This ensures your application always has access to the most current currency information without manual intervention.

### Automated Publishing
Automated publishing to npm on GitHub Release:
- 📦 Builds and tests before publishing
- 🚀 Publishes to npm registry with provenance
- 🏷️ Linked to the exact source commit

## 📄 License

[ODbL-1.0](https://github.com/dr5hn/countrystatecity/blob/main/LICENSE) © [dr5hn](https://github.com/dr5hn)

This package and its data are licensed under the Open Database License (ODbL) v1.0. The data is sourced from the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database) which is also licensed under ODbL-1.0.

You are free to share, create, and adapt this database as long as you attribute the original sources, distribute adaptations under the same license, and don't use technical restrictions to lock down the data.

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR.

**For data-related issues** (incorrect currency data, missing currencies, wrong symbols, etc.), please report them to the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database/issues) repository, which is the authoritative source of data for this package.

## 📦 Package Ecosystem

This package is part of the [@countrystatecity package ecosystem](https://github.com/dr5hn/countrystatecity-npm):

- **[@countrystatecity/countries](https://www.npmjs.com/package/@countrystatecity/countries)** — Server-side countries, states, and cities database. Environment: Node.js, Next.js API routes, Express. Bundle: <10KB initial load.

- **[@countrystatecity/countries-browser](https://www.npmjs.com/package/@countrystatecity/countries-browser)** — Browser-native version with jsDelivr CDN and lazy loading. Environment: React, Vue, Svelte, Vite, any browser. Same API as the server package — zero config, just import and use.

- **[@countrystatecity/timezones](https://www.npmjs.com/package/@countrystatecity/timezones)** — Comprehensive timezone data with conversion utilities. Environment: Server-side only. Bundle: <20KB initial load.

- **[@countrystatecity/currencies](https://www.npmjs.com/package/@countrystatecity/currencies)** (This package) — ISO 4217 currency data with symbols, decimal rules, and country mappings. Environment: Node.js, browsers, edge runtimes. Bundle: <3KB initial load.

## 🔗 Links

- [GitHub Repository](https://github.com/dr5hn/countrystatecity-npm/tree/main/packages/currencies)
- [Issues](https://github.com/dr5hn/countrystatecity-npm/issues)
- [NPM Package](https://www.npmjs.com/package/@countrystatecity/currencies)
- [NPM Organization](https://www.npmjs.com/org/countrystatecity)
