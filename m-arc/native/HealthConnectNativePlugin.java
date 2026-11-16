package com.mrcdrnzz.dailytracker;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.health.connect.AggregateRecordsRequest;
import android.health.connect.AggregateRecordsResponse;
import android.health.connect.HealthConnectException;
import android.health.connect.HealthConnectManager;
import android.health.connect.ReadRecordsRequestUsingFilters;
import android.health.connect.ReadRecordsResponse;
import android.health.connect.TimeInstantRangeFilter;
import android.health.connect.datatypes.ActiveCaloriesBurnedRecord;
import android.health.connect.datatypes.HeartRateRecord;
import android.health.connect.datatypes.RestingHeartRateRecord;
import android.health.connect.datatypes.Record;
import android.health.connect.datatypes.SleepSessionRecord;
import android.health.connect.datatypes.StepsRecord;
import android.health.connect.datatypes.AggregationType;
import android.health.connect.datatypes.units.Energy;
import android.os.Build;
import android.os.OutcomeReceiver;

import androidx.annotation.NonNull;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(
        name = "HealthConnectNative",
        permissions = {
                @Permission(alias = "health", strings = {
                        "android.permission.health.READ_STEPS",
                        "android.permission.health.READ_SLEEP",
                        "android.permission.health.READ_HEART_RATE",
                        "android.permission.health.READ_ACTIVE_CALORIES_BURNED",
                        "android.permission.health.READ_RESTING_HEART_RATE",
                })
        }
)
public class HealthConnectNativePlugin extends Plugin {
    private final Executor executor = Executors.newSingleThreadExecutor();
    /**
     * PL-03: Health Connect delivers results here, never on `executor`, whose only thread is
     * blocked on the latch waiting for them (that was a 20 s deadlock per read).
     */
    private final Executor callbackExecutor = Executors.newCachedThreadPool();

    private boolean platformAvailable() {
        if (Build.VERSION.SDK_INT < 34) return false;
        return getContext().getSystemService(HealthConnectManager.class) != null;
    }

    private HealthConnectManager manager() {
        if (!platformAvailable()) return null;
        return getContext().getSystemService(HealthConnectManager.class);
    }

    private boolean hasHealthPermission(String permission) {
        return Build.VERSION.SDK_INT >= 34 &&
                getContext().checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED;
    }

    static final String P_STEPS = "android.permission.health.READ_STEPS";
    static final String P_SLEEP = "android.permission.health.READ_SLEEP";
    static final String P_HEART = "android.permission.health.READ_HEART_RATE";
    static final String P_CALORIES = "android.permission.health.READ_ACTIVE_CALORIES_BURNED";
    static final String P_RESTING = "android.permission.health.READ_RESTING_HEART_RATE";
    static final String[] ALL = { P_STEPS, P_SLEEP, P_HEART, P_CALORIES, P_RESTING };

    /** True when at least one data type may be read: each type is read on its own, so one refusal never blocks the rest. */
    private boolean hasReadPermissions() {
        for (String p : ALL) if (hasHealthPermission(p)) return true;
        return false;
    }

    private boolean hasAllReadPermissions() {
        for (String p : ALL) if (!hasHealthPermission(p)) return false;
        return true;
    }

    private JSArray missingPermissions() {
        JSArray out = new JSArray();
        for (String p : ALL) if (!hasHealthPermission(p)) out.put(p.substring(p.lastIndexOf('.') + 1));
        return out;
    }

    /** Reads one record type if its permission is granted; a refusal or error for that type yields an empty list and is noted. */
    private <T extends Record> List<T> readIfGranted(String permission, Class<T> cls, Instant start, Instant end, JSArray failed) {
        if (!hasHealthPermission(permission)) return new ArrayList<>();
        try {
            return readRecords(cls, start, end);
        } catch (Exception e) {
            failed.put(cls.getSimpleName() + ": " + e.getClass().getSimpleName());
            return new ArrayList<>();
        }
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject out = new JSObject();
        out.put("available", platformAvailable());
        out.put("apiLevel", Build.VERSION.SDK_INT);
        out.put("needsPermission", platformAvailable() && !hasReadPermissions());
        call.resolve(out);
    }

