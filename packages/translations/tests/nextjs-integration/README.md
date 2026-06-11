# NextJS Integration Test

This directory contains a minimal NextJS application to test the `@countrystatecity/translations` package integration.

## Purpose

This test verifies that the package:
- Can be successfully imported in NextJS client components
- Builds without webpack errors
- Works correctly with NextJS's webpack bundler

## Running the Test

### Prerequisites

Build the main package first:
```bash
cd ../..
npm run build
```

### Run the Test

```bash
./test.sh
```

## What the Test Does

1. Installs NextJS and dependencies
2. Links the local `@countrystatecity/translations` package
3. Attempts to build the NextJS application
4. If the build succeeds, the package is compatible with NextJS
