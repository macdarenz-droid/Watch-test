package com.mrcdrnzz.dailytracker;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanRecord;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@SuppressLint("MissingPermission")
final class HeartRateDeviceScanner {
    static final class Found {
        final BluetoothDevice device; String name; int rssi; boolean advertisesHeartRate, bonded;
        Found(BluetoothDevice value) { device = value; }
    }
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final BluetoothAdapter adapter;
    private final Runnable changed;
    private final Map<String, Found> found = new LinkedHashMap<>();
    private BluetoothLeScanner scanner;
    boolean scanning;

    HeartRateDeviceScanner(BluetoothAdapter adapter, Runnable changed) { this.adapter = adapter; this.changed = changed; }

    private final ScanCallback callback = new ScanCallback() {
        @Override public void onScanResult(int type, ScanResult result) { handler.post(() -> add(result)); }
        @Override public void onBatchScanResults(List<ScanResult> results) { handler.post(() -> { for (ScanResult value : results) add(value); }); }
        @Override public void onScanFailed(int code) { handler.post(() -> { stop(); changed.run(); }); }
    };

    void start() {
        stop(); found.clear();
        for (BluetoothDevice device : adapter.getBondedDevices()) if (device.getType() != BluetoothDevice.DEVICE_TYPE_CLASSIC) {
            Found value = new Found(device); value.name = name(device.getName()); value.bonded = true; found.put(device.getAddress(), value);
        }
        scanner = adapter.getBluetoothLeScanner();
        if (scanner == null) { changed.run(); return; }
        scanning = true;
        scanner.startScan(null, new ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build(), callback);
        changed.run();
        handler.postDelayed(() -> { stop(); changed.run(); }, 20_000);
    }

    void stop() {
        handler.removeCallbacksAndMessages(null);
        if (scanner != null && scanning) try { scanner.stopScan(callback); } catch (RuntimeException ignored) { }
        scanning = false;
    }

    BluetoothDevice device(String id) { Found value = found.get(id); return value == null ? null : value.device; }

    JSArray json() {
        List<Found> rows = new ArrayList<>(found.values());
        rows.sort(Comparator.comparing((Found value) -> !value.advertisesHeartRate).thenComparing(value -> !value.bonded).thenComparing(value -> value.name));
        JSArray out = new JSArray();
        for (Found value : rows) {
            JSObject row = new JSObject(); row.put("id", value.device.getAddress()); row.put("name", value.name); row.put("heartRateAdvertised", value.advertisesHeartRate); row.put("bonded", value.bonded); out.put(row);
        }
        return out;
    }

    private void add(ScanResult result) {
        if (!scanning) return;
        BluetoothDevice device = result.getDevice(); String id = device.getAddress(); Found value = found.get(id);
        if (value == null) { if (found.size() >= 80) return; value = new Found(device); found.put(id, value); }
        ScanRecord record = result.getScanRecord(); String reported = record == null ? null : record.getDeviceName();
        value.name = name(reported == null ? device.getName() : reported); value.rssi = result.getRssi();
        if (record != null && record.getServiceUuids() != null) value.advertisesHeartRate |= record.getServiceUuids().contains(new ParcelUuid(HeartRateService.HR_SERVICE));
        changed.run();
    }

    private static String name(String value) { return value == null || value.trim().isEmpty() ? "Unnamed Bluetooth device" : value; }
}
