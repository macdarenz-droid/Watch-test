package com.mrcdrnzz.dailytracker;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
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
import android.os.Build;
import android.os.OutcomeReceiver;

import androidx.annotation.NonNull;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "HealthConnectNative")
public class HealthConnectNativePlugin extends Plugin {
    private final Executor executor = Executors.newSingleThreadExecutor();

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

    private boolean hasReadPermissions() {
        return hasHealthPermission("android.permission.health.READ_STEPS") &&
                hasHealthPermission("android.permission.health.READ_SLEEP") &&
                hasHealthPermission("android.permission.health.READ_HEART_RATE") &&
                hasHealthPermission("android.permission.health.READ_ACTIVE_CALORIES_BURNED");
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
            hc.readRecords(builder.build(), executor,
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

                List<StepsRecord> stepsRecords = readRecords(StepsRecord.class, start, end);
                List<SleepSessionRecord> sleepRecords = readRecords(SleepSessionRecord.class, start, end);
                List<RestingHeartRateRecord> restingRecords = readRecords(RestingHeartRateRecord.class, start, end);
                List<HeartRateRecord> heartRecords = readRecords(HeartRateRecord.class, start, end);
                List<ActiveCaloriesBurnedRecord> calorieRecords = readRecords(ActiveCaloriesBurnedRecord.class, start, end);

                long steps = 0;
                Instant stepsTime = null;
                for (StepsRecord r : stepsRecords) {
                    steps += r.getCount();
                    if (stepsTime == null || r.getEndTime().isAfter(stepsTime)) stepsTime = r.getEndTime();
                }

                long sleepMinutes = 0;
                Instant sleepEnd = null;
                for (SleepSessionRecord r : sleepRecords) {
                    long mins = Math.max(0, ChronoUnit.MINUTES.between(r.getStartTime(), r.getEndTime()));
                    if (sleepEnd == null || r.getEndTime().isAfter(sleepEnd)) {
                        sleepEnd = r.getEndTime();
                        sleepMinutes = mins;
                    }
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

                double calories = 0;
                Instant caloriesTime = null;
                for (ActiveCaloriesBurnedRecord r : calorieRecords) {
                    calories += r.getEnergy().getInCalories();
                    if (caloriesTime == null || r.getEndTime().isAfter(caloriesTime)) caloriesTime = r.getEndTime();
                }

                JSObject out = new JSObject();
                out.put("needsPermission", false);
                out.put("steps", steps);
                out.put("sleepMinutes", sleepMinutes);
                out.put("restingHR", resting);
                out.put("workoutHR", latestHr);
                out.put("activeCalories", Math.round(calories));
                if (heartTime != null) out.put("heartRateTime", heartTime.toString());
                if (stepsTime != null) out.put("stepsTime", stepsTime.toString());
                if (caloriesTime != null) out.put("activeCaloriesTime", caloriesTime.toString());
                if (sleepEnd != null) out.put("sleepEndTime", sleepEnd.toString());
                call.resolve(out);
            } catch (Exception e) {
                call.reject("Health Connect summary failed", e);
            }
        });
    }

    @PluginMethod
    public void diagnose(PluginCall call) {
        if (!platformAvailable()) {
            call.reject("Health Connect requires Android 14 or newer on this build.");
            return;
        }
        if (!hasReadPermissions()) {
            JSObject out = new JSObject();
            out.put("needsPermission", true);
            out.put("windowDays", 7);
            call.resolve(out);
            return;
        }

        executor.execute(() -> {
            try {
                Instant end = Instant.now();
                Instant start = end.minus(7, ChronoUnit.DAYS);
                List<SleepSessionRecord> sleep = readRecords(SleepSessionRecord.class, start, end);
                List<RestingHeartRateRecord> resting = readRecords(RestingHeartRateRecord.class, start, end);
                List<HeartRateRecord> heart = readRecords(HeartRateRecord.class, start, end);
                List<ActiveCaloriesBurnedRecord> calories = readRecords(ActiveCaloriesBurnedRecord.class, start, end);

                int samples = 0;
                for (HeartRateRecord r : heart) samples += r.getSamples().size();
                double totalCalories = 0;
                for (ActiveCaloriesBurnedRecord r : calories) totalCalories += r.getEnergy().getInCalories();

                JSObject out = new JSObject();
                out.put("needsPermission", false);
                out.put("windowDays", 7);
                out.put("sleepRecords", sleep.size());
                out.put("restingHrRecords", resting.size());
                out.put("heartRateRecords", heart.size());
                out.put("heartRateSamples", samples);
                out.put("activeCalorieRecords", calories.size());
                out.put("activeCaloriesTotal", Math.round(totalCalories));
                call.resolve(out);
            } catch (Exception e) {
                call.reject("Health Connect diagnostic failed", e);
            }
        });
    }
}
