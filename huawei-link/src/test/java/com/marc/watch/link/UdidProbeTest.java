package com.marc.watch.link;

import static org.junit.Assert.*;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;

public class UdidProbeTest {
    static final String PHONE_ID = "00112233445566778899AABBCCDDEEFF";
    static final String UDID = "A1B2C3D4E5F60718293A4B5C6D7E8F90A1B2C3D4E5F60718293A4B5C6D7E8F90";

    @Test public void readsTheUdidInThreeRequests() {
        UdidProbe probe = new UdidProbe(PHONE_ID, "SM-F766B");
        assertEquals(FrameTest.LINK_PARAMS_REQUEST, Hex.of(probe.start()));
        assertEquals(UdidProbe.Step.LINK_PARAMS, probe.step());

        byte[] status = probe.onFrame(reply(0x01, new Tlv().put(0x01, (byte) 2).put(0x07, (byte) 2).put(0x0C, (byte) 1)));
        assertEquals(UdidProbe.Step.DEVICE_STATUS, probe.step());
        Frame statusRequest = only(status);
        assertEquals(0x16, statusRequest.command);
        assertEquals(Arrays.asList(0x01), statusRequest.tlv.tags());

        Frame security = only(probe.onFrame(reply(0x16, new Tlv().put(0x01, (byte) 1))));
        assertEquals(0x33, security.command);
        assertEquals(Arrays.asList(0x01, 0x02, 0x05, 0x03, 0x04, 0x0D), security.tlv.tags());
        assertEquals(Long.valueOf(2), security.tlv.number(0x01));
        assertEquals(PHONE_ID, new String(security.tlv.get(0x05), StandardCharsets.US_ASCII));

        assertNull(probe.onFrame(reply(0x33, new Tlv().put(0x01, (byte) 1).put(0x05, UDID.getBytes(StandardCharsets.US_ASCII)))));
        assertEquals(UdidProbe.Step.DONE, probe.step());
        assertEquals(UDID, probe.udid());
    }

    @Test public void authModeFourSendsThePhoneModel() {
        UdidProbe probe = new UdidProbe(PHONE_ID, "SM-F766B");
        probe.start();
        probe.onFrame(reply(0x01, new Tlv().put(0x07, (byte) 4)));
        Frame security = only(probe.onTimeout());
        assertEquals(Arrays.asList(0x01, 0x02, 0x05, 0x03, 0x04, 0x06, 0x07), security.tlv.tags());
        assertEquals(Long.valueOf(4), security.tlv.number(0x01));
        assertEquals("SM-F766B", new String(security.tlv.get(0x07), StandardCharsets.UTF_8));
    }

    @Test public void failsWhenTheReplyHasNoUdid() {
        UdidProbe probe = atSecurity();
        probe.onFrame(reply(0x33, new Tlv().put(0x05, (byte) 1, (byte) 2)));
        assertEquals(UdidProbe.Step.FAILED, probe.step());
        assertEquals("Tag 05 is 2 bytes, not a 64-character UDID: 0102", probe.failure());
        assertNull(probe.udid());
    }

    @Test public void failsWhenTheUdidIsNotHex() {
        UdidProbe probe = atSecurity();
        byte[] notHex = UDID.replace('A', 'Z').getBytes(StandardCharsets.US_ASCII);
        probe.onFrame(reply(0x33, new Tlv().put(0x05, notHex)));
        assertEquals(UdidProbe.Step.FAILED, probe.step());
    }

    @Test public void ignoresUnrelatedFramesWhileWaiting() {
        UdidProbe probe = new UdidProbe(PHONE_ID, "");
        probe.start();
        assertNull(probe.onFrame(reply(0x02, new Tlv().put(0x01))));
        assertNull(probe.onFrame(only(Frame.encode(0x27, 0x01, new Tlv().put(0x01)))));
        assertEquals(UdidProbe.Step.LINK_PARAMS, probe.step());
    }

    @Test public void timeoutOnLinkParamsOrSecurityFails() {
        UdidProbe probe = new UdidProbe(PHONE_ID, "");
        probe.start();
        assertNull(probe.onTimeout());
        assertEquals("No reply to link parameters", probe.failure());
        UdidProbe second = atSecurity();
        assertNull(second.onTimeout());
        assertEquals("No reply to security negotiation", second.failure());
    }

    @Test(expected = IllegalArgumentException.class) public void rejectsAPhoneIdThatIsNotHex() {
        new UdidProbe("not-hex", "");
    }

    private static UdidProbe atSecurity() {
        UdidProbe probe = new UdidProbe(PHONE_ID, "");
        probe.start();
        probe.onFrame(reply(0x01, new Tlv().put(0x07, (byte) 2)));
        probe.onTimeout();
        assertEquals(UdidProbe.Step.SECURITY, probe.step());
        return probe;
    }

    private static Frame reply(int command, Tlv tlv) { return only(Frame.encode(0x01, command, tlv)); }

    private static Frame only(byte[] bytes) {
        assertNotNull(bytes);
        List<Frame> frames = new Frame.Decoder().push(bytes, bytes.length);
        assertEquals(1, frames.size());
        return frames.get(0);
    }
}
