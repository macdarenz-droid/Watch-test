package com.marc.watch.link;

public final class Hex {
    private Hex() {}

    public static String of(byte[] bytes) { return of(bytes, 0, bytes.length); }

    public static String of(byte[] bytes, int offset, int length) {
        StringBuilder s = new StringBuilder(length * 2);
        for (int i = offset; i < offset + length; i++) s.append(String.format("%02X", bytes[i] & 255));
        return s.toString();
    }

    public static byte[] parse(String hex) {
        String h = hex.replaceAll("\\s", "");
        if (h.length() % 2 != 0) throw new IllegalArgumentException("Odd hex length");
        byte[] out = new byte[h.length() / 2];
        for (int i = 0; i < out.length; i++) out[i] = (byte) Integer.parseInt(h.substring(i * 2, i * 2 + 2), 16);
        return out;
    }
}
