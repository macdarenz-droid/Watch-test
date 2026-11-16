package com.mrcdrnzz.dailytracker;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(HealthConnectNativePlugin.class);
        registerPlugin(HeartRateNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
