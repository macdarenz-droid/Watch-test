package com.mrcdrnzz.dailytracker;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.BluetoothStatusCodes;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.os.Binder;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.SystemClock;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import java.util.ArrayDeque;
import java.util.Locale;
import java.util.UUID;

/** Foreground BLE transport plus native durable recording for screen-off continuity. */
@SuppressLint("MissingPermission")
public final class HeartRateService extends Service {
    interface Listener { void onStatus(JSObject status); void onSample(JSObject sample); }
    static final UUID HR_SERVICE = uuid(0x180D), HR = uuid(0x2A37);
    private static final UUID BATTERY_SERVICE = uuid(0x180F), BATTERY = uuid(0x2A19), CCCD = uuid(0x2902);
    private static final String CHANNEL = "marc_heart_rate";
    private static final String PREFS = "marc-heart-rate";
    private static final String DEVICE = "remembered-device";
    static final String STOP = "com.mrcdrnzz.dailytracker.HEART_RATE_STOP";

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final IBinder binder = new LocalBinder();
    private final ArrayDeque<Operation> queue = new ArrayDeque<>();
    private BluetoothGatt gatt;
    private BluetoothDevice device;
    private Operation pending;
    private Listener listener;
    private HeartRateDatabase database;
    private String activeSessionId;
    private String state = "lost", title = "Sensor disconnected", detail = "Connect a broadcasting heart-rate sensor.";
    private String deviceName;
    private boolean subscribed, running;
    private Integer battery;
    private int retries;
    private long lastPacketEpoch, lastNotification;
    private record Operation(BluetoothGattCharacteristic characteristic, boolean subscribe, boolean required) { }

