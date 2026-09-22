# Integrated M/ARC heart-rate build

`marc-app/` is the editable M/ARC client integrated with Watch Test's proven standard BLE Heart Rate Service transport. The existing `app/` remains the standalone transport dashboard and `sensor-core/` remains its parser test module.

The integrated app:

- discovers user-selected standard BLE heart-rate broadcasters;
- remembers the selected device and attempts reconnection when M/ARC opens;
- records accepted samples in a native SQLite database while the screen is off;
- assigns samples to the immutable workout ID allocated at workout start;
- shows live/delayed/lost freshness and a bounded two-minute trend;
- adds session average, recorded peak, coverage and gap counts to History;
- includes traces in backup/restore and cascades delete/reset to the native store;
- keeps live sensor data separate from daily Health Connect data.

No demo readings, BPM-derived recovery claims, HRV score, calories, exact set detection, or automatic load/rest changes are included.

## Build

The `Build integrated M/ARC heart-rate APK` workflow produces `MARC-WATCH-DEBUG-APK`. Locally, use Node 22, JDK 21 and Android SDK 36:

```sh
cd marc-app
npm ci
npm run check
rm -rf android
npx cap add android
npx cap sync android
npm run cap:prepare
cd android
./gradlew lintDebug assembleDebug
```

The APK is `marc-app/android/app/build/outputs/apk/debug/app-debug.apk`.

## Hardware gate

A successful build proves source integration, not optical accuracy or vendor compatibility. Before release, run `docs/HARDWARE-TEST.md` with the actual phone/watch pair, including screen-off recording and broadcast loss/recovery.
