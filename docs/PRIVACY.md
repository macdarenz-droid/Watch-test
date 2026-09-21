# Privacy and data handling

Watch Test has no internet permission, account, analytics SDK, ads or cloud upload. The user explicitly chooses a Bluetooth sensor and optional Health Connect read permissions. It requests no write access to health records and no phone body sensors.

Live readings and shared health records are held in process memory. A health source package and whether notification permission has been requested are saved as local preferences. Android backup is disabled. Session chart storage is bounded; stopping the process clears the readings.

Bluetooth continues as a user-started connected-device foreground service until disconnected or terminated by the system. Health Connect is queried only while the dashboard is visible; pending callbacks are invalidated when leaving the dashboard. On Android 8–11, Location permission is used only to meet Android’s BLE scan requirement.

Diagnostic export is a user-selected document operation. The file contains app/Android versions, phone/watch model or name, service/characteristic UUIDs, connection errors and packet counts/timing. It contains no Bluetooth addresses, physiological values or Health Connect records. Exporting does not send the file anywhere. Device names can contain names chosen by the owner, so review an exported file before sharing it.

Revoke permissions through Android settings. Uninstalling removes app preferences. Health Connect source records remain owned by their source apps and are never deleted by Watch Test.
