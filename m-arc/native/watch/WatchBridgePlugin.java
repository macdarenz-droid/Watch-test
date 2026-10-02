package com.mrcdrnzz.dailytracker.watch;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.mrcdrnzz.dailytracker.watch.core.LiveSession;

/**
 * Thin adapter over WatchService (ported from Watch-test): binds the service, forwards its
 * listener callbacks as plugin events. Behaviour carried over from Watch-test: connection state
 * and freshness are separate; freshness uses monotonic time; a connected link is not a live
 * reading; no synthetic data; up to three reconnects; the foreground service stops on explicit
 * disconnect, Bluetooth off, permission loss, or an unsupported service.
 */
@SuppressLint("MissingPermission")
@CapacitorPlugin(
        name = "WatchBridge",
        permissions = {
                @Permission(alias = "ble31", strings = { Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT }),
                @Permission(alias = "location", strings = { Manifest.permission.ACCESS_FINE_LOCATION }),
                @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }),
        }
)
public class WatchBridgePlugin extends Plugin {
    private WatchService service;
    private boolean bound;
    private DeviceScanner scanner;
    private long lastEmittedElapsed = -1;
    /** watchDevices is throttled to one per 500 ms, with a trailing emit (PL-13). */
    private static final long DEVICES_EVERY_MS = 500;
    private long lastDevicesAt = 0;
    private boolean devicesQueued = false;
    private final android.os.Handler main = new android.os.Handler(android.os.Looper.getMainLooper());

    private boolean needsLocation() { return Build.VERSION.SDK_INT <= 30; }

    private boolean blePermitted() {
        if (needsLocation()) return getContext().checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        return getContext().checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED
            && getContext().checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
    }

    private BluetoothAdapter adapter() {
        BluetoothManager m = getContext().getSystemService(BluetoothManager.class);
        return m == null ? null : m.getAdapter();
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        boolean supported = adapter() != null && getContext().getPackageManager().hasSystemFeature(android.content.pm.PackageManager.FEATURE_BLUETOOTH_LE);
        JSObject out = new JSObject();
        out.put("supported", supported);
        call.resolve(out);
    }

    @PluginMethod
    public void permissionState(PluginCall call) {
        JSObject out = new JSObject();
        out.put("granted", blePermitted());
        out.put("needsLocation", needsLocation());
        call.resolve(out);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (blePermitted()) { finishPermissionRequest(call); return; }
        requestPermissionForAlias(needsLocation() ? "location" : "ble31", call, "blePermissionCallback");
    }

    @PermissionCallback
    private void blePermissionCallback(PluginCall call) { finishPermissionRequest(call); }

