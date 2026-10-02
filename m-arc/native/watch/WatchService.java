package com.mrcdrnzz.dailytracker.watch;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.*;
import android.bluetooth.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.os.*;
import com.mrcdrnzz.dailytracker.R;
import com.mrcdrnzz.dailytracker.watch.core.HeartRateMeasurement;
import com.mrcdrnzz.dailytracker.watch.core.LiveSession;
import java.util.*;

/** A foreground BLE adapter; the plugin is only a viewer. All state runs on the main thread. Ported from Watch-test. */
@SuppressLint("MissingPermission")
public final class WatchService extends Service {
    public static final UUID HR_SERVICE = uuid(0x180D), HR = uuid(0x2A37);
    private static final UUID BATTERY_SERVICE = uuid(0x180F), BATTERY = uuid(0x2A19), CCCD = uuid(0x2902);
    public static final String STOP = "com.mrcdrnzz.dailytracker.watch.STOP";
    public LiveSession session = new LiveSession();
    /** Why the last connect could not start the foreground service (PL-15); null when it did. */
    public volatile String pausedReason;
    public String status = "Ready to connect", detail = "Turn on HR Data Broadcasts on your watch.";
    public String deviceName = "No watch connected";
    public boolean subscribed, running;
    public Integer battery;
    public final List<String> services = new ArrayList<>();
    private final ArrayDeque<String> logs = new ArrayDeque<>();
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final IBinder binder = new LocalBinder();
    private BluetoothGatt gatt;
    private BluetoothDevice device;
    private Runnable listener;
    private int retries;
    private long lastNotification;
    private final ArrayDeque<Operation> queue = new ArrayDeque<>();
    private Operation pending;
    private record Operation(BluetoothGattCharacteristic characteristic, boolean subscribe, boolean required) {}
    public final class LocalBinder extends Binder { public WatchService get() { return WatchService.this; } }
    public static UUID uuid(int id) { return UUID.fromString(String.format(Locale.ROOT,"0000%04x-0000-1000-8000-00805f9b34fb",id)); }

