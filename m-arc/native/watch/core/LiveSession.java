package com.mrcdrnzz.dailytracker.watch.core;

import java.util.ArrayList;
import java.util.List;

/** Receipt times are monotonic. They do NOT measure watch-to-phone end-to-end latency. */
public final class LiveSession {
    public record Point(long elapsed, long receivedAt, int bpm) {}
    public static final int MAX_POINTS = 900;
    public final List<Point> points = new ArrayList<>();
    public long packets, samples, firstElapsed = -1, lastElapsed = -1, lastPacketElapsed = -1;
    public int lastBpm;
    public double lastIntervalSeconds;
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
        samples++; lastBpm = m.bpm; lastElapsed = elapsed;
        points.add(new Point(elapsed, wallTime, m.bpm));
        if (points.size() > MAX_POINTS) points.remove(0);
    }
    public String freshness(boolean connected, long now) {
        if (!connected) return "DISCONNECTED";
        if (Boolean.FALSE.equals(contact)) return "CHECK_FIT";
        if (lastElapsed < 0) return "WAITING";
        long age = Math.max(0, now - lastElapsed);
        if (age <= 5_000) return "LIVE";
        if (age <= 15_000) return "DELAYED";
        return "STALE";
    }
}
