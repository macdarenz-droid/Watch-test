package com.marc.watch.core;

import java.util.ArrayList;
import java.util.List;

/** Receipt times are monotonic. They do NOT measure watch-to-phone end-to-end latency. */
public final class LiveSession {
    public record Point(long elapsed, long receivedAt, int bpm) {}
    public static final int MAX_POINTS = 900;
    public final List<Point> points = new ArrayList<>();
    public long packets, samples, firstElapsed = -1, lastElapsed = -1, lastPacketElapsed = -1;
    public long lastReceivedAt;
    public int min = Integer.MAX_VALUE, max, lastBpm;
    public double total, lastIntervalSeconds;
    public Boolean contact;
    public Integer energyKj;
    public List<Double> rrMillis = java.util.Collections.emptyList();

    public void accept(HeartRateMeasurement m, long elapsed, long wallTime) {
        packets++;
        if (lastPacketElapsed >= 0) lastIntervalSeconds = (elapsed - lastPacketElapsed) / 1000.0;
        lastPacketElapsed = elapsed;
        contact = m.contactDetected; energyKj = m.energyKj; rrMillis = m.rrMillis;
        if (Boolean.FALSE.equals(contact) || m.bpm == 0) { rrMillis = java.util.Collections.emptyList(); return; }
        if (firstElapsed < 0) firstElapsed = elapsed;
        samples++; lastBpm = m.bpm; lastElapsed = elapsed; lastReceivedAt = wallTime;
        min = Math.min(min, m.bpm); max = Math.max(max, m.bpm); total += m.bpm;
        points.add(new Point(elapsed, wallTime, m.bpm));
        if (points.size() > MAX_POINTS) points.remove(0);
    }
    public String freshness(boolean connected, long now) {
        if (!connected) return "DISCONNECTED";
        if (Boolean.FALSE.equals(contact)) return "CHECK WATCH FIT";
        if (lastElapsed < 0) return "WAITING FOR DATA";
        long age = Math.max(0, now - lastElapsed);
        if (age <= 5_000) return "LIVE";
        if (age <= 15_000) return "DELAYED";
        return "STALE";
    }
    public int average() { return samples == 0 ? 0 : (int)Math.round(total / samples); }
}
