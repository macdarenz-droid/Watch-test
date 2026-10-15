package com.marc.udidtool;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;
import android.provider.Settings;
import android.view.View;
import android.view.WindowInsets;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import com.marc.watch.link.Frame;
import com.marc.watch.link.Hex;
import com.marc.watch.link.UdidProbe;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * One screen: read the paired Huawei watch's UDID over its Huawei Health link (Bluetooth Classic RFCOMM),
 * then copy, save or share it with a log of every frame. Sends three read-only setup requests (see UdidProbe).
 */
@SuppressLint("MissingPermission")
public final class MainActivity extends Activity {
    private static final String VERSION = "0.1.0";
    private static final UUID HUAWEI_LINK = UUID.fromString("82FF3820-8411-400C-B85A-55BDB32CF060");
    private static final String HEALTH_PACKAGE = "com.huawei.health";
    private static final int REQUEST_PERMISSION = 1, REQUEST_SAVE = 2, REQUEST_ENABLE = 3;
    private static final long CONNECT_TIMEOUT_MS = 15_000;
    private static final int BG = 0xFF0B1010, SURFACE = 0xFF141D1A, BORDER = 0xFF293A32, TEXT = 0xFFEAF2ED, MUTED = 0xFF9AADA3, ACCENT = 0xFFAEF8CF;

    private final Handler ui = new Handler(Looper.getMainLooper());
    private final StringBuilder log = new StringBuilder();
    private TextView status, udidView, logView;
    private Button read, copy, save, share;
    private volatile boolean running;
    private volatile BluetoothSocket socket;
    private String udid, watchName;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(BG);
        scroll.setOnApplyWindowInsetsListener((v, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) { android.graphics.Insets i = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout()); v.setPadding(i.left, i.top, i.right, i.bottom); }
            else v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        LinearLayout body = column();
        body.setPadding(dp(22), dp(22), dp(22), dp(32));
        scroll.addView(body);
        setContentView(scroll);

        label(body, "M / ARC     ·     WATCH UDID", 11, ACCENT, true);
        margins(label(body, "Watch UDID", 30, TEXT, true), 0, 12, 0, 6);
        status = label(body, "Pair the watch with Huawei Health, then force stop Huawei Health and tap Read UDID.", 15, MUTED, false);

        button(body, "Force stop Huawei Health", false, this::openHealthSettings);
        read = button(body, "Read UDID", true, this::readUdid);

        LinearLayout card = column();
        card.setPadding(dp(16), dp(16), dp(16), dp(16));
        card.setBackground(shape(SURFACE, 16));
        body.addView(card);
        margins(card, 0, 20, 0, 0);
        label(card, "UDID", 11, MUTED, true);
        udidView = label(card, "—", 17, TEXT, true);
        udidView.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        udidView.setTextIsSelectable(true);
        margins(udidView, 0, 8, 0, 4);
        copy = button(card, "Copy UDID", false, this::copyUdid);
        save = button(card, "Save file", false, this::saveFile);
        share = button(card, "Share", false, this::shareReport);
        setResultButtons(false);

