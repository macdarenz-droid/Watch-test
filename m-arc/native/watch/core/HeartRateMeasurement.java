package com.mrcdrnzz.dailytracker.watch.core;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Bluetooth SIG Heart Rate Measurement (0x2A37), little endian. No Android dependency. */
public final class HeartRateMeasurement {
    public final int bpm;
    public final Boolean contactDetected;
    public final Integer energyKj;
    public final List<Double> rrMillis;

    private HeartRateMeasurement(int bpm, Boolean contact, Integer energy, List<Double> rr) {
        this.bpm = bpm; this.contactDetected = contact; this.energyKj = energy;
        this.rrMillis = Collections.unmodifiableList(rr);
    }
    public static HeartRateMeasurement parse(byte[] bytes) {
        if (bytes == null || bytes.length < 2) throw new IllegalArgumentException("Short HR packet");
        int flags = bytes[0] & 255, offset = 1;
        boolean wide = (flags & 1) != 0;
        int bpm = wide ? u16(bytes, offset) : bytes[offset] & 255;
        offset += wide ? 2 : 1;
        Boolean contact = (flags & 4) != 0 ? (flags & 2) != 0 : null;
        Integer energy = null;
        if ((flags & 8) != 0) { energy = u16(bytes, offset); offset += 2; }
        List<Double> rr = new ArrayList<>();
        if ((flags & 16) != 0) {
            if (offset == bytes.length || (bytes.length - offset) % 2 != 0)
                throw new IllegalArgumentException("Incomplete RR interval");
            while (offset < bytes.length) {
                int value = u16(bytes, offset); offset += 2;
                if (value != 0) rr.add(value * 1000.0 / 1024.0);
            }
        } else if (offset != bytes.length) throw new IllegalArgumentException("Unexpected HR payload");
        return new HeartRateMeasurement(bpm, contact, energy, rr);
    }
    private static int u16(byte[] data, int offset) {
        if (offset + 1 >= data.length) throw new IllegalArgumentException("Truncated uint16");
        return (data[offset] & 255) | ((data[offset + 1] & 255) << 8);
    }
}
