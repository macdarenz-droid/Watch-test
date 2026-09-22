package com.mrcdrnzz.dailytracker;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Build;
import android.os.IBinder;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONException;

@CapacitorPlugin(name = "HeartRateNative", permissions = {
    @Permission(alias = "nearby", strings = { Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT }),
    @Permission(alias = "location", strings = { Manifest.permission.ACCESS_FINE_LOCATION })
})
public final class HeartRateNativePlugin extends Plugin implements HeartRateService.Listener {
    private HeartRateService service;
    private HeartRateDeviceScanner scanner;
    private BluetoothAdapter adapter;
    private boolean bound;

    private final ServiceConnection connection = new ServiceConnection() {
        @Override public void onServiceConnected(ComponentName name, IBinder binder) {
            service = ((HeartRateService.LocalBinder) binder).get(); service.setListener(HeartRateNativePlugin.this);
            scanner = new HeartRateDeviceScanner(adapter, HeartRateNativePlugin.this::devicesChanged);
            bound = true;
        }
        @Override public void onServiceDisconnected(ComponentName name) { bound = false; service = null; scanner = null; }
    };

    @Override public void load() {
        BluetoothManager manager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        adapter = manager == null ? null : manager.getAdapter();
        getContext().bindService(new Intent(getContext(), HeartRateService.class), connection, Context.BIND_AUTO_CREATE);
    }

    private boolean ready(PluginCall call) {
        if (adapter == null) { call.unavailable("Bluetooth LE is unavailable on this device."); return false; }
        if (!bound || service == null) { call.reject("Heart-rate service is still starting."); return false; }
        return true;
    }

    private boolean granted() {
        return Build.VERSION.SDK_INT >= 31 ? getPermissionState("nearby") == PermissionState.GRANTED : getPermissionState("location") == PermissionState.GRANTED;
    }

    @PluginMethod public void requestSensorPermissions(PluginCall call) {
        if (granted()) { permissionResult(call); return; }
        requestPermissionForAlias(Build.VERSION.SDK_INT >= 31 ? "nearby" : "location", call, "permissionCallback");
    }

    @PermissionCallback private void permissionCallback(PluginCall call) { permissionResult(call); }
    private void permissionResult(PluginCall call) { JSObject out = new JSObject(); out.put("granted", granted()); call.resolve(out); }

    @PluginMethod public void getStatus(PluginCall call) {
        if (!ready(call)) return;
        JSObject out = service.status(); out.put("scanning", scanner != null && scanner.scanning); call.resolve(out);
    }

    @PluginMethod public void startScan(PluginCall call) {
        if (!ready(call)) return;
        if (!granted()) { call.reject("Nearby devices permission is required."); return; }
        try { scanner.start(); JSObject out = new JSObject(); out.put("started", scanner.scanning); call.resolve(out); }
        catch (SecurityException error) { call.reject("Nearby devices permission is required.", error); }
    }

    @PluginMethod public void stopScan(PluginCall call) { if (!ready(call)) return; scanner.stop(); call.resolve(); }
    @PluginMethod public void listDevices(PluginCall call) { if (!ready(call)) return; JSObject out = new JSObject(); out.put("devices", scanner.json()); call.resolve(out); }

    @PluginMethod public void connect(PluginCall call) {
        if (!ready(call)) return;
        String id = call.getString("deviceId"); if (id == null) { call.reject("deviceId is required"); return; }
        if (!granted()) { call.reject("Nearby devices permission is required."); return; }
        try {
            BluetoothDevice device = scanner.device(id); if (device == null) device = adapter.getRemoteDevice(id);
            scanner.stop(); service.connect(device); call.resolve();
        } catch (IllegalArgumentException | SecurityException error) { call.reject("The selected Bluetooth device is unavailable.", error); }
    }

    @PluginMethod public void reconnectRemembered(PluginCall call) {
        if (!ready(call)) return;
        JSObject out = new JSObject(); out.put("started", granted() && service.reconnectRemembered(adapter)); call.resolve(out);
    }
    @PluginMethod public void disconnect(PluginCall call) { if (!ready(call)) return; service.disconnect(); call.resolve(); }

    @PluginMethod public void beginSession(PluginCall call) {
        if (!ready(call)) return;
        String id = call.getString("sessionId"); Long started = call.getLong("startedAtEpochMs");
        if (id == null || started == null) { call.reject("sessionId and startedAtEpochMs are required"); return; }
        service.beginSession(id, started); call.resolve();
    }

    @PluginMethod public void finishSession(PluginCall call) {
        if (!ready(call)) return;
        String id = call.getString("sessionId"); Long ended = call.getLong("endedAtEpochMs");
        if (id == null || ended == null) { call.reject("sessionId and endedAtEpochMs are required"); return; }
        JSObject out = new JSObject(); out.put("summary", service.finishSession(id, ended)); call.resolve(out);
    }

    @PluginMethod public void discardSession(PluginCall call) { if (!ready(call)) return; String id = call.getString("sessionId"); if (id == null) { call.reject("sessionId is required"); return; } service.discardSession(id); call.resolve(); }
    @PluginMethod public void deleteSession(PluginCall call) { if (!ready(call)) return; String id = call.getString("sessionId"); if (id == null) { call.reject("sessionId is required"); return; } service.database().delete(id); call.resolve(); }
    @PluginMethod public void getSessionTrace(PluginCall call) { if (!ready(call)) return; String id = call.getString("sessionId"); if (id == null) { call.reject("sessionId is required"); return; } call.resolve(service.database().trace(id)); }
    @PluginMethod public void exportAll(PluginCall call) { if (!ready(call)) return; call.resolve(service.database().exportAll()); }

    @PluginMethod public void importAll(PluginCall call) {
        if (!ready(call)) return;
        JSObject payload = call.getObject("payload"); if (payload == null) { call.reject("payload is required"); return; }
        try { JSObject out = new JSObject(); out.put("imported", service.database().importAll(payload)); call.resolve(out); }
        catch (JSONException | RuntimeException error) { call.reject("Invalid heart-rate backup.", error); }
    }

    @PluginMethod public void resetAll(PluginCall call) { if (!ready(call)) return; service.database().reset(); call.resolve(); }

    private void devicesChanged() {
        JSObject out = new JSObject(); out.put("devices", scanner == null ? new com.getcapacitor.JSArray() : scanner.json()); notifyListeners("heartRateDevices", out);
        if (service != null) { JSObject status = service.status(); status.put("scanning", scanner != null && scanner.scanning); notifyListeners("heartRateStatus", status); }
    }
    @Override public void onStatus(JSObject status) { status.put("scanning", scanner != null && scanner.scanning); notifyListeners("heartRateStatus", status); }
    @Override public void onSample(JSObject sample) { notifyListeners("heartRateSample", sample); }

    @Override protected void handleOnDestroy() {
        if (scanner != null) scanner.stop();
        if (service != null) service.setListener(null);
        if (bound) { getContext().unbindService(connection); bound = false; }
        super.handleOnDestroy();
    }
}
