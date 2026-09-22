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

import java.util.HashSet;
import java.util.Set;

/** Durable sensor store. Raw packets never enter the web app's localStorage state. */
final class HeartRateDatabase extends SQLiteOpenHelper {
    private static final String NAME = "marc-heart-rate.db";
    private static final int VERSION = 1;

    HeartRateDatabase(Context context) { super(context, NAME, null, VERSION); }

    @Override public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE sessions (session_id TEXT PRIMARY KEY, started_at INTEGER NOT NULL, ended_at INTEGER, status TEXT NOT NULL, gap_count INTEGER NOT NULL DEFAULT 0)");
        db.execSQL("CREATE TABLE samples (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, bpm INTEGER NOT NULL, received_epoch INTEGER NOT NULL, received_elapsed INTEGER NOT NULL, contact INTEGER, energy INTEGER, rr_json TEXT, FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE CASCADE)");
        db.execSQL("CREATE INDEX samples_session_time ON samples(session_id, received_epoch)");
    }

    @Override public void onConfigure(SQLiteDatabase db) { super.onConfigure(db); db.setForeignKeyConstraintsEnabled(true); }
    @Override public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) { throw new IllegalStateException("Unsupported heart-rate database upgrade"); }

    synchronized void begin(String sessionId, long startedAt) {
        ContentValues values = new ContentValues();
        values.put("session_id", sessionId); values.put("started_at", startedAt); values.put("status", "recording");
        getWritableDatabase().insertWithOnConflict("sessions", null, values, SQLiteDatabase.CONFLICT_IGNORE);
    }

    synchronized void append(String sessionId, HeartRateMeasurement measurement, long epoch, long elapsed) {
        if (sessionId == null) return;
        ContentValues values = new ContentValues();
        values.put("session_id", sessionId); values.put("bpm", measurement.bpm); values.put("received_epoch", epoch); values.put("received_elapsed", elapsed);
        if (measurement.contactDetected == null) values.putNull("contact"); else values.put("contact", measurement.contactDetected ? 1 : 0);
        if (measurement.energyKj == null) values.putNull("energy"); else values.put("energy", measurement.energyKj);
        JSONArray rr = new JSONArray(); for (double value : measurement.rrMillis) rr.put(value);
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
        long startedAt = 0, endedAt = 0; int gapCount = 0;
        try (Cursor session = db.query("sessions", new String[]{"started_at", "ended_at", "gap_count"}, "session_id=?", new String[]{sessionId}, null, null, null)) {
            if (session.moveToFirst()) { startedAt = session.getLong(0); endedAt = session.isNull(1) ? System.currentTimeMillis() : session.getLong(1); gapCount = session.getInt(2); }
        }
        int count = 0, sum = 0, peak = 0; long first = 0, last = 0, previous = 0; Set<Long> seconds = new HashSet<>();
        try (Cursor rows = db.query("samples", new String[]{"bpm", "received_epoch"}, "session_id=?", new String[]{sessionId}, null, null, "received_epoch ASC")) {
            while (rows.moveToNext()) {
                int bpm = rows.getInt(0); long epoch = rows.getLong(1);
                if (count == 0) first = epoch;
                if (previous > 0 && epoch - previous > 15_000) gapCount++;
                previous = epoch; last = epoch; count++; sum += bpm; peak = Math.max(peak, bpm);
                if (epoch >= startedAt && epoch <= endedAt) seconds.add((epoch - startedAt) / 1000);
            }
        }
        JSObject out = new JSObject(); out.put("sampleCount", count); out.put("gapCount", gapCount);
        if (count > 0) {
            out.put("averageBpm", Math.round((double) sum / count)); out.put("recordedPeakBpm", peak);
            long eligible = Math.max(0, (long) Math.ceil((endedAt - startedAt) / 1000.0));
            if (eligible > 0) out.put("coveragePct", Math.min(100, Math.round(seconds.size() * 100.0 / eligible)));
            out.put("firstSampleAt", java.time.Instant.ofEpochMilli(first).toString());
            out.put("lastSampleAt", java.time.Instant.ofEpochMilli(last).toString());
        }
        return out;
    }

    synchronized JSObject trace(String sessionId) {
        JSObject out = new JSObject(); out.put("sessionId", sessionId); out.put("version", 1); out.put("summary", summary(sessionId));
        JSArray samples = new JSArray();
        try (Cursor rows = getReadableDatabase().query("samples", new String[]{"bpm", "received_epoch", "received_elapsed", "contact", "energy", "rr_json"}, "session_id=?", new String[]{sessionId}, null, null, "received_epoch ASC")) {
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
            for (int i = 0; i < traces.length(); i++) {
                JSONObject trace = traces.getJSONObject(i); String sessionId = trace.getString("sessionId"); JSONArray samples = trace.getJSONArray("samples");
                long startedAt = samples.length() > 0 ? samples.getJSONObject(0).getLong("receivedAtEpochMs") : System.currentTimeMillis();
                begin(sessionId, startedAt); deleteSamples(db, sessionId);
                for (int j = 0; j < samples.length(); j++) insertImported(db, sessionId, samples.getJSONObject(j));
                ContentValues complete = new ContentValues(); complete.put("status", "complete"); complete.put("ended_at", samples.length() > 0 ? samples.getJSONObject(samples.length() - 1).getLong("receivedAtEpochMs") : startedAt);
                db.update("sessions", complete, "session_id=?", new String[]{sessionId}); imported++;
            }
            db.setTransactionSuccessful();
        } finally { db.endTransaction(); }
        return imported;
    }

    private static void deleteSamples(SQLiteDatabase db, String sessionId) { db.delete("samples", "session_id=?", new String[]{sessionId}); }
    private static void insertImported(SQLiteDatabase db, String sessionId, JSONObject sample) throws JSONException {
        int bpm = sample.getInt("bpm"); if (bpm < 20 || bpm > 260) throw new JSONException("Invalid bpm");
        ContentValues values = new ContentValues(); values.put("session_id", sessionId); values.put("bpm", bpm); values.put("received_epoch", sample.getLong("receivedAtEpochMs")); values.put("received_elapsed", sample.optLong("receivedAtElapsedMs", 0));
        if (sample.has("contactDetected")) values.put("contact", sample.getBoolean("contactDetected") ? 1 : 0);
        if (sample.has("energyKj")) values.put("energy", sample.getInt("energyKj"));
        values.put("rr_json", sample.optJSONArray("rrMillis") == null ? "[]" : sample.optJSONArray("rrMillis").toString());
        db.insertOrThrow("samples", null, values);
    }
}
