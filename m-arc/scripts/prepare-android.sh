#!/usr/bin/env bash
# Generates the Android project from www/ and native/ (R7.2). Both build-apk.yml and
# release-apk.yml call this, so the two builds cannot drift apart (the icon background did).
set -euo pipefail

rm -rf android
npx cap add android
python3 - <<'PY'
from pathlib import Path
import re
p = Path('android/variables.gradle')
s = p.read_text(encoding='utf-8')
s, n = re.subn(r'(minSdkVersion\s*=\s*)\d+', r'\g<1>26', s)
if n == 0: raise SystemExit('minSdkVersion not found')
p.write_text(s, encoding='utf-8')
PY
npx cap sync android

PKG='android/app/src/main/java/com/mrcdrnzz/dailytracker'
mkdir -p "$PKG"
cp native/MainActivity.java native/HealthConnectNativePlugin.java native/PermissionsRationaleActivity.java native/NativeUiPlugin.java "$PKG/"
mkdir -p "$PKG/watch/core" && cp native/watch/*.java "$PKG/watch/" && cp native/watch/core/*.java "$PKG/watch/core/"
python3 native/patch_manifest.py android/app/src/main/AndroidManifest.xml

# Replace Capacitor launcher assets with the M/ARC icon copied into www/ by the build.
ICON='www/icon-512.png'
test -f "$ICON" || { echo '::error::www/icon-512.png missing'; exit 1; }
for d in mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi; do
  mkdir -p "android/app/src/main/res/$d"
  cp "$ICON" "android/app/src/main/res/$d/ic_launcher.png"
  cp "$ICON" "android/app/src/main/res/$d/ic_launcher_round.png"
done
# R7.3: the adaptive icon's padded foreground and monochrome layers (scripts/render-logo.mjs --android).
cp -R native/res/. android/app/src/main/res/
mkdir -p android/app/src/main/res/values
cat > android/app/src/main/res/values/ic_launcher_background.xml <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<resources><color name="ic_launcher_background">#08090A</color></resources>
XML
test -f android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
test -f android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
grep -q monochrome android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
test -f android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_monochrome.png
