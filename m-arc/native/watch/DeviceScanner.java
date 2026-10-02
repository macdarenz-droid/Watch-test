package com.mrcdrnzz.dailytracker.watch;

import android.annotation.SuppressLint;
import android.bluetooth.*;
import android.bluetooth.le.*;
import android.os.*;
import java.util.*;

@SuppressLint("MissingPermission")
final class DeviceScanner {
    static final class Found {
        final BluetoothDevice device;
        String name;
        int rssi;
        boolean advertisesHeartRate, paired;
        Found(BluetoothDevice device) { this.device=device; }
    }
    final List<Found> devices = new ArrayList<>();
    /** Read from the plugin thread, written on the main looper (PL-08). */
    volatile boolean scanning;
    String message="";
    private final Handler handler=new Handler(Looper.getMainLooper());
    private final BluetoothAdapter adapter;
    private final Runnable changed;
    private BluetoothLeScanner scanner;
    private final Map<String,Found> byAddress=new LinkedHashMap<>();
    DeviceScanner(BluetoothAdapter adapter,Runnable changed) {this.adapter=adapter;this.changed=changed;}
    private final ScanCallback callback=new ScanCallback() {
        @Override public void onScanResult(int type,ScanResult result) { handler.post(()->add(result)); }
        @Override public void onBatchScanResults(List<ScanResult> list) { handler.post(()->{for(ScanResult r:list)add(r);}); }
        @Override public void onScanFailed(int code) { handler.post(()->{
            stop();message="Scan failed ("+code+"). Wait a few seconds, then try again.";changed.run();
        }); }
    };
    void start(long timeoutMs) {
        stop();devices.clear();byAddress.clear();
        try {
            for(BluetoothDevice device:adapter.getBondedDevices()) {
                if(device.getType()!=BluetoothDevice.DEVICE_TYPE_CLASSIC) {
                    Found found=new Found(device);found.name=name(device.getName());found.paired=true;
                    byAddress.put(device.getAddress(),found);
                }
            }
            scanner=adapter.getBluetoothLeScanner();
            if(scanner==null) {message="Bluetooth is off or unavailable.";changed.run();return;}
            scanning=true;message="Scanning. Select your watch below.";
            // Unfiltered discovery also finds devices that omit service UUIDs from advertisements.
            scanner.startScan(null,new ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build(),callback);
            rebuild();handler.postDelayed(()->{stop();message="Scan finished. Select your watch, or scan again.";changed.run();},timeoutMs);
        } catch(SecurityException e) {stop();message="Nearby devices permission is required.";changed.run();}
          catch(RuntimeException e) {stop();message="Bluetooth scan unavailable. Toggle Bluetooth and retry.";changed.run();}
    }
    private void add(ScanResult result) {
        if(!scanning)return;
        try {
            BluetoothDevice device=result.getDevice();String key=device.getAddress();
            Found found=byAddress.get(key);
            if(found==null) {if(byAddress.size()>=80)return;found=new Found(device);byAddress.put(key,found);}
            ScanRecord record=result.getScanRecord();String name=record==null?null:record.getDeviceName();
            if(name==null)name=device.getName();found.name=name(name);found.rssi=result.getRssi();
            if(record!=null && record.getServiceUuids()!=null)found.advertisesHeartRate|=record.getServiceUuids().contains(new ParcelUuid(WatchService.HR_SERVICE));
            rebuild();
        } catch(SecurityException e) {stop();message="Permission removed. Allow Nearby devices and scan again.";changed.run();}
    }
    private static String name(String value) {return value==null||value.trim().isEmpty()?"Unnamed Bluetooth device":value;}
    private void rebuild() {
        devices.clear();devices.addAll(byAddress.values());
        devices.sort(Comparator.comparing((Found d)->!d.advertisesHeartRate).thenComparing(d->!d.paired).thenComparing(d->d.name));
        changed.run();
    }
    void stop() {
        handler.removeCallbacksAndMessages(null);
        if(scanner!=null && scanning)try{scanner.stopScan(callback);}catch(RuntimeException ignored){}
        scanning=false;
    }
}
