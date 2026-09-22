package com.mrcdrnzz.dailytracker;

import java.util.ArrayList;
import java.util.List;
import java.util.TreeMap;

/** Pure metrics shared by live SQLite summaries and backup recomputation. */
final class HeartRateMetrics {
    static final long MAX_CAPTURE_MS = 5_000, LOST_AFTER_MS = 15_000;
    static final long MAX_EPOCH_MS = 8_640_000_000_000_000L;

    static final class Sample {
        final int bpm;
        final long epoch, elapsed;
        final Boolean contact;
        Sample(int bpm, long epoch, long elapsed, Boolean contact) {
            this.bpm = bpm; this.epoch = epoch; this.elapsed = elapsed; this.contact = contact;
        }
        boolean valid() { return bpm >= 20 && bpm <= 260 && validEpoch(epoch) && elapsed >= 0 && elapsed <= 9_007_199_254_740_991L && !Boolean.FALSE.equals(contact); }
    }

    static final class Summary {
        boolean knownBounds;
        int count, peak, gapCount;
        long capturedMs, durationMs, first, last;
        Integer averageBpm, coveragePct;
    }

    static boolean validEpoch(long value) { return value >= 0 && value <= MAX_EPOCH_MS; }

    static Summary summarize(List<Sample> samples, Long startedAt, Long endedAt, int explicitGaps) {
        Summary out = new Summary(); out.gapCount = Math.max(0, explicitGaps);
        out.knownBounds = startedAt != null && endedAt != null && validEpoch(startedAt) && validEpoch(endedAt) && endedAt >= startedAt;
        if (out.knownBounds) out.durationMs = endedAt - startedAt;
        TreeMap<Long, Sample> unique = new TreeMap<>();
        for (Sample sample : samples) {
            if (validEpoch(sample.epoch) && (!out.knownBounds || (sample.epoch >= startedAt && sample.epoch < endedAt))) unique.put(sample.epoch, sample);
        }
        List<Sample> ordered = new ArrayList<>(unique.values());
        double weighted = 0, legacySum = 0;
        for (int i = 0; i < ordered.size(); i++) {
            Sample sample = ordered.get(i);
            if (!sample.valid()) continue;
            if (out.count == 0) out.first = sample.epoch;
            else if (sample.epoch - out.last > LOST_AFTER_MS) out.gapCount++;
            out.last = sample.epoch; out.count++; out.peak = Math.max(out.peak, sample.bpm); legacySum += sample.bpm;
            if (out.knownBounds) {
                long next = i + 1 < ordered.size() ? ordered.get(i + 1).epoch : endedAt;
                long duration = Math.min(MAX_CAPTURE_MS, Math.min(next - sample.epoch, endedAt - sample.epoch));
                out.capturedMs += duration; weighted += sample.bpm * (double) duration;
            }
        }
        if (out.count > 0) out.averageBpm = (int) Math.round(out.knownBounds ? weighted / out.capturedMs : legacySum / out.count);
        if (out.knownBounds && out.durationMs > 0) out.coveragePct = (int) Math.round(out.capturedMs * 100.0 / out.durationMs);
        return out;
    }
}
