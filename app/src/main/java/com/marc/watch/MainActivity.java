package com.marc.watch;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.*;
import android.bluetooth.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.location.LocationManager;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.widget.*;
import com.marc.watch.core.LiveSession;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

public final class MainActivity extends Activity {
    private static final int BG=0xFF0B1010, SURFACE=0xFF141D1A, BORDER=0xFF293A32, TEXT=0xFFEAF2ED, MUTED=0xFF9AADA3, ACCENT=0xFFAEF8CF;
    private final Handler handler=new Handler(Looper.getMainLooper());
    private WatchService service;
    private HealthBridge health;
    private boolean bound;
    private TextView connection,connectionDetail,bpm,freshness,age,watchName,sessionStats,packetNote;
    private TextView healthMessage,healthSource,healthChecked;
    private TextView batteryValue,batteryNote,rrValue,rrNote,energyValue,energyNote;
    private TextView stepsValue,stepsNote,caloriesValue,caloriesNote,sleepValue,sleepNote,oxygenValue,oxygenNote;
    private Button connectButton;
    private HeartChart chart;
    private DeviceScanner scanner;
    private AlertDialog scanDialog;
    private ArrayAdapter<String> scanAdapter;
    private TextView scanStatus;
    private String pendingDiagnostic;

    private final ServiceConnection serviceConnection=new ServiceConnection() {
        @Override public void onServiceConnected(ComponentName name,IBinder binder) {
            service=((WatchService.LocalBinder)binder).get();service.setListener(MainActivity.this::renderLive);renderLive();
        }
        @Override public void onServiceDisconnected(ComponentName name) {service=null;renderLive();}
    };
    private final Runnable tick=new Runnable(){@Override public void run(){renderLive();handler.postDelayed(this,1000);}};
    private final Runnable healthTick=new Runnable(){@Override public void run(){health.refresh();handler.postDelayed(this,60_000);}};
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);buildDashboard();health=HealthBridge.create(this,this::renderHealth);renderHealth();
    }
    @Override protected void onStart() {
        super.onStart();bound=bindService(new Intent(this,WatchService.class),serviceConnection,Context.BIND_AUTO_CREATE);
    }
    @Override protected void onResume() {
        super.onResume();handler.post(tick);handler.post(healthTick);
        if(service!=null && service.running && !service.permitted())service.disconnect();
    }
    @Override protected void onPause() {
        handler.removeCallbacksAndMessages(null);health.pause();
        if(scanner!=null)scanner.stop();
        if(scanDialog!=null && scanDialog.isShowing())scanDialog.dismiss();
        super.onPause();
    }
    @Override protected void onStop() {
        if(service!=null)service.setListener(null);
        if(bound)unbindService(serviceConnection);bound=false;service=null;super.onStop();
    }
    private void buildDashboard() {
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);scroll.setBackgroundColor(BG);scroll.setClipToPadding(false);
        LinearLayout body=column();body.setPadding(dp(22),dp(22),dp(22),dp(32));scroll.addView(body);
        setContentView(scroll);
        scroll.setOnApplyWindowInsetsListener((v,insets)->{
            if(Build.VERSION.SDK_INT>=30){android.graphics.Insets i=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());v.setPadding(i.left,i.top,i.right,i.bottom);}
            else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets;
        });
        label(body,"M / ARC     ·     WATCH TEST",11,ACCENT,true);
        TextView title=label(body,"Your watch.\nLive on your phone.",30,TEXT,true);margins(title,0,12,0,6);
        label(body,"A direct connection to your training.",14,MUTED,false);

        LinearLayout link=card(body,SURFACE,20);
        connection=label(link,"Ready to connect",17,TEXT,true);
        connectionDetail=label(link,"Turn on HR Data Broadcasts on your watch.",13,MUTED,false);margins(connectionDetail,0,6,0,10);
        connectButton=button(link,"Connect watch",true,()->{if(service!=null && service.running)service.disconnect();else beginScan();});
        button(link,"Huawei GT6 setup",false,this::showSetup);

        LinearLayout live=card(body,0xFF13271E,14);
        LinearLayout heading=row();live.addView(heading);
        TextView hrLabel=text("HEART RATE",11,ACCENT,true);heading.addView(hrLabel,new LinearLayout.LayoutParams(0,-2,1));
        freshness=text("NOT CONNECTED",10,MUTED,true);heading.addView(freshness);
        LinearLayout number=row();number.setGravity(Gravity.BOTTOM);margins(number,0,8,0,0);live.addView(number);
        bpm=text("—",76,TEXT,true);bpm.setFontFeatureSettings("tnum");number.addView(bpm);
        TextView unit=text("bpm",18,MUTED,false);unit.setPadding(dp(8),0,0,dp(18));number.addView(unit);
        age=label(live,"Waiting for your first reading",12,MUTED,false);
        chart=new HeartChart(this);live.addView(chart,new LinearLayout.LayoutParams(-1,dp(138)));margins(chart,0,16,0,12);
        sessionStats=label(live,"MIN  —       AVG  —       MAX  —",12,TEXT,true);
        watchName=label(live,"No watch connected",12,MUTED,false);margins(watchName,0,12,0,0);
        packetNote=label(live,"Each point comes from a received watch reading.",11,MUTED,false);

        LinearLayout sensors=row();body.addView(sensors);margins(sensors,0,14,0,0);
        TextView[] battery=tile(sensors,"WATCH BATTERY");batteryValue=battery[0];batteryNote=battery[1];
        TextView[] rr=tile(sensors,"RR INTERVAL");rrValue=rr[0];rrNote=rr[1];
        LinearLayout energy=card(body,SURFACE,10);
        label(energy,"BROADCAST ENERGY",10,MUTED,true);
        energyValue=label(energy,"—",24,TEXT,true);
        energyNote=label(energy,"Only shown when the watch includes energy in its stream.",11,MUTED,false);

        label(body,"SHARED HEALTH DATA",11,ACCENT,true).setPadding(0,dp(28),0,dp(4));
        healthMessage=label(body,"",13,MUTED,false);
        healthSource=label(body,"",11,MUTED,false);margins(healthSource,0,10,0,0);
        healthChecked=label(body,"",11,MUTED,false);
        LinearLayout healthActions=row();body.addView(healthActions);margins(healthActions,0,10,0,0);
        Button permissions=button(healthActions,"Connect health data",true,()->{
            if(health.available())new AlertDialog.Builder(this).setTitle("Shared health records")
                .setMessage("Choose which data to allow on the next screen. These are records shared by other apps, so they may arrive later than the watch. Live heart rate uses Bluetooth separately.")
                .setPositiveButton("Continue",(d,w)->health.request()).setNegativeButton("Cancel",null).show();
            else info("Health Connect",health.message);
        });weight(permissions,1);
        Button refresh=button(healthActions,"Refresh",false,()->health.refresh());weight(refresh,0.6f);
        button(body,"Choose data source",false,this::chooseSource);
        LinearLayout day=row();body.addView(day);margins(day,0,8,0,0);
        TextView[] steps=tile(day,"STEPS");stepsValue=steps[0];stepsNote=steps[1];
        TextView[] calories=tile(day,"ACTIVE CALORIES");caloriesValue=calories[0];caloriesNote=calories[1];
        LinearLayout night=row();body.addView(night);margins(night,0,10,0,0);
        TextView[] sleep=tile(night,"LATEST SLEEP SESSION");sleepValue=sleep[0];sleepNote=sleep[1];
        TextView[] oxygen=tile(night,"BLOOD OXYGEN");oxygenValue=oxygen[0];oxygenNote=oxygen[1];
        label(body,"Shared totals may include phone data. Choose your watch’s sharing app to narrow the source. Empty means unavailable, not zero.",11,MUTED,false).setPadding(0,dp(12),0,dp(14));
        button(body,"Export connection diagnostics",false,this::exportDiagnostics);
        button(body,"Privacy & data",false,()->startActivity(new Intent(this,PrivacyActivity.class)));
        label(body,"WATCH TEST  0.1  ·  ON-DEVICE",10,MUTED,true).setPadding(0,dp(18),0,0);
    }
    private void renderLive() {
        if(connection==null)return;
        if(service==null){
            connection.setText("Ready to connect");connectionDetail.setText("Connect a broadcasting watch to receive readings.");connectButton.setText("Connect watch");
            freshness.setText("NOT CONNECTED");bpm.setText("—");age.setText("Waiting for your first reading");chart.show(null,false);
            sessionStats.setText("MIN  —       AVG  —       MAX  —");watchName.setText("No watch connected");
            batteryValue.setText("—");rrValue.setText("—");energyValue.setText("—");
            batteryNote.setText("Not shared by this connection");rrNote.setText("Not shared by this connection");
            energyNote.setText("Not included in a heart-rate packet yet.");packetNote.setText("Each point comes from a received watch reading.");return;
        }
        connection.setText(service.status);connectionDetail.setText(service.detail);connectButton.setText(service.running?"Disconnect":"Connect watch");
        LiveSession s=service.session;long now=SystemClock.elapsedRealtime();String state=s.freshness(service.subscribed,now);
        boolean isLive="LIVE".equals(state);
        freshness.setText(state);freshness.setTextColor(isLive?ACCENT:0xFFE7C99A);
        bpm.setText(s.samples==0?"—":String.valueOf(s.lastBpm));bpm.setTextColor(isLive?TEXT:MUTED);
        if(s.lastElapsed<0)age.setText(Boolean.FALSE.equals(s.contact)?"Adjust the watch on your wrist":"Waiting for your first reading");
        else age.setText((isLive?"Received ":"Last reading received ")+Math.max(0,(now-s.lastElapsed)/1000)+"s ago"+(isLive?"":" · not live"));
        chart.show(s,isLive);
        sessionStats.setText(s.samples==0?"MIN  —       AVG  —       MAX  —":"MIN  "+s.min+"       AVG  "+s.average()+"       MAX  "+s.max);
        watchName.setText(service.deviceName+(s.samples==0?"":" · "+s.samples+" readings"));
        packetNote.setText(s.packets>1?String.format(Locale.getDefault(),"Last packet interval: %.1fs · receipt timing, not sensor latency",s.lastIntervalSeconds):"Each point comes from a received watch reading.");
        batteryValue.setText(service.battery==null?"—":service.battery+"%");
        batteryNote.setText(service.battery==null?"Not shared by this connection":"Read at "+time(service.batteryReceivedAt));
        rrValue.setText(s.rrMillis.isEmpty()?"—":String.format(Locale.getDefault(),"%.0f ms",s.rrMillis.get(s.rrMillis.size()-1)));
        rrNote.setText(s.rrMillis.isEmpty()?"Not included in the latest packet":isLive?"Latest beat interval · not HRV":"Last received interval · not live");
        energyValue.setText(s.energyKj==null?"—":s.energyKj+" kJ");
        energyNote.setText(s.energyKj==null?"Not included in the latest heart-rate packet.":"Watch’s cumulative broadcast counter · not daily calories"+(isLive?"":" · not live"));
    }
    private void renderHealth() {
        if(health==null)return;
        healthMessage.setText(health.message);healthSource.setText("SOURCE  ·  "+health.sourceLabel());
        healthChecked.setText(health.checkedAt==0?"Shared data is separate from the live Bluetooth stream.":"Last checked "+time(health.checkedAt)+" · this is not the measurement time");
        stepsValue.setText(health.steps);stepsNote.setText(health.stepsNote);
        caloriesValue.setText(health.calories);caloriesNote.setText(health.caloriesNote);
        sleepValue.setText(health.sleep);sleepNote.setText(health.sleepNote);
        oxygenValue.setText(health.oxygen);oxygenNote.setText(health.oxygenNote);
    }
    private boolean hasBluetoothPermissions() {
        if(Build.VERSION.SDK_INT>=31)return checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN)==PackageManager.PERMISSION_GRANTED && checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT)==PackageManager.PERMISSION_GRANTED;
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)==PackageManager.PERMISSION_GRANTED;
    }
    @SuppressLint("MissingPermission")
    private void beginScan() {
        if(service==null){toast("Connection service is starting. Tap again in a moment.");return;}
        if(!hasBluetoothPermissions()) {
            String[] permissions=Build.VERSION.SDK_INT>=31?new String[]{Manifest.permission.BLUETOOTH_SCAN,Manifest.permission.BLUETOOTH_CONNECT}:new String[]{Manifest.permission.ACCESS_FINE_LOCATION};
            requestPermissions(permissions,100);return;
        }
        if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED && !getPreferences(MODE_PRIVATE).getBoolean("notification_asked",false)) {
            getPreferences(MODE_PRIVATE).edit().putBoolean("notification_asked",true).apply();
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},101);return;
        }
        BluetoothManager manager=getSystemService(BluetoothManager.class);BluetoothAdapter adapter=manager==null?null:manager.getAdapter();
        if(adapter==null || !getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE)){info("Bluetooth unavailable","This phone does not expose Bluetooth Low Energy.");return;}
        if(!adapter.isEnabled()){try{startActivityForResult(new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE),102);}catch(ActivityNotFoundException e){startActivity(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS));}return;}
        if(Build.VERSION.SDK_INT<=30) {
            LocationManager location=getSystemService(LocationManager.class);
            if(location!=null && !location.isProviderEnabled(LocationManager.GPS_PROVIDER) && !location.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                new AlertDialog.Builder(this).setTitle("Turn on Location for scanning").setMessage("Android 8–11 requires Location services for Bluetooth discovery. Watch Test does not read or store your location.")
                    .setPositiveButton("Open settings",(d,w)->startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))).setNegativeButton("Cancel",null).show();return;
            }
        }
        showScanner(adapter);
    }
    private void showScanner(BluetoothAdapter adapter) {
        LinearLayout content=column();content.setPadding(dp(20),dp(8),dp(20),dp(8));
        scanStatus=label(content,"Scanning…",13,MUTED,false);
        label(content,"Enable HR Data Broadcasts on the watch first. Heart-rate broadcasts appear at the top.",12,MUTED,false).setPadding(0,dp(8),0,dp(8));
        ListView list=new ListView(this);scanAdapter=new ArrayAdapter<>(this,android.R.layout.simple_list_item_1,new ArrayList<>());
        list.setAdapter(scanAdapter);content.addView(list,new LinearLayout.LayoutParams(-1,dp(300)));
        scanner=new DeviceScanner(adapter,()->{if(scanAdapter==null)return;scanAdapter.clear();for(DeviceScanner.Found f:scanner.devices)scanAdapter.add(f.label());scanStatus.setText(scanner.message);});
        list.setOnItemClickListener((p,v,index,id)->{
            if(scanner==null || index>=scanner.devices.size() || service==null)return;
            BluetoothDevice device=scanner.devices.get(index).device;scanner.stop();scanDialog.dismiss();service.connect(device);
        });
        scanDialog=new AlertDialog.Builder(this).setTitle("Connect your watch").setView(content).setNegativeButton("Close",null).setNeutralButton("Scan again",null).create();
        scanDialog.setOnDismissListener(d->{if(scanner!=null)scanner.stop();});
        scanDialog.setOnShowListener(d->scanDialog.getButton(AlertDialog.BUTTON_NEUTRAL).setOnClickListener(v->scanner.start()));
        scanDialog.show();scanner.start();
    }
    private void showSetup() {
        info("Huawei GT6 setup","1. Wear your watch snugly. On the WATCH, open Settings → HR Data Broadcasts and start broadcasting. You may start a workout from that screen.\n\n"
            +"2. On this phone, tap Connect watch, allow Nearby devices, and select the broadcasting watch. Keep it close during setup.\n\n"
            +"3. Wait for LIVE and compare the bpm with the watch. This app updates whenever a packet arrives; the watch controls the rate.\n\n"
            +"If that watch setting is absent, this route is not supported by your current firmware. If the watch is busy, close other heart-rate receiver apps and try again. Some Huawei devices pause their Huawei Health connection while broadcasting.\n\n"
            +"Heart rate is the live route. Steps, sleep, calories and SpO₂ only appear below when a companion app shares them with Health Connect. Bluetooth pairing alone does not expose all watch readings. Other brands work here if they broadcast standard Bluetooth heart rate.");
    }
    private void chooseSource() {
        if(health.sources.isEmpty() && health.source.isEmpty()){info("No shared sources yet","Connect health data first. If no records appear, check your watch companion app’s Health Connect sharing settings. This app cannot unlock a vendor’s private data by pairing Bluetooth.");return;}
        List<String> names=new ArrayList<>();names.add("All shared sources");names.addAll(health.sources);
        new AlertDialog.Builder(this).setTitle("Health Connect source").setItems(names.toArray(new String[0]),(d,index)->health.selectSource(index==0?"":names.get(index))).setNegativeButton("Cancel",null).show();
    }
    private void exportDiagnostics() {
        if(service==null){toast("Open the dashboard again, then retry.");return;}
        pendingDiagnostic=service.diagnostics();
        Intent save=new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("text/plain").addCategory(Intent.CATEGORY_OPENABLE)
            .putExtra(Intent.EXTRA_TITLE,"Watch-Test-diagnostics.txt");
        try{startActivityForResult(save,300);}catch(ActivityNotFoundException e){info("Diagnostics",pendingDiagnostic);}
    }
    @Override public void onRequestPermissionsResult(int request,String[] names,int[] grants) {
        super.onRequestPermissionsResult(request,names,grants);
        if(request==100) {
            if(hasBluetoothPermissions())handler.postDelayed(this::beginScan,250);
            else new AlertDialog.Builder(this).setTitle("Allow Nearby devices").setMessage("Bluetooth permission is needed to find your watch. You can enable it in App permissions.")
                .setPositiveButton("Open app settings",(d,w)->startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,Uri.parse("package:"+getPackageName())))).setNegativeButton("Cancel",null).show();
        } else if(request==101)handler.postDelayed(this::beginScan,250);
        else if(request==200)health.refresh();
    }
    @Override protected void onActivityResult(int request,int result,Intent data) {
        super.onActivityResult(request,result,data);
        if(request==102 && result==RESULT_OK)handler.postDelayed(this::beginScan,250);
        if(request==300 && result==RESULT_OK && data!=null && data.getData()!=null && pendingDiagnostic!=null) {
            try(OutputStream out=getContentResolver().openOutputStream(data.getData())) {
                if(out==null)throw new java.io.IOException("No output stream");out.write(pendingDiagnostic.getBytes(StandardCharsets.UTF_8));toast("Diagnostics saved");
            } catch(Exception e){toast("Could not save diagnostics. Please try again.");}
            pendingDiagnostic=null;
        }
    }
    private String time(long epoch){return DateTimeFormatter.ofPattern("HH:mm:ss").withZone(ZoneId.systemDefault()).format(Instant.ofEpochMilli(epoch));}
    private void info(String title,String message){new AlertDialog.Builder(this).setTitle(title).setMessage(message).setPositiveButton("Got it",null).show();}
    private void toast(String message){Toast.makeText(this,message,Toast.LENGTH_LONG).show();}
    private int dp(float value){return (int)(value*getResources().getDisplayMetrics().density+0.5f);}
    private LinearLayout column(){LinearLayout v=new LinearLayout(this);v.setOrientation(LinearLayout.VERTICAL);v.setLayoutParams(new LinearLayout.LayoutParams(-1,-2));return v;}
    private LinearLayout row(){LinearLayout v=new LinearLayout(this);v.setOrientation(LinearLayout.HORIZONTAL);v.setGravity(Gravity.CENTER_VERTICAL);v.setLayoutParams(new LinearLayout.LayoutParams(-1,-2));return v;}
    private TextView text(String value,int size,int color,boolean bold){TextView v=new TextView(this);v.setText(value);v.setTextSize(size);v.setTextColor(color);v.setTypeface(Typeface.create(bold?"sans-serif-medium":"sans-serif",Typeface.NORMAL));v.setLineSpacing(dp(2),1);v.setLayoutParams(new LinearLayout.LayoutParams(-2,-2));return v;}
    private TextView label(LinearLayout parent,String value,int size,int color,boolean bold){TextView v=text(value,size,color,bold);v.setLayoutParams(new LinearLayout.LayoutParams(-1,-2));parent.addView(v);return v;}
    private LinearLayout card(LinearLayout parent,int color,int top){LinearLayout v=column();v.setPadding(dp(18),dp(18),dp(18),dp(18));v.setBackground(shape(color,20));parent.addView(v);margins(v,0,top,0,0);return v;}
    private GradientDrawable shape(int color,int radius){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(radius));d.setStroke(dp(1),BORDER);return d;}
    private Button button(LinearLayout parent,String value,boolean primary,Runnable action){Button b=new Button(this);b.setText(value);b.setTextSize(13);b.setAllCaps(false);b.setTextColor(primary?BG:TEXT);b.setBackgroundTintList(null);b.setBackground(shape(primary?ACCENT:0xFF1C2923,12));b.setPadding(dp(12),dp(10),dp(12),dp(10));b.setMinHeight(dp(48));b.setLayoutParams(new LinearLayout.LayoutParams(-1,-2));parent.addView(b);margins(b,0,8,0,0);b.setOnClickListener(v->action.run());return b;}
    private TextView[] tile(LinearLayout row,String name){LinearLayout tile=column();tile.setPadding(dp(14),dp(16),dp(14),dp(16));tile.setBackground(shape(SURFACE,16));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,-1,1);if(row.getChildCount()>0)p.leftMargin=dp(10);row.addView(tile,p);label(tile,name,9,MUTED,true);TextView value=label(tile,"—",24,TEXT,true);margins(value,0,8,0,4);TextView note=label(tile,"Not shared yet",11,MUTED,false);return new TextView[]{value,note};}
    private void weight(View view,float value){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,-2,value);p.topMargin=dp(8);if(value<1)p.leftMargin=dp(8);view.setLayoutParams(p);}
    private void margins(View view,int left,int top,int right,int bottom){LinearLayout.LayoutParams p=(LinearLayout.LayoutParams)view.getLayoutParams();p.setMargins(dp(left),dp(top),dp(right),dp(bottom));view.setLayoutParams(p);}
}
