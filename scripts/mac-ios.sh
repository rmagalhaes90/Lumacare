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
echo "3. Press Run. The phone should flash the words Small steps. and then restart LumaCare."
echo "If the old logo splash appears instead, Xcode is building a different copy of the project."
echo "Today then shows one mood row. Energy and Stress are not on that first screen."
echo "The shared scheme already points at App/LumaCare.storekit for local StoreKit testing."
open ios/App/App.xcodeproj
