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
if ! grep -R -q "What's the weather like?" ios/App/App/public; then
  echo "The new Today screen is not in ios/App/App/public. Leave Xcode closed and run this again."
  exit 1
fi
if grep -R -q "Name the weather, then move" ios/App/App/public; then
  echo "ios/App/App/public still contains the old Today screen. Leave Xcode closed and run this again."
  exit 1
fi
if ! grep -q 'DisableDeploy' ios/App/App/config.xml; then
  echo "The iPhone project is missing DisableDeploy, so it can reopen the saved page."
  exit 1
fi

echo "Xcode installs this local folder, not the GitHub website:"
echo "  $(pwd)/ios/App/App/public"
echo "build.txt:"
cat ios/App/App/public/build.txt
echo "Opening ios/App/App.xcodeproj"
echo "1. Quit any Xcode window that is not this project."
echo "2. At the top of Xcode, choose your iPhone, not a simulator."
echo "3. Product → Clean Build Folder, then press Run."
echo "4. In the Xcode console, these two lines mean the phone is running this build:"
echo "   LumaCare build 6 starting"
echo "   LumaCare build 6 web: new"
echo "Today then shows one mood row. Energy and Stress are not on that first screen."
echo "If those two lines are missing, delete LumaCare from the iPhone and press Run again."
echo "The shared scheme already points at App/LumaCare.storekit for local StoreKit testing."
open ios/App/App.xcodeproj
