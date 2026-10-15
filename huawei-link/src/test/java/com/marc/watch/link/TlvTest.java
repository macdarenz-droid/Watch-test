package com.marc.watch.link;

import static org.junit.Assert.*;

import org.junit.Test;

public class TlvTest {
    @Test public void encodesLengthsInBase128BigEndian() {
        assertEquals("7F", Hex.of(Tlv.encodeLength(127)));
        assertEquals("8100", Hex.of(Tlv.encodeLength(128)));
        assertEquals("822C", Hex.of(Tlv.encodeLength(300)));
    }

    @Test public void roundTripsShortEmptyAndLongValues() {
        byte[] longValue = new byte[300];
        for (int i = 0; i < longValue.length; i++) longValue[i] = (byte) i;
        byte[] encoded = new Tlv().put(0x01).put(0x05, (byte) 9, (byte) 8).put(0x7F, longValue).encode();
        Tlv decoded = Tlv.decode(encoded, 0, encoded.length);
        assertEquals(0, decoded.get(0x01).length);
        assertArrayEquals(new byte[] {9, 8}, decoded.get(0x05));
        assertArrayEquals(longValue, decoded.get(0x7F));
        assertNull(decoded.get(0x02));
        assertEquals(Long.valueOf(0x0908), decoded.number(0x05));
    }

    @Test(expected = IllegalArgumentException.class) public void rejectsAValueThatRunsPastTheEnd() {
        Tlv.decode(new byte[] {0x05, 0x04, 0x01}, 0, 3);
    }

    @Test public void ignoresATrailingZeroPadByte() {
        Tlv decoded = Tlv.decode(new byte[] {0x01, 0x01, 0x07, 0x00}, 0, 4);
        assertEquals(1, decoded.tags().size());
    }
}
