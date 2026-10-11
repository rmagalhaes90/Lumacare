#!/usr/bin/env bash
# Replace the local LumaCare files with the GitHub branch and install that app on the connected iPhone.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script is for macOS with Xcode installed."
  exit 1
fi

branch="cursor/apple-ios-app-6da4"
team="$(grep -m1 'DEVELOPMENT_TEAM = ' ios/App/App.xcodeproj/project.pbxproj | sed -E 's/.*DEVELOPMENT_TEAM = ([^;]+);/\1/' || true)"

git fetch origin
git checkout "$branch"
git reset --hard "origin/$branch"

if [[ -n "${team}" ]] && ! grep -q 'DEVELOPMENT_TEAM = ' ios/App/App.xcodeproj/project.pbxproj; then
  python3 - "$team" << 'PY'
import pathlib, sys
team = sys.argv[1]
path = pathlib.Path("ios/App/App.xcodeproj/project.pbxproj")
text = path.read_text()
text = text.replace("CODE_SIGN_STYLE = Automatic;\n", f"CODE_SIGN_STYLE = Automatic;\n\t\t\t\tDEVELOPMENT_TEAM = {team};\n")
path.write_text(text)
print(f"Kept signing team {team}")
PY
fi

npm install
npm run ios:sync

hostname="$(grep hostname ios/App/App/capacitor.config.json)"
echo "Local commit: $(git rev-parse --short HEAD)"
echo "App address: ${hostname}"
echo "build.txt:"
cat ios/App/App/public/build.txt
if ! grep -q 'lumacare-build-6.local' ios/App/App/capacitor.config.json; then
  echo "The local project still points at capacitor://localhost. Stop here and paste this output."
  exit 1
fi
if ! grep -q '^6$' ios/App/App/public/build.txt; then
  echo "ios/App/App/public/build.txt is not build 6."
  exit 1
fi

device_json="$(mktemp)"
if ! xcrun devicectl list devices --json-output "$device_json" >/dev/null 2>&1; then
  echo "No iPhone was found. Plug in the phone, unlock it, and run this again."
  exit 1
fi

device_id="$(python3 - "$device_json" << 'PY'
import json, sys
data = json.load(open(sys.argv[1]))
devices = data.get("result", {}).get("devices", [])
connected = []
for device in devices:
    hardware = device.get("hardwareProperties") or {}
    connection = device.get("connectionProperties") or {}
    props = device.get("deviceProperties") or {}
    platform = hardware.get("platform") or props.get("platform") or ""
    if "iOS" not in platform and "iphone" not in platform.lower():
        continue
    state = (connection.get("tunnelState") or connection.get("transportType") or "").lower()
    if state and state not in {"connected", "available", "wired"} and "connect" not in state:
        continue
    connected.append((props.get("name") or "", device.get("identifier") or device.get("udid") or ""))
if not connected:
    sys.exit(0)
ranked = sorted(connected, key=lambda item: (0 if "max" in item[0].lower() or "ramon" in item[0].lower() else 1, item[0]))
print(ranked[0][1])
PY
)"

if [[ -z "${device_id}" ]]; then
  echo "The iPhone is not connected. Unlock it, tap Trust, and run this again."
  exit 1
fi

echo "Installing on device ${device_id}"
derived="${PWD}/.derived"
rm -rf "$derived"
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -destination "id=${device_id}" \
  -derivedDataPath "$derived" \
  -allowProvisioningUpdates \
  build

app="$(find "$derived" -type d -path '*iphoneos/App.app' | head -1)"
if [[ -z "${app}" ]]; then
  echo "The build finished without an iPhone app."
  exit 1
fi
if ! grep -q 'lumacare-build-6.local' "${app}/capacitor.config.json"; then
  echo "The built app still points at capacitor://localhost."
  exit 1
fi

xcrun devicectl device uninstall app --device "$device_id" app.lumacare.companion >/dev/null 2>&1 || true
xcrun devicectl device install app --device "$device_id" "$app"
xcrun devicectl device process launch --device "$device_id" app.lumacare.companion

echo ""
echo "Installed build 6 on the iPhone and removed the previous copy."
echo "Today should ask What's the weather like? with only the mood choices."
echo "In Xcode the matching lines are:"
echo "  LumaCare build 6 starting"
echo "  Loading app at capacitor://lumacare-build-6.local..."
