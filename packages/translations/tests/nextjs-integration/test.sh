#!/bin/bash
set -e

echo "======================================"
echo "NextJS Integration Test"
echo "======================================"
echo ""

cd "$(dirname "$0")"

# Check if package is built
if [ ! -d "../../dist" ]; then
  echo "❌ Error: Package not built. Please run 'npm run build' first."
  exit 1
fi

echo "📦 Installing dependencies..."
npm install --silent

echo ""
echo "🏗️  Building NextJS application..."
npm run build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ NextJS build successful!"
  echo "✅ The package works correctly with NextJS webpack bundling"
  echo ""
  echo "Test verified:"
  echo "  - Package can be imported in NextJS client components"
  echo "  - Webpack successfully bundles without 'fs' module errors"
  exit 0
else
  echo ""
  echo "❌ NextJS build failed!"
  echo "The package may have compatibility issues with NextJS"
  exit 1
fi
