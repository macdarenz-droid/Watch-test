package com.marc.watch.link;

import static org.junit.Assert.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;

public class FrameTest {
    /** Gadgetbridge's TestDeviceConfig.testLinkParamsRequest vector. */
    static final String LINK_PARAMS_REQUEST = "5A000B0001010100020003000400F13B";
    /** Gadgetbridge's TestDeviceConfig.testLinkParamsResponse vector. */
    static final String LINK_PARAMS_REPLY = "5A001B000101030200140512" + "00016AA296E37641B10CF8AAF747055D0AA3" + "E89F";

    @Test public void encodesLinkParamsLikeGadgetbridge() {
        byte[] frame = Frame.encode(1, 1, new Tlv().put(1).put(2).put(3).put(4));
        assertEquals(LINK_PARAMS_REQUEST, Hex.of(frame));
    }

    @Test public void decodesLinkParamsReply() {
        List<Frame> frames = new Frame.Decoder().push(Hex.parse(LINK_PARAMS_REPLY), Hex.parse(LINK_PARAMS_REPLY).length);
        assertEquals(1, frames.size());
        Frame f = frames.get(0);
        assertEquals(1, f.service); assertEquals(1, f.command);
        assertEquals(Arrays.asList(0x03, 0x05), f.tlv.tags());
        assertEquals(Long.valueOf(0x14), f.tlv.number(0x03));
        assertEquals(18, f.tlv.get(0x05).length);
        assertEquals(1, f.tlv.get(0x05)[1]);
    }

    @Test public void dropsAFrameWithABadChecksum() {
        byte[] bad = Hex.parse(LINK_PARAMS_REPLY);
        bad[12] ^= 1;
        Frame.Decoder decoder = new Frame.Decoder();
        assertTrue(decoder.push(bad, bad.length).isEmpty());
        assertTrue(decoder.notes.get(0).startsWith("Dropped a byte: checksum"));
    }

    @Test public void readsFramesSplitAndJoinedAnyWay() {
        byte[] one = Hex.parse(LINK_PARAMS_REPLY), two = Frame.encode(1, 0x16, new Tlv().put(1, (byte) 2));
        byte[] stream = new byte[one.length + two.length];
        System.arraycopy(one, 0, stream, 0, one.length);
        System.arraycopy(two, 0, stream, one.length, two.length);
        Frame.Decoder decoder = new Frame.Decoder();
        List<Frame> frames = new ArrayList<>();
        for (byte b : stream) frames.addAll(decoder.push(new byte[] {b}, 1));
        assertEquals(2, frames.size());
        assertEquals(0x16, frames.get(1).command);
        assertTrue(decoder.notes.isEmpty());
        assertEquals(2, new Frame.Decoder().push(stream, stream.length).size());
    }

    @Test public void skipsBytesBeforeAFrame() {
        byte[] frame = Hex.parse(LINK_PARAMS_REQUEST), noisy = new byte[frame.length + 3];
        noisy[0] = 0x11; noisy[1] = 0x22; noisy[2] = 0x33;
        System.arraycopy(frame, 0, noisy, 3, frame.length);
        Frame.Decoder decoder = new Frame.Decoder();
        assertEquals(1, decoder.push(noisy, noisy.length).size());
        assertEquals("Skipped 3 bytes before a frame start", decoder.notes.get(0));
    }

    @Test public void joinsSlicesIntoOneMessage() {
        byte[] body = new byte[2 + 66];
        body[0] = 0x01; body[1] = 0x33; body[2] = 0x05; body[3] = 64;
        for (int i = 0; i < 64; i++) body[4 + i] = (byte) "0123456789ABCDEF".charAt(i % 16);
        Frame.Decoder decoder = new Frame.Decoder();
        assertTrue(push(decoder, slice(1, 0, body, 0, 20)).isEmpty());
        assertTrue(push(decoder, slice(2, 1, body, 20, 30)).isEmpty());
        List<Frame> frames = push(decoder, slice(3, 2, body, 50, 18));
        assertEquals(1, frames.size());
        assertEquals(0x33, frames.get(0).command);
        assertEquals(64, frames.get(0).tlv.get(0x05).length);
    }

    @Test public void dropsAMiddleSliceWithoutAFirst() {
        byte[] body = {0x01, 0x33, 0x05, 0x00};
        Frame.Decoder decoder = new Frame.Decoder();
        assertTrue(push(decoder, slice(3, 1, body, 0, 4)).isEmpty());
        assertEquals("Dropped a slice that arrived without its first slice", decoder.notes.get(0));
    }

    private static List<Frame> push(Frame.Decoder decoder, byte[] bytes) { return decoder.push(bytes, bytes.length); }

    private static byte[] slice(int flag, int index, byte[] body, int offset, int length) {
        int declared = 2 + length;
        byte[] out = new byte[3 + declared + 2];
        out[0] = 0x5A; out[1] = (byte) (declared >>> 8); out[2] = (byte) declared;
        out[3] = (byte) flag; out[4] = (byte) index;
        System.arraycopy(body, offset, out, 5, length);
        int crc = Crc16.of(out, 0, out.length - 2);
        out[out.length - 2] = (byte) (crc >>> 8); out[out.length - 1] = (byte) crc;
        return out;
    }
}