        margins(label(body, "LOG", 11, MUTED, true), 0, 20, 0, 6);
        logView = label(body, "", 11, MUTED, false);
        logView.setTypeface(Typeface.MONOSPACE);
        logView.setTextIsSelectable(true);
    }

    @Override protected void onDestroy() { closeSocket(); super.onDestroy(); }

    private void readUdid() {
        if (running) return;
        if (Build.VERSION.SDK_INT >= 31 && checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[] {Manifest.permission.BLUETOOTH_CONNECT}, REQUEST_PERMISSION);
            return;
        }
        BluetoothManager manager = getSystemService(BluetoothManager.class);
        BluetoothAdapter adapter = manager == null ? null : manager.getAdapter();
        if (adapter == null) { status.setText("This phone has no Bluetooth."); return; }
        if (!adapter.isEnabled()) { startActivityForResult(new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE), REQUEST_ENABLE); return; }
        List<BluetoothDevice> watches = new ArrayList<>();
        List<String> others = new ArrayList<>();
        for (BluetoothDevice d : adapter.getBondedDevices()) {
            String name = d.getName() == null ? "" : d.getName();
            if (name.toLowerCase(Locale.ROOT).startsWith("huawei watch")) watches.add(d); else others.add(name);
        }
        if (watches.isEmpty()) {
            status.setText("No paired Huawei watch in this phone's Bluetooth list. Pair it in Huawei Health first.");
            clearLog();
            line("Paired devices: " + (others.isEmpty() ? "none" : String.join(", ", others)));
            return;
        }
        if (watches.size() == 1) { start(adapter, watches.get(0)); return; }
        String[] names = new String[watches.size()];
        for (int i = 0; i < names.length; i++) names[i] = watches.get(i).getName();
        new AlertDialog.Builder(this).setTitle("Choose the watch").setItems(names, (dialog, which) -> start(adapter, watches.get(which))).show();
    }

    private void start(BluetoothAdapter adapter, BluetoothDevice device) {
        running = true; udid = null; watchName = device.getName();
        read.setEnabled(false); setResultButtons(false);
        udidView.setText("—");
        status.setText("Connecting to " + watchName + "…");
        clearLog();
        line("Watch UDID " + VERSION + " · " + new SimpleDateFormat("yyyy-MM-dd HH:mm:ss Z", Locale.ROOT).format(new Date()));
        line("Phone: " + Build.MANUFACTURER + " " + Build.MODEL + ", Android " + Build.VERSION.RELEASE + " (API " + Build.VERSION.SDK_INT + ")");
        line("Watch: " + watchName + ", type " + device.getType() + ", bond " + device.getBondState() + ", offers Huawei link: " + offersHuaweiLink(device));
        new Thread(() -> probe(adapter, device), "udid-probe").start();
    }

    private void probe(BluetoothAdapter adapter, BluetoothDevice device) {
        if (Build.VERSION.SDK_INT < 31) adapter.cancelDiscovery();
        BluetoothSocket s = connect(device, true);
        if (s == null) s = connect(device, false);
        if (s == null) {
            done(null, "Could not open the watch link. Force stop Huawei Health, then tap Read UDID again.");
            return;
        }
        String failure;
        try {
            failure = exchange(s);
        } catch (IOException e) {
            failure = "The link closed during the exchange (" + e.getMessage() + ").";
        } finally {
            closeSocket();
        }
        done(failure == null ? udid : null, failure);
    }

    private BluetoothSocket connect(BluetoothDevice device, boolean secure) {
        String kind = secure ? "secure" : "insecure";
        try {
            BluetoothSocket s = secure ? device.createRfcommSocketToServiceRecord(HUAWEI_LINK) : device.createInsecureRfcommSocketToServiceRecord(HUAWEI_LINK);
            socket = s;
            Runnable watchdog = this::closeSocket;
            ui.postDelayed(watchdog, CONNECT_TIMEOUT_MS);
            try { s.connect(); } finally { ui.removeCallbacks(watchdog); }
            line("Connected (" + kind + " RFCOMM)");
            return s;
        } catch (IOException e) {
            line("Connect failed (" + kind + " RFCOMM): " + e.getMessage());
            closeSocket();
            return null;
        }
    }

    /** @return null on success (the UDID is then in {@link #udid}), otherwise why it failed. */
    private String exchange(BluetoothSocket s) throws IOException {
        InputStream in = s.getInputStream();
        OutputStream out = s.getOutputStream();
        UdidProbe probe = new UdidProbe(randomPhoneId(), Build.MODEL);
        Frame.Decoder decoder = new Frame.Decoder();
        int logged = 0;
        write(out, probe.start());
        long deadline = System.currentTimeMillis() + probe.timeoutMs();
        byte[] buffer = new byte[2048];
        while (probe.step() != UdidProbe.Step.DONE && probe.step() != UdidProbe.Step.FAILED) {
            byte[] next = null;
            if (in.available() > 0) {
                int n = in.read(buffer);
                if (n < 0) return "The watch closed the link.";
                line("RX " + Hex.of(buffer, 0, n));
                for (Frame frame : decoder.push(buffer, n)) {
                    byte[] request = probe.onFrame(frame);
                    if (request != null) next = request;
                }
                for (String note : decoder.notes) line(note);
                decoder.notes.clear();
            } else if (System.currentTimeMillis() > deadline) {
                next = probe.onTimeout();
            } else {
                try { Thread.sleep(20); } catch (InterruptedException e) { Thread.currentThread().interrupt(); return "Stopped."; }
            }
            logged = drain(probe.log, logged);
            if (next != null) { write(out, next); deadline = System.currentTimeMillis() + probe.timeoutMs(); }
        }
        drain(probe.log, logged);
        if (probe.step() == UdidProbe.Step.DONE) { udid = probe.udid(); return null; }
        return probe.failure();
    }

    private void write(OutputStream out, byte[] frame) throws IOException { out.write(frame); out.flush(); }

    private int drain(List<String> lines, int from) {
        for (int i = from; i < lines.size(); i++) line(lines.get(i));
        return lines.size();
    }

    private void done(String found, String failure) {
        line(found != null ? "Result: UDID " + found : "Result: " + failure);
        line("Open Huawei Health again so the watch reconnects.");
        ui.post(() -> {
            running = false;
            read.setEnabled(true);
            if (found != null) {
                udidView.setText(found);
                status.setText("Done. Open Huawei Health again so the watch reconnects.");
            } else {
                status.setText(failure);
            }
            setResultButtons(true);
            copy.setEnabled(found != null);
        });
    }

    private boolean offersHuaweiLink(BluetoothDevice device) {
        ParcelUuid[] uuids = device.getUuids();
        if (uuids == null) return false;
        for (ParcelUuid u : uuids) if (HUAWEI_LINK.equals(u.getUuid())) return true;
        return false;
    }

    private void openHealthSettings() {
        try {
            startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", HEALTH_PACKAGE, null)));
        } catch (android.content.ActivityNotFoundException e) {
            status.setText("Huawei Health is not installed on this phone.");
        }
    }

    private void copyUdid() {
        if (udid == null) return;
        ClipboardManager clipboard = getSystemService(ClipboardManager.class);
        if (clipboard != null) clipboard.setPrimaryClip(ClipData.newPlainText("UDID", udid));
        status.setText("UDID copied.");
    }

    private void saveFile() {
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("text/plain")
                .putExtra(Intent.EXTRA_TITLE, "watch-udid.txt");
        startActivityForResult(intent, REQUEST_SAVE);
    }

    private void shareReport() {
        Intent send = new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_SUBJECT, "Watch UDID").putExtra(Intent.EXTRA_TEXT, report());
        startActivity(Intent.createChooser(send, "Share"));
    }

    private String report() {
        synchronized (log) { return "UDID: " + (udid != null ? udid : "not found") + "\nWatch: " + watchName + "\n\n" + log; }
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == REQUEST_ENABLE && result == RESULT_OK) readUdid();
        if (request == REQUEST_SAVE && result == RESULT_OK && data != null && data.getData() != null) {
            try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                if (out == null) throw new IOException("no stream");
                out.write(report().getBytes(StandardCharsets.UTF_8));
                status.setText("File saved.");
            } catch (IOException e) {
                status.setText("Could not save the file: " + e.getMessage());
            }
        }
    }

    @Override public void onRequestPermissionsResult(int request, String[] names, int[] grants) {
        super.onRequestPermissionsResult(request, names, grants);
        if (request != REQUEST_PERMISSION) return;
        if (grants.length > 0 && grants[0] == PackageManager.PERMISSION_GRANTED) readUdid();
        else status.setText("Allow Nearby devices so the app can talk to the watch.");
    }

    private void closeSocket() {
        BluetoothSocket s = socket;
        socket = null;
        if (s != null) try { s.close(); } catch (IOException ignored) { }
    }

    private static String randomPhoneId() {
        byte[] b = new byte[16];
        new SecureRandom().nextBytes(b);
        return Hex.of(b);
    }

    private void clearLog() { synchronized (log) { log.setLength(0); } logView.setText(""); }

    private void line(String text) {
        String all;
        synchronized (log) { log.append(text).append('\n'); all = log.toString(); }
        ui.post(() -> logView.setText(all));
    }

    private void setResultButtons(boolean visible) {
        int v = visible ? View.VISIBLE : View.GONE;
        copy.setVisibility(v); save.setVisibility(v); share.setVisibility(v);
    }

    private int dp(float value) { return (int) (value * getResources().getDisplayMetrics().density + 0.5f); }
    private LinearLayout column() { LinearLayout v = new LinearLayout(this); v.setOrientation(LinearLayout.VERTICAL); v.setLayoutParams(new LinearLayout.LayoutParams(-1, -2)); return v; }
    private TextView label(LinearLayout parent, String value, int size, int color, boolean bold) {
        TextView v = new TextView(this);
        v.setText(value); v.setTextSize(size); v.setTextColor(color);
        v.setTypeface(Typeface.create(bold ? "sans-serif-medium" : "sans-serif", Typeface.NORMAL));
        v.setLayoutParams(new LinearLayout.LayoutParams(-1, -2));
        parent.addView(v);
        return v;
    }
    private Button button(LinearLayout parent, String value, boolean primary, Runnable action) {
        Button b = new Button(this);
        b.setText(value); b.setTextSize(14); b.setAllCaps(false); b.setTextColor(primary ? BG : TEXT);
        b.setBackgroundTintList(null); b.setBackground(shape(primary ? ACCENT : 0xFF1C2923, 12));
        b.setMinHeight(dp(48)); b.setLayoutParams(new LinearLayout.LayoutParams(-1, -2));
        parent.addView(b);
        margins(b, 0, 10, 0, 0);
        b.setOnClickListener(v -> action.run());
        return b;
    }
    private GradientDrawable shape(int color, int radius) { GradientDrawable d = new GradientDrawable(); d.setColor(color); d.setCornerRadius(dp(radius)); d.setStroke(dp(1), BORDER); return d; }
    private void margins(View view, int left, int top, int right, int bottom) { LinearLayout.LayoutParams p = (LinearLayout.LayoutParams) view.getLayoutParams(); p.setMargins(dp(left), dp(top), dp(right), dp(bottom)); view.setLayoutParams(p); }
}
