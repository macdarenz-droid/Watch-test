# Integrating with a gym tracker

The Android BLE adapter is independent of the dashboard. Keep that separation when connecting it to a web-based/Capacitor gym tracker; Web Bluetooth support is not a prerequisite.

1. Reuse `sensor-core` and move `WatchService` behind a Capacitor plugin or another native bridge. Preserve foreground-service permissions, lifecycle and user-selected device connection.
2. Deliver measurements to the tracker through an event, for example `watchMeasurement`. Suggested payload: `{ source: "ble-heart-rate", bpm, receivedAtEpochMs, receivedAtElapsedMs, contactDetected, rrMillis, energyKj }`. Optional fields remain null/empty when absent.
3. Deliver connection/freshness events independently. A Bluetooth link being connected is insufficient to claim a live reading. Use monotonic time for freshness; UTC wall time is only for record association.
4. Associate received samples with an active workout ID. Decide retention/export/deletion before adding persistent health history. This app keeps only the latest 900 chart samples and whole-session aggregates in memory; process death clears them.
5. Keep Health Connect records in a separate route with source package, record time and period. Never relabel recorded data as a live watch sensor. Use platform aggregation to avoid summing overlapping sources manually.
6. Add brand adapters only through supported APIs or explicit watch companion software. BLE heart rate is a capability-based adapter, not a universal smartwatch protocol.

The UI has no simulated-data mode. The protocol fixtures live in test sources only. No HRV/VO₂max/calorie estimates are inferred from bpm. There is no vendor credential flow.

GATT writes are serialized. Heart-rate CCCD acknowledgement is required before marking subscribed. Optional battery operations cannot block required subscription startup. Each connection/discovery/GATT operation has a timeout. A stale callback from a previous connection is ignored. Up to three consecutive reconnection attempts follow a transport failure; a valid packet resets the retry count. Explicit disconnect, Bluetooth off, permission revocation and unsupported service terminate the foreground connection.

No connection restarts on boot or after the user stops the process. Android/OEM power management can still end the service; no promise of indefinite background streaming is made.
