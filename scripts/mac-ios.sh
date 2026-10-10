#!/usr/bin/env bash
# Prepare LumaCare and open the Xcode project. Run on a Mac.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script is for macOS with Xcode installed."
  exit 1
fi

npm install
npm run ios:sync

echo ""
echo "Opening ios/App/App.xcodeproj"
echo "1. Select the App target → Signing & Capabilities → Team."
echo "2. Pick an iPhone simulator or a connected iPhone."
echo "3. Press Run."
echo "The shared scheme already points at App/LumaCare.storekit for local StoreKit testing."
open ios/App/App.xcodeproj
