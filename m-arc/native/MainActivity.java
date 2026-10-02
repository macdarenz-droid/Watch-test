package com.mrcdrnzz.dailytracker;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.mrcdrnzz.dailytracker.watch.WatchBridgePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(HealthConnectNativePlugin.class);
        registerPlugin(WatchBridgePlugin.class);
        registerPlugin(NativeUiPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
