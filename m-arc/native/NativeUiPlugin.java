package com.mrcdrnzz.dailytracker;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * A4: crisp platform haptics (View.performHapticFeedback) instead of a raw motor buzz, and
 * keeping the screen on during a live workout. §3 of docs/UI-POLISH-PLAN.md has the constant map;
 * src/native/haptics.ts falls back to @capacitor/haptics when a call here rejects or resolves
 * {played:false} (an older API level, or a device missing a constant).
 */
@CapacitorPlugin(name = "NativeUi")
public class NativeUiPlugin extends Plugin {

    @PluginMethod
    public void haptic(PluginCall call) {
        String type = call.getString("type");
        Boolean on = call.getBoolean("on");
        int constant = type == null ? -1 : map(type, on);
        getActivity().runOnUiThread(() -> {
            if (constant >= 0) {
                View v = getBridge().getWebView();
                if (v != null) v.performHapticFeedback(constant);
            }
            JSObject ret = new JSObject();
            ret.put("played", constant >= 0);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void keepAwake(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("on"));
        getActivity().runOnUiThread(() -> {
            if (on) {
                getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } else {
                getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
            call.resolve();
        });
    }

    /** success/alert: a short VibrationEffect.Composition, crisper than a single impact. */
    @PluginMethod
    public void peak(PluginCall call) {
        String type = call.getString("type");
        getActivity().runOnUiThread(() -> {
            JSObject ret = new JSObject();
            ret.put("played", tryComposition(type));
            call.resolve(ret);
        });
    }

    /** §3: tick=CLOCK_TICK; confirm=CONFIRM(30+)/VIRTUAL_KEY; reject=REJECT(30+)/LONG_PRESS;
     * toggle=TOGGLE_ON/OFF(34+)/CLOCK_TICK; longPress=LONG_PRESS; dragStart=DRAG_START(34+)/LONG_PRESS;
     * drop=GESTURE_END(30+)/none; threshold=GESTURE_THRESHOLD_ACTIVATE/DEACTIVATE(34+)/CLOCK_TICK. */
    private int map(String type, Boolean on) {
        int sdk = Build.VERSION.SDK_INT;
        switch (type) {
            case "tick":
                return HapticFeedbackConstants.CLOCK_TICK;
            case "confirm":
                return sdk >= Build.VERSION_CODES.R ? HapticFeedbackConstants.CONFIRM : HapticFeedbackConstants.VIRTUAL_KEY;
            case "reject":
                return sdk >= Build.VERSION_CODES.R ? HapticFeedbackConstants.REJECT : HapticFeedbackConstants.LONG_PRESS;
            case "toggle":
                if (sdk >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    return Boolean.TRUE.equals(on) ? HapticFeedbackConstants.TOGGLE_ON : HapticFeedbackConstants.TOGGLE_OFF;
                }
                return HapticFeedbackConstants.CLOCK_TICK;
            case "longPress":
                return HapticFeedbackConstants.LONG_PRESS;
            case "dragStart":
                return sdk >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE ? HapticFeedbackConstants.DRAG_START : HapticFeedbackConstants.LONG_PRESS;
            case "drop":
                return sdk >= Build.VERSION_CODES.R ? HapticFeedbackConstants.GESTURE_END : -1;
            case "threshold":
                if (sdk >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    return Boolean.TRUE.equals(on) ? HapticFeedbackConstants.GESTURE_THRESHOLD_ACTIVATE : HapticFeedbackConstants.GESTURE_THRESHOLD_DEACTIVATE;
                }
                return HapticFeedbackConstants.CLOCK_TICK;
            default:
                return -1;
        }
    }

    private boolean tryComposition(String type) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return false;
            Vibrator vibrator = getVibrator();
            if (vibrator == null) return false;
            boolean alert = "alert".equals(type);
            int primitive = alert ? VibrationEffect.Composition.PRIMITIVE_THUD : VibrationEffect.Composition.PRIMITIVE_CLICK;
            if (!vibrator.areAllPrimitivesSupported(primitive)) return false;
            VibrationEffect.Composition c = VibrationEffect.startComposition();
            if (alert) {
                c.addPrimitive(VibrationEffect.Composition.PRIMITIVE_THUD);
                c.addPrimitive(VibrationEffect.Composition.PRIMITIVE_THUD, 1f, 150);
            } else {
                c.addPrimitive(VibrationEffect.Composition.PRIMITIVE_CLICK);
                c.addPrimitive(VibrationEffect.Composition.PRIMITIVE_CLICK, 0.7f, 60);
            }
            vibrator.vibrate(c.compose());
            return true;
        } catch (Throwable t) {
            return false; // unverified API-level detail (docs/UI-POLISH-PLAN.md §A4 step 3): fall back to Capacitor
        }
    }

    private Vibrator getVibrator() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager vm = (VibratorManager) getContext().getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            return vm == null ? null : vm.getDefaultVibrator();
        }
        return (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
    }
}
