# GT6 hardware acceptance

Status at creation: **requires the actual watch and phone**. An emulator cannot validate the GT6 Bluetooth transport.

1. Record the watch firmware and Android version. Start HR Data Broadcasts on the watch.
2. Connect in Watch Test. Verify the actual advertising entry has the Heart Rate service or that service discovery finds it.
3. Wear the watch and compare a 60-second sample with its display. Confirm readings change when the watch readings change. Record the observed packet interval; do not mistake this for end-to-end sensor latency.
4. Turn broadcasting off. The app must stop showing LIVE after 5 seconds without valid measurements, or immediately show disconnected if the link closes. Verify a frozen old value is labelled as old.
5. Restart broadcast. Confirm reconnection (up to 3 automatic attempts) or reconnect manually if the broadcast address changes.
6. Try poor fit/off-wrist. If the watch provides its contact flag, the app must show CHECK WATCH FIT; otherwise only the watch’s own data behavior is available.
7. Lock the phone for 2 minutes, then reopen. Confirm received chart points and the connection notification. Check the actual phone’s battery restrictions if it stops.
8. Turn phone Bluetooth off, then on. Confirm a clear stopped state and a successful manual reconnect.
9. Disconnect via both dashboard and notification. Neither may silently reconnect afterward.
10. Deny and then allow Bluetooth permissions. No crash and a path back to Android permissions are required.
11. If using Health Connect, verify the chosen source, today’s step/active-energy totals and sleep/oxygen timestamps. Deny individual permissions and revoke all permissions. Empty/denied values must not show as zero or remain presented as newly read.
12. Try another Bluetooth heart-rate device if available. Select a non-heart-rate device to verify a clear unsupported explanation.

If connection fails, export the diagnostic file from the app. It includes service UUIDs, connection errors, device models and packet count; it excludes physiological values and Bluetooth addresses.
