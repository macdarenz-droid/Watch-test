#!/usr/bin/env python3
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ANDROID = "http://schemas.android.com/apk/res/android"
ET.register_namespace("android", ANDROID)

def a(name):
    return f"{{{ANDROID}}}{name}"

if len(sys.argv) != 2:
    raise SystemExit("Usage: patch_manifest.py <AndroidManifest.xml>")

path = Path(sys.argv[1])
if not path.exists():
    raise SystemExit(f"Manifest not found: {path}")

tree = ET.parse(path)
root = tree.getroot()

permissions = [
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.SCHEDULE_EXACT_ALARM",
    "android.permission.health.READ_STEPS",
    "android.permission.health.READ_SLEEP",
    "android.permission.health.READ_HEART_RATE",
    "android.permission.health.READ_ACTIVE_CALORIES_BURNED",
    "android.permission.health.READ_RESTING_HEART_RATE",
]
existing = {p.get(a("name")) for p in root.findall("uses-permission")}
for name in permissions:
    if name not in existing:
        node = ET.Element("uses-permission")
        node.set(a("name"), name)
        root.insert(0, node)

# Watch BLE (6.2): BLUETOOTH_SCAN never resolves location from the scan; BLUETOOTH_CONNECT is
# plain; the legacy trio covers Android 8-11, capped so a modern OS never grants them at runtime.
attributed_permissions = [
    ("android.permission.BLUETOOTH_SCAN", {"usesPermissionFlags": "neverForLocation"}),
    ("android.permission.BLUETOOTH_CONNECT", {}),
    ("android.permission.BLUETOOTH", {"maxSdkVersion": "30"}),
    ("android.permission.BLUETOOTH_ADMIN", {"maxSdkVersion": "30"}),
    ("android.permission.ACCESS_FINE_LOCATION", {"maxSdkVersion": "30"}),
    ("android.permission.FOREGROUND_SERVICE", {}),
    ("android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE", {}),
    # F12 Save (QA4-3): Documents/M-ARC on Android 8-10 needs storage access; Android 11+ never asks.
    ("android.permission.WRITE_EXTERNAL_STORAGE", {"maxSdkVersion": "29"}),
    ("android.permission.READ_EXTERNAL_STORAGE", {"maxSdkVersion": "29"}),
]
# PL-16: an entry a plugin already contributed still gets the required attributes.
for name, attrs in attributed_permissions:
    if name in existing:
        for node in root.findall("uses-permission"):
            if node.get(a("name")) == name:
                for k, v in attrs.items():
                    node.set(a(k), v)
        continue
    node = ET.Element("uses-permission")
    node.set(a("name"), name)
    for k, v in attrs.items():
        node.set(a(k), v)
    root.insert(0, node)
    existing.add(name)

if not any(f.get(a("name")) == "android.hardware.bluetooth_le" for f in root.findall("uses-feature")):
    feature = ET.SubElement(root, "uses-feature")
    feature.set(a("name"), "android.hardware.bluetooth_le")
    feature.set(a("required"), "false")

app = root.find("application")
if app is None:
    raise SystemExit("<application> not found")

# F12 Save (QA4-3): Android 10 only reaches Documents with legacy storage; later versions ignore it.
app.set(a("requestLegacyExternalStorage"), "true")

# WatchService (6.2): a foreground connected-device service, ported from Watch-test.
watch_service = None
for x in app.findall("service"):
    if x.get(a("name")) == ".watch.WatchService":
        watch_service = x
        break
if watch_service is None:
    watch_service = ET.SubElement(app, "service")
    watch_service.set(a("name"), ".watch.WatchService")
watch_service.set(a("foregroundServiceType"), "connectedDevice")
watch_service.set(a("exported"), "false")

# Health Connect privacy/rationale activity.
activity = None
for x in app.findall("activity"):
    if x.get(a("name")) == ".PermissionsRationaleActivity":
        activity = x
        break
if activity is None:
    activity = ET.SubElement(app, "activity")
    activity.set(a("name"), ".PermissionsRationaleActivity")
activity.set(a("exported"), "true")

# Required Android 14+ alias for Health Connect permission usage/privacy entry.
alias = None
for x in app.findall("activity-alias"):
    if x.get(a("name")) == "ViewPermissionUsageActivity":
        alias = x
        break
if alias is None:
    alias = ET.SubElement(app, "activity-alias")
    alias.set(a("name"), "ViewPermissionUsageActivity")
    alias.set(a("exported"), "true")
    alias.set(a("targetActivity"), ".PermissionsRationaleActivity")
    alias.set(a("permission"), "android.permission.START_VIEW_PERMISSION_USAGE")
    filt = ET.SubElement(alias, "intent-filter")
    action = ET.SubElement(filt, "action")
    action.set(a("name"), "android.intent.action.VIEW_PERMISSION_USAGE")
    cat = ET.SubElement(filt, "category")
    cat.set(a("name"), "android.intent.category.HEALTH_PERMISSIONS")

ET.indent(tree, space="    ")
tree.write(path, encoding="utf-8", xml_declaration=True)
print(f"Patched {path}")