    private void finishPermissionRequest(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getContext().checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationsPermissionCallback");
            return;
        }
        JSObject out = new JSObject();
        out.put("granted", blePermitted());
        call.resolve(out);
    }

    @PermissionCallback
    private void notificationsPermissionCallback(PluginCall call) {
        JSObject out = new JSObject();
        out.put("granted", blePermitted());
        call.resolve(out);
    }

    @Override
    public void load() {
        Intent intent = new Intent(getContext(), WatchService.class);
        bound = getContext().bindService(intent, connection, Context.BIND_AUTO_CREATE);
    }

    @Override
    protected void handleOnDestroy() {
        main.removeCallbacksAndMessages(null);
        if (scanner != null) scanner.stop();
        if (service != null) service.setListener(null);
        if (bound) { try { getContext().unbindService(connection); } catch (RuntimeException ignored) { } }
        bound = false;
    }

    private final ServiceConnection connection = new ServiceConnection() {
        @Override public void onServiceConnected(ComponentName name, IBinder binder) {
            service = ((WatchService.LocalBinder) binder).get();
            service.setListener(WatchBridgePlugin.this::emitStatus);
        }
        @Override public void onServiceDisconnected(ComponentName name) { service = null; }
    };

    // PL-08: plugin methods run on Capacitor's plugin thread, while the scanner and the service
    // live on the main looper; every body that touches them hops to the main thread.
    @PluginMethod
    public void startScan(PluginCall call) {
        getBridge().executeOnMainThread(() -> {
            BluetoothAdapter a = adapter();
            if (a == null || !blePermitted()) { call.reject("Bluetooth unavailable or not permitted"); return; }
            Integer timeoutMs = call.getInt("timeoutMs", 20_000);
            if (scanner == null) scanner = new DeviceScanner(a, this::devicesChanged);
            // DeviceScanner reports "something changed"; the plugin re-reads its current device list each time.
            scanner.start(timeoutMs == null ? 20_000 : timeoutMs);
            // After start, so the UI sees "scanning" before the call resolves (UI-07).
            emitStatus();
            call.resolve();
        });
    }

    @PluginMethod
    public void stopScan(PluginCall call) {
        getBridge().executeOnMainThread(() -> {
            if (scanner != null) scanner.stop();
            emitStatus();
            call.resolve();
        });
    }

    @PluginMethod
    public void connect(PluginCall call) {
        getBridge().executeOnMainThread(() -> {
            String address = call.getString("address");
            BluetoothAdapter a = adapter();
            if (address == null || a == null || !blePermitted() || service == null) { call.reject("Cannot connect"); return; }
            if (scanner != null) scanner.stop();
            try {
                BluetoothDevice device = a.getRemoteDevice(address);
                service.connect(device);
                call.resolve();
            } catch (IllegalArgumentException e) { call.reject("Invalid device address"); }
        });
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        getBridge().executeOnMainThread(() -> {
            if (service != null) service.disconnect();
            call.resolve();
        });
    }

    @PluginMethod
    public void status(PluginCall call) {
        getBridge().executeOnMainThread(() -> call.resolve(statusObject()));
    }

    /** UI-08: the service's status and connection log, with no addresses or heart-rate values. */
    @PluginMethod
    public void diagnostics(PluginCall call) {
        getBridge().executeOnMainThread(() -> {
            JSObject out = new JSObject();
            out.put("text", service == null ? "Watch service not running.\n" : service.diagnostics());
            call.resolve(out);
        });
    }

    private String freshness() {
        if (service == null || !service.running) return "DISCONNECTED";
        return service.session.freshness(service.subscribed, SystemClock.elapsedRealtime());
    }

    private String state() {
        if (adapter() == null) return "unsupported";
        if (!blePermitted()) return "permission";
        if (scanner != null && scanner.scanning) return "scanning";
        if (service != null && !service.running && service.pausedReason != null) return "paused";
        if (service == null || !service.running) return "idle";
        if (service.subscribed) return "connected";
        return "Connecting".equals(service.status) ? "connecting" : "reconnecting";
    }

    private JSObject statusObject() {
        JSObject out = new JSObject();
        out.put("state", state());
        out.put("freshness", freshness());
        if (service != null && service.running) out.put("deviceName", service.deviceName);
        if (service != null && service.battery != null) out.put("battery", service.battery);
        out.put("message", service == null ? "Ready to connect" : service.detail);
        return out;
    }

    private void emitStatus() {
        notifyListeners("watchStatus", statusObject());
        LiveSession s = service == null ? null : service.session;
        if (s != null && s.samples > 0 && !s.points.isEmpty() && s.lastElapsed != lastEmittedElapsed) {
            LiveSession.Point p = s.points.get(s.points.size() - 1);
            lastEmittedElapsed = s.lastElapsed;
            JSObject m = new JSObject();
            m.put("bpm", p.bpm());
            if (s.contact != null) m.put("contact", s.contact); else m.put("contact", (Object) null);
            JSArray rr = new JSArray();
            for (Double v : s.rrMillis) rr.put(v);
            m.put("rrMs", rr);
            m.put("energyKj", s.energyKj == null ? null : s.energyKj);
            m.put("receivedAtEpochMs", p.receivedAt());
            m.put("receivedAtElapsedMs", p.elapsed());
            notifyListeners("watchMeasurement", m);
        }
    }

    /** Called on the main looper whenever the scan list changes; emits at most every 500 ms, always ending on the latest list. */
    private void devicesChanged() {
        long now = SystemClock.elapsedRealtime();
        long wait = lastDevicesAt + DEVICES_EVERY_MS - now;
        if (wait <= 0) { emitDevices(); return; }
        if (devicesQueued) return;
        devicesQueued = true;
        main.postDelayed(() -> { devicesQueued = false; emitDevices(); }, wait);
    }

    private void emitDevices() {
        lastDevicesAt = SystemClock.elapsedRealtime();
        JSArray list = new JSArray();
        if (scanner != null) for (DeviceScanner.Found f : scanner.devices) {
            JSObject d = new JSObject();
            d.put("address", f.device.getAddress());
            d.put("name", f.name);
            d.put("advertisesHeartRate", f.advertisesHeartRate);
            d.put("paired", f.paired);
            d.put("rssi", f.rssi);
            list.put(d);
        }
        JSObject out = new JSObject();
        out.put("devices", list);
        notifyListeners("watchDevices", out);
        // The scan state lives in the status too; a finished scan must reach the UI.
        emitStatus();
    }
}