    public final class LocalBinder extends Binder { HeartRateService get() { return HeartRateService.this; } }
    private static UUID uuid(int id) { return UUID.fromString(String.format(Locale.ROOT, "0000%04x-0000-1000-8000-00805f9b34fb", id)); }
    private final Runnable timeout = () -> fail("The sensor did not respond. Keep heart-rate broadcast enabled.", true);
    private final Runnable retry = this::open;
    private final BroadcastReceiver bluetoothState = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) {
            if (intent.getIntExtra(android.bluetooth.BluetoothAdapter.EXTRA_STATE, -1) == android.bluetooth.BluetoothAdapter.STATE_OFF && running) fail("Bluetooth is off.", false);
        }
    };

    @Override public void onCreate() {
        super.onCreate(); database = new HeartRateDatabase(this);
        NotificationChannel channel = new NotificationChannel(CHANNEL, "Heart-rate recording", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Keeps the selected heart-rate sensor connected during a workout");
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(bluetoothState, new IntentFilter(android.bluetooth.BluetoothAdapter.ACTION_STATE_CHANGED), Context.RECEIVER_EXPORTED);
        else registerReceiver(bluetoothState, new IntentFilter(android.bluetooth.BluetoothAdapter.ACTION_STATE_CHANGED));
    }

    @Override public IBinder onBind(Intent intent) { return binder; }
    @Override public int onStartCommand(Intent intent, int flags, int startId) { if (intent != null && STOP.equals(intent.getAction())) disconnect(); return START_NOT_STICKY; }
    void setListener(Listener value) { listener = value; if (value != null) value.onStatus(status()); }
    boolean permitted() { return Build.VERSION.SDK_INT < 31 || checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED; }

    synchronized void beginSession(String sessionId, long startedAt) { database.begin(sessionId, startedAt); activeSessionId = sessionId; }
    synchronized JSObject finishSession(String sessionId, long endedAt) { if (sessionId.equals(activeSessionId)) activeSessionId = null; return database.finish(sessionId, endedAt); }
    synchronized void discardSession(String sessionId) { if (sessionId.equals(activeSessionId)) activeSessionId = null; database.discard(sessionId); }
    synchronized void resetSessions() { activeSessionId = null; database.reset(); }
    synchronized int importSessions(JSObject payload) throws org.json.JSONException {
        // Do not let an incoming packet race with a full database replacement.
        int imported = database.importAll(payload);
        if (payload.optBoolean("replace", false)) activeSessionId = null;
        return imported;
    }
    HeartRateDatabase database() { return database; }

    void connect(BluetoothDevice selected) {
        disconnectTransport();
        if (!permitted()) { setStatus("lost", "Permission needed", "Allow Nearby devices to connect."); return; }
        device = selected; retries = 0; battery = null; lastPacketEpoch = 0;
        deviceName = safeName(selected.getName());
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString(DEVICE, selected.getAddress()).apply();
        running = true;
        try {
            if (Build.VERSION.SDK_INT >= 26) startForegroundService(new Intent(this, HeartRateService.class));
            else startService(new Intent(this, HeartRateService.class));
            if (Build.VERSION.SDK_INT >= 29) startForeground(41, notification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE);
            else startForeground(41, notification());
            open();
        } catch (RuntimeException error) { fail("Cannot start sensor connection.", false); }
    }

    boolean reconnectRemembered(android.bluetooth.BluetoothAdapter adapter) {
        if (running) return false;
        String address = getSharedPreferences(PREFS, MODE_PRIVATE).getString(DEVICE, null);
        if (address == null || !permitted()) return false;
        try { connect(adapter.getRemoteDevice(address)); return true; } catch (IllegalArgumentException | SecurityException error) { return false; }
    }

    void disconnect() { disconnectTransport(); setStatus("lost", "Sensor disconnected", "Connect a broadcasting heart-rate sensor."); }
    private void disconnectTransport() {
        running = false; handler.removeCallbacks(retry); closeGatt(); stopForeground(STOP_FOREGROUND_REMOVE); stopSelf();
    }

    private void open() {
        if (!running || device == null) return;
        if (!permitted()) { fail("Nearby devices permission was removed.", false); return; }
        closeGatt(); setStatus("connecting", retries == 0 ? "Connecting" : "Reconnecting", "Keep the sensor nearby and broadcasting.");
        try {
            gatt = device.connectGatt(this, false, callback, BluetoothDevice.TRANSPORT_LE);
            if (gatt == null) { fail("Android could not open the Bluetooth connection.", true); return; }
            handler.postDelayed(timeout, 20_000);
        } catch (RuntimeException error) { fail("Bluetooth connection failed.", true); }
    }

    private void closeGatt() {
        handler.removeCallbacks(timeout); queue.clear(); pending = null; subscribed = false;
        BluetoothGatt old = gatt; gatt = null;
        if (old != null) { try { if (permitted()) old.disconnect(); } catch (RuntimeException ignored) { } try { old.close(); } catch (RuntimeException ignored) { } }
    }

    private void fail(String message, boolean reconnect) {
        closeGatt();
        if (running && reconnect && permitted() && retries < 3) {
            retries++; setStatus("connecting", "Connection interrupted", message + " Retrying " + retries + "/3."); handler.postDelayed(retry, 2_000L * retries);
        } else {
            running = false; setStatus("lost", "Connection stopped", message); stopForeground(STOP_FOREGROUND_REMOVE); stopSelf();
        }
    }

    private final BluetoothGattCallback callback = new BluetoothGattCallback() {
        @Override public void onConnectionStateChange(BluetoothGatt value, int code, int nextState) { handler.post(() -> {
            if (value != gatt) return; handler.removeCallbacks(timeout);
            if (code == BluetoothGatt.GATT_SUCCESS && nextState == BluetoothProfile.STATE_CONNECTED) {
                setStatus("connecting", "Checking sensor", "Looking for the standard heart-rate service.");
                try { if (!value.discoverServices()) { fail("Service discovery could not start.", true); return; } handler.postDelayed(timeout, 15_000); }
                catch (SecurityException error) { fail("Nearby devices permission was removed.", false); }
            } else if (nextState == BluetoothProfile.STATE_DISCONNECTED || code != BluetoothGatt.GATT_SUCCESS) fail("Sensor disconnected (Bluetooth status " + code + ").", true);
        }); }
        @Override public void onServicesDiscovered(BluetoothGatt value, int code) { handler.post(() -> discovered(value, code)); }
        @Override public void onDescriptorWrite(BluetoothGatt value, BluetoothGattDescriptor descriptor, int code) { handler.post(() -> {
            if (value != gatt || pending == null || !pending.subscribe || !descriptor.getCharacteristic().getUuid().equals(pending.characteristic.getUuid())) return;
            Operation operation = pending;
            if (code != BluetoothGatt.GATT_SUCCESS && operation.required) { fail("The sensor refused heart-rate notifications.", false); return; }
            if (code == BluetoothGatt.GATT_SUCCESS && operation.required) { subscribed = true; setStatus("connecting", "Connected", "Waiting for the first heart-rate reading."); }
            finishOperation();
        }); }
        @Override public void onCharacteristicChanged(BluetoothGatt value, BluetoothGattCharacteristic characteristic, byte[] bytes) { receive(value, characteristic.getUuid(), bytes.clone()); }
        @SuppressWarnings("deprecation") @Override public void onCharacteristicChanged(BluetoothGatt value, BluetoothGattCharacteristic characteristic) { if (Build.VERSION.SDK_INT < 33 && characteristic.getValue() != null) receive(value, characteristic.getUuid(), characteristic.getValue().clone()); }
        @Override public void onCharacteristicRead(BluetoothGatt value, BluetoothGattCharacteristic characteristic, byte[] bytes, int code) { read(value, characteristic, bytes, code); }
        @SuppressWarnings("deprecation") @Override public void onCharacteristicRead(BluetoothGatt value, BluetoothGattCharacteristic characteristic, int code) { if (Build.VERSION.SDK_INT < 33) read(value, characteristic, characteristic.getValue(), code); }
    };

    private void discovered(BluetoothGatt value, int code) {
        if (value != gatt) return; handler.removeCallbacks(timeout);
        if (code != BluetoothGatt.GATT_SUCCESS) { fail("Could not inspect sensor services.", true); return; }
        BluetoothGattService heart = value.getService(HR_SERVICE); BluetoothGattCharacteristic measurement = heart == null ? null : heart.getCharacteristic(HR);
        if (measurement == null || (measurement.getProperties() & (BluetoothGattCharacteristic.PROPERTY_NOTIFY | BluetoothGattCharacteristic.PROPERTY_INDICATE)) == 0) {
            fail("This connection has no standard heart-rate stream. Enable HR Data Broadcasts and scan again.", false); return;
        }
        queue.add(new Operation(measurement, true, true));
        BluetoothGattService batteryService = value.getService(BATTERY_SERVICE); BluetoothGattCharacteristic batteryValue = batteryService == null ? null : batteryService.getCharacteristic(BATTERY);
        if (batteryValue != null) {
            if ((batteryValue.getProperties() & BluetoothGattCharacteristic.PROPERTY_READ) != 0) queue.add(new Operation(batteryValue, false, false));
            if ((batteryValue.getProperties() & BluetoothGattCharacteristic.PROPERTY_NOTIFY) != 0) queue.add(new Operation(batteryValue, true, false));
        }
        nextOperation();
    }

    @SuppressWarnings("deprecation") private void nextOperation() {
        if (gatt == null || pending != null || queue.isEmpty()) return;
        pending = queue.remove(); boolean started = false;
        try {
            if (pending.subscribe) {
                BluetoothGattDescriptor descriptor = pending.characteristic.getDescriptor(CCCD);
                if (descriptor != null && gatt.setCharacteristicNotification(pending.characteristic, true)) {
                    byte[] bytes = (pending.characteristic.getProperties() & BluetoothGattCharacteristic.PROPERTY_NOTIFY) != 0 ? BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE : BluetoothGattDescriptor.ENABLE_INDICATION_VALUE;
                    if (Build.VERSION.SDK_INT >= 33) started = gatt.writeDescriptor(descriptor, bytes) == BluetoothStatusCodes.SUCCESS;
                    else { descriptor.setValue(bytes); started = gatt.writeDescriptor(descriptor); }
                }
            } else started = gatt.readCharacteristic(pending.characteristic);
        } catch (SecurityException error) { fail("Nearby devices permission was removed.", false); return; }
        if (started) handler.postDelayed(timeout, 10_000); else if (pending.required) fail("The sensor could not enable heart-rate notifications.", false); else { pending = null; nextOperation(); }
    }

    private void finishOperation() { handler.removeCallbacks(timeout); pending = null; nextOperation(); }
    private void read(BluetoothGatt value, BluetoothGattCharacteristic characteristic, byte[] input, int code) {
        byte[] bytes = input == null ? new byte[0] : input.clone(); handler.post(() -> {
            if (value != gatt || pending == null || pending.subscribe || !pending.characteristic.getUuid().equals(characteristic.getUuid())) return;
            if (code == BluetoothGatt.GATT_SUCCESS) handle(characteristic.getUuid(), bytes); finishOperation();
        });
    }
    private void receive(BluetoothGatt value, UUID characteristic, byte[] bytes) { handler.post(() -> { if (value == gatt) handle(characteristic, bytes); }); }

    private synchronized void handle(UUID characteristic, byte[] bytes) {
        if (HR.equals(characteristic)) {
            try {
                HeartRateMeasurement measurement = HeartRateMeasurement.parse(bytes); long elapsed = SystemClock.elapsedRealtime(); long epoch = System.currentTimeMillis();
                database.append(activeSessionId, measurement, epoch, elapsed); retries = 0; lastPacketEpoch = epoch;
                setStatus("live", "Live heart rate", "Direct Bluetooth • " + deviceName);
                JSObject sample = new JSObject(); sample.put("bpm", measurement.bpm); sample.put("receivedAtEpochMs", epoch); sample.put("receivedAtElapsedMs", elapsed); sample.put("source", "ble-heart-rate");
                if (measurement.contactDetected != null) sample.put("contactDetected", measurement.contactDetected);
                if (measurement.energyKj != null) sample.put("energyKj", measurement.energyKj);
        JSArray rr = new JSArray();
        try {
            for (double value : measurement.rrMillis) rr.put(value);
        } catch (org.json.JSONException ignored) {
            // Every RR value is a finite primitive produced by HeartRateMeasurement.
        }
        sample.put("rrMillis", rr);
                if (listener != null) listener.onSample(sample);
            } catch (IllegalArgumentException ignored) { }
        } else if (BATTERY.equals(characteristic) && bytes.length == 1 && (bytes[0] & 255) <= 100) { battery = bytes[0] & 255; changed(); }
    }

    JSObject status() {
        JSObject out = new JSObject(); out.put("available", true); out.put("state", state); out.put("title", title); out.put("detail", detail); out.put("scanning", false);
        if (deviceName != null) out.put("deviceName", deviceName); if (battery != null) out.put("batteryPct", battery);
        out.put("rememberedDevice", getSharedPreferences(PREFS, MODE_PRIVATE).contains(DEVICE)); return out;
    }
    private void setStatus(String nextState, String nextTitle, String nextDetail) { state = nextState; title = nextTitle; detail = nextDetail; changed(); }
    private void changed() {
        if (listener != null) listener.onStatus(status());
        if (running && SystemClock.elapsedRealtime() - lastNotification > 5_000) { lastNotification = SystemClock.elapsedRealtime(); getSystemService(NotificationManager.class).notify(41, notification()); }
    }
    private Notification notification() {
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent open = PendingIntent.getActivity(this, 0, launch == null ? new Intent() : launch, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        PendingIntent stop = PendingIntent.getService(this, 1, new Intent(this, HeartRateService.class).setAction(STOP), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        return new Notification.Builder(this, CHANNEL).setSmallIcon(R.drawable.ic_stat_heart_rate).setContentTitle("M/ARC · " + (deviceName == null ? "Heart rate" : deviceName)).setContentText(title).setContentIntent(open).setOngoing(true).setOnlyAlertOnce(true).setVisibility(Notification.VISIBILITY_PRIVATE).addAction(new Notification.Action.Builder(null, "Disconnect", stop).build()).build();
    }
    private static String safeName(String value) { return value == null || value.trim().isEmpty() ? "Bluetooth sensor" : value; }

    @Override public void onDestroy() {
        listener = null; running = false; handler.removeCallbacksAndMessages(null); closeGatt(); unregisterReceiver(bluetoothState); database.close(); super.onDestroy();
    }
}