    @PluginMethod
    public void openPermissions(PluginCall call) {
        if (!platformAvailable()) {
            call.reject("Health Connect requires Android 14 or newer on this build.");
            return;
        }
        try {
            Intent intent = new Intent(HealthConnectManager.ACTION_MANAGE_HEALTH_PERMISSIONS);
            intent.putExtra(Intent.EXTRA_PACKAGE_NAME, getContext().getPackageName());
            getActivity().startActivity(intent);
            JSObject out = new JSObject();
            out.put("opened", true);
            call.resolve(out);
        } catch (Exception e) {
            call.reject("Unable to open Health Connect permissions", e);
        }
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (!platformAvailable()) {
            call.reject("Health Connect requires Android 14 or newer on this build.");
            return;
        }
        if (hasAllReadPermissions()) {
            JSObject out = new JSObject();
            out.put("granted", true);
            call.resolve(out);
            return;
        }
        requestPermissionForAlias("health", call, "healthPermissionsCallback");
    }

    @PermissionCallback
    private void healthPermissionsCallback(PluginCall call) {
        JSObject out = new JSObject();
        out.put("granted", hasReadPermissions());
        call.resolve(out);
    }

    private static class Holder<T> {
        T value;
        Exception error;
    }

    private <T extends Record> List<T> readRecords(Class<T> cls, Instant start, Instant end) throws Exception {
        HealthConnectManager hc = manager();
        if (hc == null) throw new IllegalStateException("Health Connect unavailable");

        List<T> all = new ArrayList<>();
        long pageToken = -1L;
        boolean firstPage = true;
        do {
            ReadRecordsRequestUsingFilters.Builder<T> builder =
                    new ReadRecordsRequestUsingFilters.Builder<>(cls)
                            .setTimeRangeFilter(new TimeInstantRangeFilter.Builder()
                                    .setStartTime(start)
                                    .setEndTime(end)
                                    .build())
                            .setPageSize(1000);
            if (firstPage) {
                builder.setAscending(true);
            } else {
                builder.setPageToken(pageToken);
            }

            CountDownLatch latch = new CountDownLatch(1);
            Holder<ReadRecordsResponse<T>> holder = new Holder<>();
            hc.readRecords(builder.build(), callbackExecutor,
                    new OutcomeReceiver<ReadRecordsResponse<T>, HealthConnectException>() {
                        @Override
                        public void onResult(ReadRecordsResponse<T> result) {
                            holder.value = result;
                            latch.countDown();
                        }

                        @Override
                        public void onError(@NonNull HealthConnectException error) {
                            holder.error = error;
                            latch.countDown();
                        }
                    });

            if (!latch.await(20, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Health Connect read timed out");
            }
            if (holder.error != null) throw holder.error;
            if (holder.value == null) break;
            all.addAll(holder.value.getRecords());
            pageToken = holder.value.getNextPageToken();
            firstPage = false;
        } while (pageToken != -1L);

        return all;
    }

    /**
     * PL-04/VX-01: one aggregate (the builder takes a single type) over local midnight → now,
     * so overlapping records from several apps are de-duplicated by Health Connect itself.
     * Null when the permission is missing or the read failed (noted in `failed`).
     */
    private <T> T aggregateIfGranted(String permission, AggregationType<T> type, String label, JSArray failed) {
        if (!hasHealthPermission(permission)) return null;
        HealthConnectManager hc = manager();
        if (hc == null) return null;
        try {
            Instant start = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
            AggregateRecordsRequest<T> req = new AggregateRecordsRequest.Builder<T>(
                    new TimeInstantRangeFilter.Builder().setStartTime(start).setEndTime(Instant.now()).build())
                    .addAggregationType(type)
                    .build();
            CountDownLatch latch = new CountDownLatch(1);
            Holder<AggregateRecordsResponse<T>> holder = new Holder<>();
            hc.aggregate(req, callbackExecutor, new OutcomeReceiver<AggregateRecordsResponse<T>, HealthConnectException>() {
                @Override
                public void onResult(AggregateRecordsResponse<T> result) {
                    holder.value = result;
                    latch.countDown();
                }

                @Override
                public void onError(@NonNull HealthConnectException error) {
                    holder.error = error;
                    latch.countDown();
                }
            });
            if (!latch.await(20, TimeUnit.SECONDS)) throw new IllegalStateException("Health Connect aggregate timed out");
            if (holder.error != null) throw holder.error;
            return holder.value == null ? null : holder.value.get(type);
        } catch (Exception e) {
            failed.put(label + ": " + e.getClass().getSimpleName());
            return null;
        }
    }

    private JSObject permissionOnlyResult() {
        JSObject out = new JSObject();
        out.put("needsPermission", true);
        out.put("steps", 0);
        out.put("sleepMinutes", 0);
        out.put("restingHR", 0);
        out.put("workoutHR", 0);
        out.put("activeCalories", 0);
        return out;
    }

    @PluginMethod
    public void readSummary(PluginCall call) {
        if (!platformAvailable()) {
            call.reject("Health Connect requires Android 14 or newer on this build.");
            return;
        }
        if (!hasReadPermissions()) {
            call.resolve(permissionOnlyResult());
            return;
        }

        executor.execute(() -> {
            try {
                Instant end = Instant.now();
                Instant start = end.minus(2, ChronoUnit.DAYS);
                JSArray failed = new JSArray();

                // Today's totals come from aggregates; the 48 h read keeps sleep and heart rate.
                Long stepsTotal = aggregateIfGranted(P_STEPS, StepsRecord.STEPS_COUNT_TOTAL, "Steps", failed);
                Energy energyTotal = aggregateIfGranted(P_CALORIES, ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL, "ActiveCalories", failed);
                List<SleepSessionRecord> sleepRecords = readIfGranted(P_SLEEP, SleepSessionRecord.class, start, end, failed);
                List<RestingHeartRateRecord> restingRecords = readIfGranted(P_RESTING, RestingHeartRateRecord.class, start, end, failed);
                List<HeartRateRecord> heartRecords = readIfGranted(P_HEART, HeartRateRecord.class, start, end, failed);

                long steps = stepsTotal == null ? 0 : stepsTotal;

                long sleepMinutes = 0;
                Instant sleepEnd = null;
                // NAT-03: every session goes to the app with its awake stages; the app picks the night.
                JSArray sleepSessions = new JSArray();
                for (SleepSessionRecord r : sleepRecords) {
                    long mins = Math.max(0, ChronoUnit.MINUTES.between(r.getStartTime(), r.getEndTime()));
                    if (sleepEnd == null || r.getEndTime().isAfter(sleepEnd)) {
                        sleepEnd = r.getEndTime();
                        sleepMinutes = mins;
                    }
                    JSObject session = new JSObject();
                    session.put("start", r.getStartTime().toString());
                    session.put("end", r.getEndTime().toString());
                    JSArray awake = new JSArray();
                    for (SleepSessionRecord.Stage st : r.getStages()) {
                        int type = st.getType();
                        if (type == SleepSessionRecord.StageType.STAGE_TYPE_AWAKE
                                || type == SleepSessionRecord.StageType.STAGE_TYPE_AWAKE_IN_BED
                                || type == SleepSessionRecord.StageType.STAGE_TYPE_AWAKE_OUT_OF_BED) {
                            JSArray span = new JSArray();
                            span.put(st.getStartTime().toString());
                            span.put(st.getEndTime().toString());
                            awake.put(span);
                        }
                    }
                    session.put("awake", awake);
                    sleepSessions.put(session);
                }

                long resting = 0;
                Instant restingTime = null;
                for (RestingHeartRateRecord r : restingRecords) {
                    if (restingTime == null || r.getTime().isAfter(restingTime)) {
                        restingTime = r.getTime();
                        resting = r.getBeatsPerMinute();
                    }
                }

                long latestHr = 0;
                Instant heartTime = null;
                for (HeartRateRecord r : heartRecords) {
                    for (HeartRateRecord.HeartRateSample s : r.getSamples()) {
                        if (heartTime == null || s.getTime().isAfter(heartTime)) {
                            heartTime = s.getTime();
                            latestHr = s.getBeatsPerMinute();
                        }
                    }
                }

                // Energy.getInCalories() is small calories: kcal = / 1000.
                long activeKcal = energyTotal == null ? 0 : Math.round(energyTotal.getInCalories() / 1000.0);

                JSObject out = new JSObject();
                out.put("needsPermission", false);
                out.put("missing", missingPermissions());
                out.put("failed", failed);
                out.put("steps", steps);
                out.put("sleepMinutes", sleepMinutes);
                out.put("restingHR", resting);
                out.put("workoutHR", latestHr);
                out.put("activeCalories", activeKcal);
                if (heartTime != null) out.put("heartRateTime", heartTime.toString());
                if (stepsTotal != null) out.put("stepsTime", end.toString());
                if (energyTotal != null) out.put("activeCaloriesTime", end.toString());
                if (sleepEnd != null) out.put("sleepEndTime", sleepEnd.toString());
                if (restingTime != null) out.put("restingHRTime", restingTime.toString());
                // Sent only when sleep was read, so a failed or missing sleep read keeps the day's earlier value.
                if (!sleepRecords.isEmpty()) out.put("sleepSessions", sleepSessions);
                call.resolve(out);
            } catch (Exception e) {
                call.reject("Health Connect summary failed", e);
            }
        });
    }
}
