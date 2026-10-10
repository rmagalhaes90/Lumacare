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
echo "3. Press Run. Opening the project does not install the new screen by itself."
echo "If Today still says “Name the weather, then move,” delete LumaCare from the simulator or phone and press Run again."
echo "The shared scheme already points at App/LumaCare.storekit for local StoreKit testing."
open ios/App/App.xcodeproj
