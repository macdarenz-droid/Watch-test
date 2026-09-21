package com.marc.watch;

import android.app.Activity;
import android.os.Bundle;
import android.widget.*;

public final class PrivacyActivity extends Activity {
    public static final String POLICY = "Watch Test reads the Bluetooth heart-rate stream you choose and, with your permission, steps, active calories, sleep sessions and blood oxygen shared through Health Connect.\n\n"
        + "Readings stay in this app’s memory. There is no account, internet permission, advertising, analytics, cloud upload or Health Connect write access. Closing the process clears the session. Only your selected health source is saved as a preference.\n\n"
        + "The connection runs with a visible foreground-service notification until you disconnect. Health Connect is read only while the dashboard is visible. You can revoke access in Android settings.\n\n"
        + "Export diagnostics saves connection status, device model/name and service identifiers to a location you choose. It excludes heart-rate values, health records and Bluetooth addresses. You decide whether to share that file.\n\n"
        + "Shared Health Connect records can include phone/app data and may arrive later than the watch. Choose the source app to narrow them. The sleep value is the latest recorded session’s duration, including any awake time within that session.";
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        ScrollView scroll = new ScrollView(this); TextView text = new TextView(this);
        text.setText("Privacy & data\n\n" + POLICY); text.setTextSize(17); text.setTextColor(0xFFEAF0ED);
        text.setPadding(28,60,28,48); scroll.addView(text); scroll.setBackgroundColor(0xFF0B1010); setContentView(scroll);
        scroll.setOnApplyWindowInsetsListener((v,insets) -> { v.setPadding(0,insets.getSystemWindowInsetTop(),0,insets.getSystemWindowInsetBottom()); return insets; });
    }
}
