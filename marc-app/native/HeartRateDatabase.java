package com.mrcdrnzz.dailytracker;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/** Durable sensor store. Raw packets never enter the web app's localStorage state. */
final class HeartRateDatabase extends SQLiteOpenHelper {
    private static final String NAME = "marc-heart-rate.db";
    private static final int VERSION = 2;

    HeartRateDatabase(Context context) { super(context, NAME, null, VERSION); }

    @Override public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE sessions (session_id TEXT PRIMARY KEY, started_at INTEGER NOT NULL, ended_at INTEGER, status TEXT NOT NULL, gap_count INTEGER NOT NULL DEFAULT 0, bounds_known INTEGER NOT NULL DEFAULT 1)");
        db.execSQL("CREATE TABLE samples (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, bpm INTEGER NOT NULL, received_epoch INTEGER NOT NULL, received_elapsed INTEGER NOT NULL, contact INTEGER, energy INTEGER, rr_json TEXT, FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE CASCADE)");
        db.execSQL("CREATE INDEX samples_session_time ON samples(session_id, received_epoch)");
    }

    @Override public void onConfigure(SQLiteDatabase db) { super.onConfigure(db); db.setForeignKeyConstraintsEnabled(true); }
    @Override public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        if (oldVersion == 1 && newVersion == 2) {
            // V1 imports inferred workout bounds from the first/last packet.
            // The web workout history supplies real bounds during rehydration.
            db.execSQL("ALTER TABLE sessions ADD COLUMN bounds_known INTEGER NOT NULL DEFAULT 0");
        } else throw new IllegalStateException("Unsupported heart-rate database upgrade");
    }

    synchronized void begin(String sessionId, long startedAt) {
        if (!HeartRateMetrics.validEpoch(startedAt)) throw new IllegalArgumentException("Invalid workout start");
        ContentValues values = new ContentValues();
        values.put("session_id", sessionId); values.put("started_at", startedAt); values.put("status", "recording"); values.put("bounds_known", 1);
        getWritableDatabase().insertWithOnConflict("sessions", null, values, SQLiteDatabase.CONFLICT_IGNORE);
        values.putNull("ended_at");
        getWritableDatabase().update("sessions", values, "session_id=?", new String[]{sessionId});
    }

    synchronized void append(String sessionId, HeartRateMeasurement measurement, long epoch, long elapsed) {
        if (sessionId == null) return;
        ContentValues values = new ContentValues();
        values.put("session_id", sessionId); values.put("bpm", measurement.bpm); values.put("received_epoch", epoch); values.put("received_elapsed", elapsed);
        if (measurement.contactDetected == null) values.putNull("contact"); else values.put("contact", measurement.contactDetected ? 1 : 0);
        if (measurement.energyKj == null) values.putNull("energy"); else values.put("energy", measurement.energyKj);
        JSONArray rr = new JSONArray();
        try {
            for (double value : measurement.rrMillis) rr.put(value);
        } catch (JSONException ignored) {
            // Every RR value is a finite primitive produced by HeartRateMeasurement.
        }
        values.put("rr_json", rr.toString());
        getWritableDatabase().insertOrThrow("samples", null, values);
    }

    synchronized JSObject finish(String sessionId, long endedAt) {
        ContentValues values = new ContentValues(); values.put("ended_at", endedAt); values.put("status", "complete");
        getWritableDatabase().update("sessions", values, "session_id=?", new String[]{sessionId});
        return summary(sessionId);
    }

    synchronized void discard(String sessionId) { delete(sessionId); }
    synchronized void delete(String sessionId) { getWritableDatabase().delete("sessions", "session_id=?", new String[]{sessionId}); }
    synchronized void reset() { getWritableDatabase().delete("sessions", null, null); }

    synchronized JSObject summary(String sessionId) {
        SQLiteDatabase db = getReadableDatabase();
        Long startedAt = null, endedAt = null; int gapCount = 0;
        try (Cursor session = db.query("sessions", new String[]{"started_at", "ended_at", "gap_count", "bounds_known"}, "session_id=?", new String[]{sessionId}, null, null, null)) {
            if (session.moveToFirst()) {
                if (session.getInt(3) == 1) { startedAt = session.getLong(0); endedAt = session.isNull(1) ? System.currentTimeMillis() : session.getLong(1); }
                gapCount = session.getInt(2);
            }
        }
        List<HeartRateMetrics.Sample> samples = new ArrayList<>();
        try (Cursor rows = db.query("samples", new String[]{"bpm", "received_epoch", "received_elapsed", "contact"}, "session_id=?", new String[]{sessionId}, null, null, "received_epoch ASC, id ASC")) {
            while (rows.moveToNext()) {
                samples.add(new HeartRateMetrics.Sample(rows.getInt(0), rows.getLong(1), rows.getLong(2), rows.isNull(3) ? null : rows.getInt(3) == 1));
            }
        }
        HeartRateMetrics.Summary calculated = HeartRateMetrics.summarize(samples, startedAt, endedAt, gapCount);
        JSObject out = new JSObject(); out.put("sampleCount", calculated.count); out.put("gapCount", calculated.gapCount);
        if (calculated.knownBounds) {
            out.put("metricsVersion", 2); out.put("capturedMs", calculated.capturedMs); out.put("durationMs", calculated.durationMs);
            if (calculated.coveragePct != null) out.put("coveragePct", calculated.coveragePct);
        }
        if (calculated.count > 0) {
            out.put("averageBpm", calculated.averageBpm); out.put("recordedPeakBpm", calculated.peak);
            out.put("firstSampleAt", java.time.Instant.ofEpochMilli(calculated.first).toString());
            out.put("lastSampleAt", java.time.Instant.ofEpochMilli(calculated.last).toString());
        }
        return out;
    }

    synchronized JSObject summary(String sessionId, long startedAt, long endedAt) {
        if (!HeartRateMetrics.validEpoch(startedAt) || !HeartRateMetrics.validEpoch(endedAt) || endedAt < startedAt) throw new IllegalArgumentException("Invalid workout bounds");
        ContentValues values = new ContentValues(); values.put("started_at", startedAt); values.put("ended_at", endedAt); values.put("bounds_known", 1); values.put("status", "complete");
        getWritableDatabase().update("sessions", values, "session_id=?", new String[]{sessionId});
        return summary(sessionId);
    }

    synchronized JSObject trace(String sessionId) {
        JSObject out = new JSObject(); out.put("sessionId", sessionId); out.put("version", 1); out.put("summary", summary(sessionId));
        try (Cursor session = getReadableDatabase().query("sessions", new String[]{"started_at", "ended_at", "bounds_known"}, "session_id=?", new String[]{sessionId}, null, null, null)) {
            if (session.moveToFirst() && session.getInt(2) == 1) {
                out.put("startedAtEpochMs", session.getLong(0));
                if (!session.isNull(1)) out.put("endedAtEpochMs", session.getLong(1));
            }
        }
        JSArray samples = new JSArray();
        try (Cursor rows = getReadableDatabase().query("samples", new String[]{"bpm", "received_epoch", "received_elapsed", "contact", "energy", "rr_json"}, "session_id=?", new String[]{sessionId}, null, null, "received_epoch ASC, id ASC")) {
            while (rows.moveToNext()) {
                JSObject sample = new JSObject(); sample.put("bpm", rows.getInt(0)); sample.put("receivedAtEpochMs", rows.getLong(1)); sample.put("receivedAtElapsedMs", rows.getLong(2)); sample.put("source", "ble-heart-rate");
                if (!rows.isNull(3)) sample.put("contactDetected", rows.getInt(3) == 1);
                if (!rows.isNull(4)) sample.put("energyKj", rows.getInt(4));
                try { sample.put("rrMillis", new JSONArray(rows.getString(5))); } catch (JSONException ignored) { sample.put("rrMillis", new JSONArray()); }
                samples.put(sample);
            }
        }
        out.put("samples", samples); return out;
    }

    synchronized JSObject exportAll() {
        JSArray traces = new JSArray();
        try (Cursor rows = getReadableDatabase().query("sessions", new String[]{"session_id"}, null, null, null, null, "started_at ASC")) {
            while (rows.moveToNext()) traces.put(trace(rows.getString(0)));
        }
        JSObject out = new JSObject(); out.put("version", 1); out.put("traces", traces); return out;
    }

    synchronized int importAll(JSObject payload) throws JSONException {
        if (payload.getInt("version") != 1) throw new JSONException("Unsupported heart-rate version");
        JSONArray traces = payload.getJSONArray("traces"); int imported = 0;
        SQLiteDatabase db = getWritableDatabase(); db.beginTransaction();
        try {
            if (payload.optBoolean("replace", false)) db.delete("sessions", null, null);
            for (int i = 0; i < traces.length(); i++) {
                JSONObject trace = traces.getJSONObject(i); String sessionId = trace.getString("sessionId"); JSONArray samples = trace.getJSONArray("samples");
                if (sessionId.trim().isEmpty() || trace.optInt("version", 1) != 1) throw new JSONException("Invalid trace");
                boolean known = trace.has("startedAtEpochMs") && trace.has("endedAtEpochMs");
                long startedAt = known ? integer(trace, "startedAtEpochMs", HeartRateMetrics.MAX_EPOCH_MS) : 0;
                long endedAt = known ? integer(trace, "endedAtEpochMs", HeartRateMetrics.MAX_EPOCH_MS) : 0;
                if (known && endedAt < startedAt) throw new JSONException("Invalid workout bounds");
                ContentValues session = new ContentValues(); session.put("session_id", sessionId); session.put("started_at", startedAt); session.put("ended_at", endedAt); session.put("status", "complete"); session.put("bounds_known", known ? 1 : 0); session.put("gap_count", 0);
                db.insertWithOnConflict("sessions", null, session, SQLiteDatabase.CONFLICT_IGNORE);
                db.update("sessions", session, "session_id=?", new String[]{sessionId}); deleteSamples(db, sessionId);
                for (int j = 0; j < samples.length(); j++) insertImported(db, sessionId, samples.getJSONObject(j));
                imported++;
            }
            db.setTransactionSuccessful();
        } finally { db.endTransaction(); }
        return imported;
    }

    private static void deleteSamples(SQLiteDatabase db, String sessionId) { db.delete("samples", "session_id=?", new String[]{sessionId}); }
    private static long integer(JSONObject object, String key, long max) throws JSONException {
        Object raw = object.get(key);
        if (!(raw instanceof Number)) throw new JSONException("Invalid " + key);
        double value = ((Number) raw).doubleValue();
        if (!Double.isFinite(value) || value < 0 || value > max || value != Math.floor(value)) throw new JSONException("Invalid " + key);
        return ((Number) raw).longValue();
    }
    private static void insertImported(SQLiteDatabase db, String sessionId, JSONObject sample) throws JSONException {
        int bpm = (int) integer(sample, "bpm", 260); if (bpm < 20) throw new JSONException("Invalid bpm");
        if (sample.has("source") && !"ble-heart-rate".equals(sample.getString("source"))) throw new JSONException("Invalid sensor source");
        ContentValues values = new ContentValues(); values.put("session_id", sessionId); values.put("bpm", bpm); values.put("received_epoch", integer(sample, "receivedAtEpochMs", HeartRateMetrics.MAX_EPOCH_MS)); values.put("received_elapsed", sample.has("receivedAtElapsedMs") ? integer(sample, "receivedAtElapsedMs", 9_007_199_254_740_991L) : 0);
        if (sample.has("contactDetected")) values.put("contact", sample.getBoolean("contactDetected") ? 1 : 0);
        if (sample.has("energyKj")) values.put("energy", sample.getInt("energyKj"));
        values.put("rr_json", sample.optJSONArray("rrMillis") == null ? "[]" : sample.optJSONArray("rrMillis").toString());
        db.insertOrThrow("samples", null, values);
    }
}
