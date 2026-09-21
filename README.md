# Watch Test

A small, native Android dashboard that receives **real Bluetooth heart-rate notifications** from a compatible watch. Optional Health Connect readings stay clearly separate from the live stream. There is no demo data, account, server or internet permission.

## Install and try with a Huawei GT6

1. Download `Watch-Test-0.1.0.apk` from the supplied file or the latest successful [Actions build](https://github.com/macdarenz-droid/Watch-test/actions). The Actions artifact is `Watch-Test-APK`; unzip it first. Install the APK on your **phone**, not the watch. Android may ask you to allow installs from the app opening the file.
2. On the **watch**, open **Settings → HR Data Broadcasts** and start broadcasting. Wear the watch snugly. You can start a workout from the broadcast screen if offered.
3. Open Watch Test → **Connect watch**. Allow **Nearby devices**. On Android 8–11, allow Location and enable Location services; this is Android’s BLE discovery requirement, and the app does not collect location.
4. Choose the broadcasting watch. Heart-rate advertisers appear first. The normal Huawei Health Bluetooth connection and the sensor broadcast may appear separately.
5. Wait for **LIVE** and compare bpm against the watch. The graph plots received readings, including repeated values. It is a heart-rate trend, not an ECG.
6. **Disconnect** ends the connection. It also has a notification action. For a failed connection, use **Export connection diagnostics** and share that text file when asking for help.

Huawei documents this feature [here](https://consumer.huawei.com/kh/support/content/en-us15827504/). If the setting is absent on your firmware, this app cannot enable it remotely. Some Huawei devices can only connect to one receiver and may pause their Huawei Health connection during broadcasting. This implementation has not been physically verified with the owner’s GT6; that installation test is the remaining hardware check.

## What is live?

| Reading | Route | Availability / timing |
|---|---|---|
| Heart rate + recent graph + session min/avg/max | BLE Heart Rate Service `0x180D`, measurement `0x2A37` | Updated on every notification; the watch controls transmission frequency. No artificial polling delay. |
| RR intervals | Optional field in the same packet | Only if sent. These are individual beat intervals, not a computed HRV score. |
| Broadcast energy | Optional field in the same packet | Cumulative watch counter in **kJ**, not daily active kcal. May reset or wrap. |
| Watch battery | Optional Battery Service `0x180F` | Read after connecting, then notified if supported. Timestamp shown. |
| Today’s steps and active calories | Health Connect, Android 14+ | Shared records, not live Bluetooth. Uses platform aggregation. |
| Latest sleep session and oxygen reading | Health Connect, Android 14+ | Last seven days, actual record times/source shown. Sleep is session span, not inferred time asleep. |

The live badge means the latest valid measurement arrived within 5 seconds. It changes to **DELAYED** after 5 seconds and **STALE** after 15. Disconnection and poor skin contact take precedence. Packet interval is measured at the phone; it is **not** proof of sensor-to-screen latency because standard heart-rate packets contain no sensor timestamp. A 3–5 second update rate is possible only when the watch actually emits that frequently; it is not guaranteed here.

## Other watches

The BLE adapter is brand-independent for devices exposing the standard GATT Heart Rate Service: compatible watches, chest straps and armbands. This does **not** mean every smartwatch exposes every sensor. A proprietary pairing connection, ANT+-only broadcast or a closed ecosystem requires another supported adapter. Wear OS watches may need a watch-side broadcast app; Apple Watch is not a universal Android Bluetooth health source. No vendor authentication or private Huawei protocol is bypassed.

## More health data

Tap **Connect health data** to choose read permissions. A companion app must first write the relevant records to Health Connect. Huawei Health’s sharing support depends on app version/region and should be checked on the actual phone; this APK does not scrape Huawei Health or log into Huawei. If there are no shared records, the tiles stay empty with an explanation. A third-party bridge is not included or required for live BLE heart rate.

Records refresh every 60 seconds while this dashboard is visible. Refreshing cannot make an upstream app sync sooner. **Choose data source** filters records to an app’s package. The default aggregates all shared sources and can include phone data, so it is labelled accordingly. No Health Connect data is written or deleted. Android 8–13 supports the live Bluetooth portion; this test app’s Health Connect route requires Android 14+.

## Build

JDK 17, Android SDK 35, Gradle 8.11.1 / Android Gradle Plugin 8.9.2:

```sh
./gradlew :sensor-core:test :app:lintDebug :app:assembleDebug
# app/build/outputs/apk/debug/app-debug.apk
```

Windows: use `gradlew.bat`. Open the root folder in Android Studio for normal development. CI builds and signs an installable **debug test APK**, checks its signature, runs unit/lint checks, and runs dashboard instrumentation on Android 11 and Android 15 emulators. Debug signing is for this standalone test; a production signing key is not configured. Separate CI/local debug builds can have different signing certificates and may require uninstalling the earlier test APK before installing another.

## Project layout

- `sensor-core/`: plain Java packet parser and monotonic freshness/session model, with tests.
- `app/.../WatchService.java`: serial GATT operation queue, subscription, bounded retries, foreground lifecycle, optional battery reading, redacted diagnostics.
- `app/.../DeviceScanner.java`: user-selected discovery, including paired devices and devices omitting service UUIDs from advertisements.
- `app/.../HealthBridge.java`, `PlatformHealthBridge.java`: delayed shared-data adapter, source filters, pagination, revocation handling.
- `app/.../MainActivity.java`, `HeartChart.java`: one dashboard and setup/permission dialogs.
- [Integration notes](docs/INTEGRATION.md), [hardware checklist](docs/HARDWARE-TEST.md), [privacy](docs/PRIVACY.md).

## Reference material

- [Huawei HR Data Broadcasts](https://consumer.huawei.com/kh/support/content/en-us15827504/)
- [Android BLE GATT](https://developer.android.com/develop/connectivity/bluetooth/ble/connect-gatt-server)
- [Android Bluetooth permissions](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions)
- [Connected-device foreground services](https://developer.android.com/develop/background-work/services/fgs/service-types#connected-device)
- [Health Connect data sharing](https://developer.android.com/health-and-fitness/health-connect)

Hardware compatibility is a runtime capability, not something a successful APK compilation can prove.
