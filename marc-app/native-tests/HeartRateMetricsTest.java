package com.mrcdrnzz.dailytracker;

import java.util.Arrays;
import java.util.Collections;

/** JVM regression checks; deliberately independent of Android and SQLite. */
public final class HeartRateMetricsTest {
    private static HeartRateMetrics.Sample sample(int bpm, long time) { return new HeartRateMetrics.Sample(bpm, time, Math.max(0, time), null); }
    private static void equal(Object actual, Object expected, String message) {
        if (!expected.equals(actual)) throw new AssertionError(message + ": expected " + expected + ", got " + actual);
    }
    public static void main(String[] args) {
        HeartRateMetrics.Summary sparse = HeartRateMetrics.summarize(Arrays.asList(sample(100, 0), sample(100, 5_000), sample(100, 10_000), sample(100, 15_000), sample(100, 20_000), sample(100, 25_000)), 0L, 30_000L, 0);
        equal(sparse.capturedMs, 30_000L, "five-second stream captured duration"); equal(sparse.coveragePct, 100, "five-second stream coverage");

        HeartRateMetrics.Summary weighted = HeartRateMetrics.summarize(Arrays.asList(sample(100, 0), sample(200, 1_000)), 0L, 6_000L, 0);
        equal(weighted.averageBpm, 183, "time-weighted average"); equal(weighted.capturedMs, 6_000L, "end clipping");

        HeartRateMetrics.Summary gaps = HeartRateMetrics.summarize(Arrays.asList(sample(100, 0), sample(100, 5_000), sample(100, 30_000)), 0L, 35_000L, 0);
        equal(gaps.capturedMs, 15_000L, "gap duration excluded"); equal(gaps.coveragePct, 43, "rounded coverage"); equal(gaps.gapCount, 1, "lost gap count");

        HeartRateMetrics.Summary contact = HeartRateMetrics.summarize(Arrays.asList(sample(100, 0), new HeartRateMetrics.Sample(250, 1_000, 1_000, false), sample(150, 3_000)), 0L, 5_000L, 0);
        equal(contact.count, 2, "poor contact excluded"); equal(contact.peak, 150, "poor contact peak excluded"); equal(contact.capturedMs, 3_000L, "poor contact ends prior interval"); equal(contact.averageBpm, 133, "good contact average");

        HeartRateMetrics.Summary bounds = HeartRateMetrics.summarize(Arrays.asList(sample(250, 0), sample(100, 1_000), sample(260, 2_000)), 1_000L, 2_000L, 0);
        equal(bounds.count, 1, "workout bounds"); equal(bounds.peak, 100, "out-of-session peak excluded");

        HeartRateMetrics.Summary duplicates = HeartRateMetrics.summarize(Arrays.asList(sample(100, 0), sample(150, 0), sample(200, 5_000)), 0L, 10_000L, 0);
        equal(duplicates.count, 2, "deduplicate timestamps"); equal(duplicates.averageBpm, 175, "last duplicate wins"); equal(duplicates.capturedMs, 10_000L, "no double coverage");
        HeartRateMetrics.Summary badDuplicate = HeartRateMetrics.summarize(Arrays.asList(sample(100, 0), new HeartRateMetrics.Sample(100, 0, 0, false)), 0L, 5_000L, 0);
        equal(badDuplicate.count, 0, "bad-contact duplicate replaces prior reading");

        HeartRateMetrics.Summary unordered = HeartRateMetrics.summarize(Arrays.asList(sample(140, 5_000), sample(400, 1_000), sample(100, 0)), 0L, 10_000L, 0);
        equal(unordered.capturedMs, 6_000L, "invalid packet interrupts capture"); equal(unordered.averageBpm, 133, "unordered samples sorted");

        HeartRateMetrics.Summary legacy = HeartRateMetrics.summarize(Arrays.asList(sample(100, 1_000), sample(200, 5_000)), null, null, 0);
        equal(legacy.knownBounds, false, "legacy bounds unknown");
        if (legacy.coveragePct != null) throw new AssertionError("legacy trace cannot manufacture coverage");
        equal(legacy.averageBpm, 150, "legacy readings remain accessible");

        HeartRateMetrics.Summary empty = HeartRateMetrics.summarize(Collections.emptyList(), 0L, 10_000L, 0);
        equal(empty.coveragePct, 0, "empty workout coverage"); equal(empty.count, 0, "empty workout count");
        System.out.println("Heart-rate native metrics checks passed (9 scenarios).");
    }
}
