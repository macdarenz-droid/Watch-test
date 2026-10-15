package com.marc.watch.link;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;

/** Huawei link TLV list: 1-byte tag, base-128 big-endian length, value. Keeps insertion order. No Android dependency. */
public final class Tlv {
    private final List<Integer> tags = new ArrayList<>();
    private final List<byte[]> values = new ArrayList<>();

    public Tlv put(int tag, byte... value) {
        if (tag < 0 || tag > 255) throw new IllegalArgumentException("Tag out of range: " + tag);
        tags.add(tag); values.add(value.clone());
        return this;
    }

    public byte[] get(int tag) {
        int i = tags.indexOf(tag);
        return i < 0 ? null : values.get(i).clone();
    }

    /** The value as an unsigned big-endian number, or null when the tag is absent, empty or longer than 4 bytes. */
    public Long number(int tag) {
        byte[] v = get(tag);
        if (v == null || v.length == 0 || v.length > 4) return null;
        long n = 0;
        for (byte b : v) n = (n << 8) | (b & 255);
        return n;
    }

    public List<Integer> tags() { return new ArrayList<>(tags); }

    public byte[] encode() {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (int i = 0; i < tags.size(); i++) {
            byte[] v = values.get(i);
            out.write(tags.get(i));
            byte[] length = encodeLength(v.length);
            out.write(length, 0, length.length);
            out.write(v, 0, v.length);
        }
        return out.toByteArray();
    }

    public static Tlv decode(byte[] data, int offset, int length) {
        Tlv tlv = new Tlv();
        int at = offset, end = offset + length;
        while (at < end) {
            int tag = data[at++] & 255;
            if (at == end && tag == 0) break; // a trailing zero byte is padding, not a tag
            int size = 0, groups = 0;
            while (true) {
                if (at >= end) throw new IllegalArgumentException("TLV length runs past the end at tag " + tag);
                int b = data[at++] & 255;
                size = (size << 7) | (b & 0x7F);
                if (++groups > 4) throw new IllegalArgumentException("TLV length too long at tag " + tag);
                if ((b & 0x80) == 0) break;
            }
            if (size > end - at) throw new IllegalArgumentException("TLV value runs past the end at tag " + tag);
            byte[] v = new byte[size];
            System.arraycopy(data, at, v, 0, size);
            tlv.put(tag, v);
            at += size;
        }
        return tlv;
    }

    static byte[] encodeLength(int value) {
        int groups = 1;
        for (int v = value >>> 7; v != 0; v >>>= 7) groups++;
        byte[] out = new byte[groups];
        for (int i = groups - 1; i >= 0; i--) {
            out[i] = (byte) ((value & 0x7F) | (i == groups - 1 ? 0 : 0x80));
            value >>>= 7;
        }
        return out;
    }

    @Override public String toString() {
        StringBuilder s = new StringBuilder();
        for (int i = 0; i < tags.size(); i++) {
            if (s.length() > 0) s.append(' ');
            s.append(String.format("%02X=", tags.get(i))).append(Hex.of(values.get(i)));
        }
        return s.toString();
    }
}