    private final Runnable timeout = () -> fail("Watch did not respond. Keep HR broadcasting enabled.", true);
    private final Runnable retry = this::open;
    private final BroadcastReceiver bluetoothState = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) {
            if (intent.getIntExtra(BluetoothAdapter.EXTRA_STATE,-1) == BluetoothAdapter.STATE_OFF && running)
                fail("Bluetooth is off. Turn it on, then connect again.", false);
        }
    };
    @Override public void onCreate() {
        super.onCreate();
        NotificationChannel channel = new NotificationChannel("watch_sync", "Watch connection", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Keeps the watch connected while the screen is off");
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(bluetoothState,new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED),Context.RECEIVER_EXPORTED);
        else registerReceiver(bluetoothState,new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED));
    }
    @Override public IBinder onBind(Intent intent) { return binder; }
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && STOP.equals(intent.getAction())) disconnect();
        return START_NOT_STICKY;
    }
    public void setListener(Runnable listener) { this.listener = listener; }
    public boolean permitted() {
        return Build.VERSION.SDK_INT < 31 || checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
    }
    public void connect(BluetoothDevice selected) {
        disconnect();
        if (!permitted()) { setStatus("Permission needed", "Allow Nearby devices to connect."); return; }
        session = new LiveSession(); battery = null; services.clear();
        device = selected; retries = 0;
        String name = selected.getName(); deviceName = name == null || name.trim().isEmpty() ? "Bluetooth sensor" : name;
        pausedReason = null;
        running = true;
        try {
            startService(new Intent(this, WatchService.class));
            if (Build.VERSION.SDK_INT >= 29) startForeground(1,notification(),ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE);
            else startForeground(1,notification());
        } catch (SecurityException | IllegalStateException e) {
            // IllegalStateException is the API 26-safe superclass of ForegroundServiceStartNotAllowedException (API 31+).
            running = false; stopSelf();
            pausedReason = e instanceof SecurityException ? "Nearby devices permission is needed to keep the watch connected." : "Android did not allow the watch connection to start from the background. Open M/ARC and try again.";
            setStatus("Paused", pausedReason);
            return;
        } catch (RuntimeException e) { fail("Cannot start connection: " + e.getClass().getSimpleName(), false); return; }
        open();
    }
    private void open() {
        if (!running || device == null) return;
        if (!permitted()) { fail("Nearby devices permission was removed.", false); return; }
        closeGatt();
        setStatus(retries == 0 ? "Connecting" : "Reconnecting " + retries + "/3", "Keep the watch nearby and broadcasting.");
        try {
            gatt = device.connectGatt(this, false, callback, BluetoothDevice.TRANSPORT_LE);
            if (gatt == null) { fail("Android could not open the Bluetooth connection.", true); return; }
            handler.postDelayed(timeout, 20_000);
        } catch (RuntimeException e) { fail("Connection error: " + e.getClass().getSimpleName(), true); }
    }
    public void disconnect() {
        running = false; handler.removeCallbacks(retry); closeGatt();
        stopForeground(STOP_FOREGROUND_REMOVE); stopSelf();
        setStatus("Disconnected", "Choose a broadcasting watch to start a new session.");
    }
    private void closeGatt() {
        handler.removeCallbacks(timeout); queue.clear(); pending = null; subscribed = false;
        BluetoothGatt old = gatt; gatt = null;
        if (old != null) {
            try { if (permitted()) old.disconnect(); } catch (RuntimeException ignored) { }
            try { old.close(); } catch (RuntimeException ignored) { }
        }
    }
    private void fail(String message, boolean reconnect) {
        log(message); closeGatt();
        if (running && reconnect && permitted() && retries < 3) {
            retries++;
            setStatus("Connection interrupted", message + " Retrying " + retries + "/3…");
            handler.removeCallbacks(retry); handler.postDelayed(retry, 2_000L * retries);
        } else {
            running = false; handler.removeCallbacks(retry);
            setStatus("Connection stopped", message);
            stopForeground(STOP_FOREGROUND_REMOVE); stopSelf();
        }
    }
    private final BluetoothGattCallback callback = new BluetoothGattCallback() {
        @Override public void onConnectionStateChange(BluetoothGatt g, int code, int state) {
            handler.post(() -> {
                if (g != gatt) return;
                handler.removeCallbacks(timeout);
                if (code == BluetoothGatt.GATT_SUCCESS && state == BluetoothProfile.STATE_CONNECTED) {
                    setStatus("Checking watch", "Looking for a live heart-rate service.");
                    try {
                        if (!g.discoverServices()) { fail("Service discovery could not start.",true); return; }
                        handler.postDelayed(timeout,15_000);
                    } catch (SecurityException e) { fail("Nearby devices permission was removed.",false); }
                } else if (state == BluetoothProfile.STATE_DISCONNECTED || code != BluetoothGatt.GATT_SUCCESS)
                    fail("Watch disconnected (Bluetooth status " + code + ").",true);
            });
        }
        @Override public void onServicesDiscovered(BluetoothGatt g, int code) { handler.post(() -> discovered(g, code)); }
        @Override public void onDescriptorWrite(BluetoothGatt g, BluetoothGattDescriptor d, int code) {
            handler.post(() -> {
                if (g != gatt || pending == null || !pending.subscribe || !d.getCharacteristic().getUuid().equals(pending.characteristic.getUuid())) return;
                Operation op = pending;
                if (code != BluetoothGatt.GATT_SUCCESS && op.required) { fail("Watch refused the heart-rate subscription (" + code + ").",false); return; }
                if (code == BluetoothGatt.GATT_SUCCESS && op.required) {
                    subscribed = true; setStatus("Connected", "Waiting for the watch's first heart-rate reading.");
                }
                if (code != BluetoothGatt.GATT_SUCCESS) log("Optional subscription unavailable: " + code);
                finishOperation();
            });
        }
        @Override public void onCharacteristicChanged(BluetoothGatt g, BluetoothGattCharacteristic c, byte[] bytes) { receive(g,c.getUuid(),bytes.clone()); }
        @SuppressWarnings("deprecation")
        @Override public void onCharacteristicChanged(BluetoothGatt g, BluetoothGattCharacteristic c) {
            if (Build.VERSION.SDK_INT < 33 && c.getValue() != null) receive(g,c.getUuid(),c.getValue().clone());
        }
        @Override public void onCharacteristicRead(BluetoothGatt g, BluetoothGattCharacteristic c, byte[] bytes, int code) { read(g,c,bytes,code); }
        @SuppressWarnings("deprecation")
        @Override public void onCharacteristicRead(BluetoothGatt g, BluetoothGattCharacteristic c, int code) {
            if (Build.VERSION.SDK_INT < 33) read(g,c,c.getValue(),code);
        }
    };
    private void discovered(BluetoothGatt g, int code) {
        if (g != gatt) return;
        handler.removeCallbacks(timeout);
        if (code != BluetoothGatt.GATT_SUCCESS) { fail("Could not inspect watch services (" + code + ").",true); return; }
        services.clear();
        for (BluetoothGattService s : g.getServices()) {
            services.add(s.getUuid().toString());
            for (BluetoothGattCharacteristic c : s.getCharacteristics())
                services.add("  " + c.getUuid() + " properties=" + c.getProperties());
        }
        BluetoothGattService hr = g.getService(HR_SERVICE);
        BluetoothGattCharacteristic measurement = hr == null ? null : hr.getCharacteristic(HR);
        if (measurement == null || (measurement.getProperties() & (BluetoothGattCharacteristic.PROPERTY_NOTIFY | BluetoothGattCharacteristic.PROPERTY_INDICATE)) == 0) {
            fail("This connection has no standard heart-rate stream. On Huawei, enable Settings → HR Data Broadcasts, then scan again.",false);
            return;
        }
        queue.add(new Operation(measurement, true, true));
        BluetoothGattService bs = g.getService(BATTERY_SERVICE);
        BluetoothGattCharacteristic bc = bs == null ? null : bs.getCharacteristic(BATTERY);
        if (bc != null) {
            if ((bc.getProperties() & BluetoothGattCharacteristic.PROPERTY_READ) != 0) queue.add(new Operation(bc,false,false));
            if ((bc.getProperties() & BluetoothGattCharacteristic.PROPERTY_NOTIFY) != 0) queue.add(new Operation(bc,true,false));
        }
        nextOperation();
    }
    @SuppressWarnings("deprecation")
    private void nextOperation() {
        if (gatt == null || pending != null || queue.isEmpty()) return;
        pending = queue.remove();
        boolean started = false;
        try {
            if (pending.subscribe) {
                BluetoothGattDescriptor d = pending.characteristic.getDescriptor(CCCD);
                if (d != null && gatt.setCharacteristicNotification(pending.characteristic,true)) {
                    byte[] value = (pending.characteristic.getProperties() & BluetoothGattCharacteristic.PROPERTY_NOTIFY) != 0
                        ? BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE : BluetoothGattDescriptor.ENABLE_INDICATION_VALUE;
                    if (Build.VERSION.SDK_INT >= 33) started = gatt.writeDescriptor(d,value) == BluetoothStatusCodes.SUCCESS;
                    else { d.setValue(value); started = gatt.writeDescriptor(d); }
                }
            } else started = gatt.readCharacteristic(pending.characteristic);
        } catch (SecurityException e) { fail("Nearby devices permission was removed.",false); return; }
        if (started) handler.postDelayed(timeout,10_000);
        else if (pending.required) fail("Watch could not enable heart-rate notifications.",false);
        else { log("Optional battery operation unavailable"); pending = null; nextOperation(); }
    }
    private void finishOperation() { handler.removeCallbacks(timeout); pending = null; nextOperation(); }
    private void read(BluetoothGatt g, BluetoothGattCharacteristic c, byte[] value, int code) {
        byte[] bytes = value == null ? new byte[0] : value.clone();
        handler.post(() -> {
            if (g != gatt || pending == null || pending.subscribe || !pending.characteristic.getUuid().equals(c.getUuid())) return;
            if (code == BluetoothGatt.GATT_SUCCESS) handle(c.getUuid(),bytes);
            else log("Battery read unavailable (" + code + ")");
            finishOperation();
        });
    }
    private void receive(BluetoothGatt g, UUID characteristic, byte[] bytes) {
        handler.post(() -> { if (g == gatt) handle(characteristic,bytes); });
    }
    private void handle(UUID characteristic, byte[] value) {
        if (HR.equals(characteristic)) {
            try {
                HeartRateMeasurement m = HeartRateMeasurement.parse(value);
                session.accept(m,SystemClock.elapsedRealtime(),System.currentTimeMillis()); retries = 0;
                detail = "Direct Bluetooth • " + deviceName;
                changed();
            } catch (IllegalArgumentException e) { log("Ignored malformed HR packet: " + e.getMessage()); }
        } else if (BATTERY.equals(characteristic) && value.length == 1 && (value[0] & 255) <= 100) {
            battery = value[0] & 255; changed();
        }
    }
    private void setStatus(String title, String text) { status = title; detail = text; log(title); changed(); }
    private void changed() {
        if (listener != null) listener.run();
        if (running && SystemClock.elapsedRealtime() - lastNotification > 5_000) {
            lastNotification = SystemClock.elapsedRealtime();
            getSystemService(NotificationManager.class).notify(1,notification());
        }
    }
    private Notification notification() {
        PendingIntent open = PendingIntent.getActivity(this,0,new Intent(this,com.mrcdrnzz.dailytracker.MainActivity.class),PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        PendingIntent stop = PendingIntent.getService(this,1,new Intent(this,WatchService.class).setAction(STOP),PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        return new Notification.Builder(this,"watch_sync").setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("M/ARC · " + deviceName).setContentText(status)
            .setContentIntent(open).setOngoing(true).setOnlyAlertOnce(true).setVisibility(Notification.VISIBILITY_PRIVATE)
            .addAction(new Notification.Action.Builder(null,"Disconnect",stop).build()).build();
    }
    private void log(String message) {
        logs.addLast(java.time.Instant.now() + " " + message);
        while (logs.size() > 120) logs.removeFirst();
    }
    /** No Bluetooth addresses, heart-rate values or Health Connect records included, per the app's privacy stance. */
    public String diagnostics() {
        return "Status: " + status + "\nDetails: " + detail + "\nPackets received: " + session.packets
            + "\nLast packet interval (s): " + session.lastIntervalSeconds
            + "\n\nDiscovered GATT services and characteristics:\n" + String.join("\n",services)
            + "\n\nConnection log:\n" + String.join("\n",logs)
            + "\n\nNo Bluetooth addresses, heart-rate values or Health Connect records included.\n";
    }
    @Override public void onDestroy() {
        listener = null; running = false; handler.removeCallbacksAndMessages(null); closeGatt();
        unregisterReceiver(bluetoothState); super.onDestroy();
    }
}
