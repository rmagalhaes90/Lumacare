#!/usr/bin/env bash
# Prepare LumaCare and open the Xcode project. Run on a Mac.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script is for macOS with Xcode installed."
  exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD)"
git pull --ff-only origin "$branch"
npm install
npm run ios:sync

echo ""
echo "This build is $(git rev-parse --short HEAD)."
echo "Opening ios/App/App.xcodeproj"
echo "1. Select the App target → Signing & Capabilities → Team."
echo "2. At the top of Xcode, choose your iPhone, not a simulator, if the phone is what you want to update."
echo "3. Press Run and wait until the iPhone restarts LumaCare by itself."
echo "The phone will ask your name again once. That means the saved copy of the old screen was left behind."
echo "Today should then show one mood row. It should not show Energy and Stress on the same screen."
echo "The shared scheme already points at App/LumaCare.storekit for local StoreKit testing."
open ios/App/App.xcodeproj
