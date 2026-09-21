package com.marc.watch;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.health.connect.*;
import android.health.connect.datatypes.*;
import android.health.connect.datatypes.Record;
import android.health.connect.datatypes.units.Energy;
import android.os.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Consumer;

@TargetApi(34)
final class PlatformHealthBridge extends HealthBridge {
    private final HealthConnectManager manager;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private int generation, remaining;
    private boolean hadError;
    PlatformHealthBridge(Activity activity,Runnable changed) {
        super(activity,changed);
        manager = activity.getSystemService(HealthConnectManager.class);
        source = activity.getPreferences(Context.MODE_PRIVATE).getString("health_source", "");
        if (manager == null) message = "Health Connect is unavailable on this phone.";
    }
    @Override public boolean available() { return manager != null; }
    private boolean granted(int index) { return activity.checkSelfPermission(PERMISSIONS[index]) == PackageManager.PERMISSION_GRANTED; }
    @Override public void request() { if (available()) activity.requestPermissions(PERMISSIONS,200); }
    @Override public void selectSource(String packageName) {
        source = packageName;
        activity.getPreferences(Context.MODE_PRIVATE).edit().putString("health_source",source).apply();
        pause(); clear(); refresh();
    }
    @Override public void pause() { generation++; busy = false; handler.removeCallbacksAndMessages(null); }
    private void clear() { steps = calories = sleep = oxygen = "—"; }
    @Override public void refresh() {
        if (manager == null || busy) return;
        int count = 0;
        for (int i = 0; i < 4; i++) if (granted(i)) count++;
        if (count == 0) {
            clear(); stepsNote = caloriesNote = sleepNote = oxygenNote = "Permission needed";
            sources.clear(); message = "Tap Connect health data, then choose which readings to share."; changed.run(); return;
        }
        int token = ++generation; busy = true; remaining = count; hadError = false;
        message = "Checking shared records…"; clear();
        stepsNote = granted(0) ? "Checking today…" : "Permission needed";
        caloriesNote = granted(1) ? "Checking today…" : "Permission needed";
        sleepNote = granted(2) ? "Checking recent sessions…" : "Permission needed";
        oxygenNote = granted(3) ? "Checking recent readings…" : "Permission needed";
        Instant now = Instant.now();
        Instant start = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        TimeInstantRangeFilter today = new TimeInstantRangeFilter.Builder().setStartTime(start).setEndTime(now).build();
        if (granted(0)) aggregate(today,StepsRecord.STEPS_COUNT_TOTAL,token,0,n -> {
            steps = n == null ? "—" : String.format(Locale.getDefault(),"%,d",n);
            stepsNote = n == null ? "No shared steps today" : "Today · shared total";
        });
        if (granted(1)) aggregate(today,ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL,token,1,e -> {
            calories = e == null ? "—" : String.format(Locale.getDefault(),"%.0f",e.getInCalories() / 1000.0);
            caloriesNote = e == null ? "No shared calories today" : "kcal · today’s active energy";
        });
        TimeInstantRangeFilter recent = new TimeInstantRangeFilter.Builder().setStartTime(now.minus(Duration.ofDays(7))).setEndTime(now).build();
        if (granted(2)) read(SleepSessionRecord.class,recent,token,2,rows -> {
            SleepSessionRecord last = rows.stream().max(Comparator.comparing(SleepSessionRecord::getEndTime)).orElse(null);
            if (last == null) { sleep = "—"; sleepNote = "No session in the last 7 days"; return; }
            long minutes = Duration.between(last.getStartTime(),last.getEndTime()).toMinutes();
            sleep = (minutes / 60) + "h " + (minutes % 60) + "m";
            sleepNote = "Session span · ended " + stamp(last.getEndTime()) + "\n" + origin(last);
        });
        if (granted(3)) read(OxygenSaturationRecord.class,recent,token,3,rows -> {
            OxygenSaturationRecord last = rows.stream().max(Comparator.comparing(OxygenSaturationRecord::getTime)).orElse(null);
            if (last == null) { oxygen = "—"; oxygenNote = "No reading in the last 7 days"; return; }
            oxygen = String.format(Locale.getDefault(),"%.0f%%",last.getPercentage().getValue());
            oxygenNote = "Recorded " + stamp(last.getTime()) + "\n" + origin(last);
        });
        handler.postDelayed(() -> {
            if (token != generation || !busy) return;
            generation++; busy = false; message = "Health Connect did not finish. Tap Refresh to retry.";
            if (stepsNote.startsWith("Checking")) stepsNote = "Read timed out";
            if (caloriesNote.startsWith("Checking")) caloriesNote = "Read timed out";
            if (sleepNote.startsWith("Checking")) sleepNote = "Read timed out";
            if (oxygenNote.startsWith("Checking")) oxygenNote = "Read timed out";
            changed.run();
        },20_000);
        changed.run();
    }
    private <T> void aggregate(TimeRangeFilter range, AggregationType<T> type,int token,int metric,Consumer<T> result) {
        AggregateRecordsRequest.Builder<T> builder = new AggregateRecordsRequest.Builder<T>(range).addAggregationType(type);
        if (!source.isEmpty()) builder.addDataOriginsFilter(new DataOrigin.Builder().setPackageName(source).build());
        try {
            manager.aggregate(builder.build(),activity.getMainExecutor(),new OutcomeReceiver<AggregateRecordsResponse<T>,HealthConnectException>() {
                @Override public void onResult(AggregateRecordsResponse<T> value) {
                    if (token != generation) return;
                    for (DataOrigin item : value.getDataOrigins(type)) sources.add(item.getPackageName());
                    result.accept(value.get(type)); done(token);
                }
                @Override public void onError(HealthConnectException e) { error(token,metric,e.getErrorCode()); }
            });
        } catch (RuntimeException e) { error(token,metric,-1); }
    }
    private <T extends Record> void read(Class<T> type,TimeRangeFilter range,int token,int metric,Consumer<List<T>> result) {
        // Read the full bounded seven-day range. Pagination prevents silently incomplete results.
        page(type,range,token,metric,result,new ArrayList<>(),-1);
    }
    private <T extends Record> void page(Class<T> type,TimeRangeFilter range,int token,int metric,Consumer<List<T>> result,List<T> all,long pageToken) {
        ReadRecordsRequestUsingFilters.Builder<T> builder = new ReadRecordsRequestUsingFilters.Builder<T>(type).setTimeRangeFilter(range).setPageSize(1000);
        if (pageToken < 0) builder.setAscending(false); else builder.setPageToken(pageToken);
        if (!source.isEmpty()) builder.addDataOrigins(new DataOrigin.Builder().setPackageName(source).build());
        try {
            manager.readRecords(builder.build(),activity.getMainExecutor(),new OutcomeReceiver<ReadRecordsResponse<T>,HealthConnectException>() {
                @Override public void onResult(ReadRecordsResponse<T> value) {
                    if (token != generation) return;
                    for (T row : value.getRecords()) { sources.add(origin(row)); all.add(row); }
                    if (value.getNextPageToken() != -1) {
                        if (all.size() >= 50_000) { error(token,metric,-2); return; }
                        page(type,range,token,metric,result,all,value.getNextPageToken());
                    } else { result.accept(all); done(token); }
                }
                @Override public void onError(HealthConnectException e) { error(token,metric,e.getErrorCode()); }
            });
        } catch (RuntimeException e) { error(token,metric,-1); }
    }
    private void error(int token,int metric,int code) {
        if (token != generation) return;
        hadError = true;
        String note = "Read unavailable (" + code + ") · check permissions";
        switch (metric) { case 0 -> stepsNote = note; case 1 -> caloriesNote = note; case 2 -> sleepNote = note; case 3 -> oxygenNote = note; }
        done(token);
    }
    private void done(int token) {
        if (token != generation) return;
        if (--remaining == 0) {
            busy = false; handler.removeCallbacksAndMessages(null); checkedAt = System.currentTimeMillis();
            message = hadError ? "Some readings are unavailable. Check the notes below."
                : sources.isEmpty() ? "No shared records yet. Your watch’s app must write to Health Connect first. Huawei Health sharing varies by version/region."
                : "Shared records · refresh every 60s while open. Updates depend on the source app.";
        }
        changed.run();
    }
    private static String origin(Record record) { return record.getMetadata().getDataOrigin().getPackageName(); }
    private static String stamp(Instant instant) {
        return DateTimeFormatter.ofPattern("d MMM, HH:mm").withZone(ZoneId.systemDefault()).format(instant);
    }
}
