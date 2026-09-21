package com.marc.watch;

import android.app.Activity;
import android.os.Build;
import java.util.LinkedHashSet;
import java.util.Set;

/** Delayed shared records are kept separate from the live BLE stream. */
public class HealthBridge {
    public static final String[] PERMISSIONS = {
        "android.permission.health.READ_STEPS", "android.permission.health.READ_ACTIVE_CALORIES_BURNED",
        "android.permission.health.READ_SLEEP", "android.permission.health.READ_OXYGEN_SATURATION"
    };
    public String steps = "—", calories = "—", sleep = "—", oxygen = "—";
    public String stepsNote = "Not connected", caloriesNote = "Not connected", sleepNote = "Not connected", oxygenNote = "Not connected";
    public String message = "Connect Health Connect to read records shared by your watch’s companion app.";
    public String source = "";
    public long checkedAt;
    public boolean busy;
    public final Set<String> sources = new LinkedHashSet<>();
    protected final Activity activity;
    protected final Runnable changed;
    HealthBridge(Activity activity,Runnable changed) { this.activity = activity; this.changed = changed; }
    public static HealthBridge create(Activity activity,Runnable changed) {
        if (Build.VERSION.SDK_INT >= 34) return new PlatformHealthBridge(activity,changed);
        HealthBridge bridge = new HealthBridge(activity,changed);
        bridge.message = "Extra health records need Android 14+ in this test app. Live Bluetooth works on Android 8+.";
        return bridge;
    }
    public void refresh() { }
    public void pause() { }
    public void request() { }
    public boolean available() { return false; }
    public void selectSource(String packageName) { }
    public String sourceLabel() { return source.isEmpty() ? "All shared sources" : source; }
}
