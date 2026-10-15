package com.marc.watch.link;

/** CRC-16/XMODEM (polynomial 0x1021, initial value 0): the checksum that ends every Huawei link frame. */
public final class Crc16 {
    private Crc16() {}

    public static int of(byte[] data, int offset, int length) {
        int crc = 0;
        for (int i = offset; i < offset + length; i++) {
            crc ^= (data[i] & 255) << 8;
            for (int bit = 0; bit < 8; bit++) crc = ((crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xFFFF;
        }
        return crc;
    }
}
