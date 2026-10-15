package com.marc.watch.link;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Reads a Huawei lite-wearable watch's UDID with three unencrypted setup requests and nothing else:
 * link parameters (01/01), device status (01/16) and security negotiation (01/33).
 * The watch answers 01/33 with its UDID as 64 ASCII hex characters in tag 0x05.
 * The probe never starts authentication or binding, writes no settings and stops after that reply.
 * Field meanings follow Gadgetbridge's open-source Huawei support; this is an independent implementation.
 */
public final class UdidProbe {
    public enum Step { LINK_PARAMS, DEVICE_STATUS, SECURITY, DONE, FAILED }

    static final int SERVICE = 0x01, LINK_PARAMS = 0x01, DEVICE_STATUS = 0x16, SECURITY = 0x33;

    private final byte[] phoneId;
    private final String phoneModel;
    private Step step = Step.LINK_PARAMS;
    private int supportType = -1, encryptMethod = 0;
    private String udid, failure;
    public final List<String> log = new ArrayList<>();

    /** @param phoneId 32 random hex characters naming this phone for the one exchange; never stored by the watch unless binding completes. */
    public UdidProbe(String phoneId, String phoneModel) {
        if (phoneId == null || !phoneId.matches("[0-9A-Fa-f]{32}")) throw new IllegalArgumentException("phoneId must be 32 hex characters");
        this.phoneId = phoneId.getBytes(StandardCharsets.US_ASCII);
        this.phoneModel = phoneModel == null ? "" : phoneModel;
    }

    public Step step() { return step; }
    public String udid() { return udid; }
    public String failure() { return failure; }
    /** How long to wait for the reply to the request just sent. */
    public long timeoutMs() { return step == Step.DEVICE_STATUS ? 4_000 : 8_000; }

    public byte[] start() {
        return send(Frame.encode(SERVICE, LINK_PARAMS, new Tlv().put(0x01).put(0x02).put(0x03).put(0x04)), "link parameters");
    }

    /** @return the next request to send, or null to keep waiting (or because the probe has finished). */
    public byte[] onFrame(Frame frame) {
        if (step == Step.DONE || step == Step.FAILED) return null;
        log.add("Received " + frame);
        if (frame.service != SERVICE || frame.tlv == null) return null;
        if (step == Step.LINK_PARAMS && frame.command == LINK_PARAMS) {
            Long type = frame.tlv.number(0x07), method = frame.tlv.number(0x0C);
            supportType = type == null ? -1 : type.intValue();
            encryptMethod = method == null ? 0 : method.intValue();
            log.add("Link parameters: support type " + supportType + ", encrypt method " + encryptMethod);
            if (supportType < 1 || supportType > 4) log.add("Support type is outside 1-4; asking for the UDID anyway");
            step = Step.DEVICE_STATUS;
            return send(Frame.encode(SERVICE, DEVICE_STATUS, new Tlv().put(0x01)), "device status");
        }
        if (step == Step.DEVICE_STATUS && frame.command == DEVICE_STATUS) return security();
        if (step == Step.SECURITY && frame.command == SECURITY) {
            Long error = frame.tlv.number(0x7F);
            if (error != null) log.add("Reply error code " + error);
            byte[] value = frame.tlv.get(0x05);
            if (value != null && value.length == 64 && new String(value, StandardCharsets.US_ASCII).matches("[0-9A-Fa-f]{64}")) {
                udid = new String(value, StandardCharsets.US_ASCII);
                step = Step.DONE;
                log.add("UDID found in tag 05");
            } else {
                fail(value == null ? "The reply has no tag 05" : "Tag 05 is " + value.length + " bytes, not a 64-character UDID: " + Hex.of(value));
            }
        }
        return null;
    }

    /** @return the next request when the watch may skip this reply, or null when the probe has failed. */
    public byte[] onTimeout() {
        if (step == Step.DEVICE_STATUS) { log.add("No device status reply; continuing"); return security(); }
        if (step == Step.LINK_PARAMS || step == Step.SECURITY) fail("No reply to " + (step == Step.LINK_PARAMS ? "link parameters" : "security negotiation"));
        return null;
    }

    private byte[] security() {
        int authMode = supportType == 4 ? 4 : 2;
        Tlv tlv = new Tlv().put(0x01, (byte) authMode).put(0x02, (byte) 0x01).put(0x05, phoneId).put(0x03, (byte) 0x01).put(0x04, (byte) 0x00);
        if (authMode == 4) tlv.put(0x06).put(0x07, phoneModel.getBytes(StandardCharsets.UTF_8));
        if (encryptMethod == 1) tlv.put(0x0D, (byte) 0x01);
        step = Step.SECURITY;
        return send(Frame.encode(SERVICE, SECURITY, tlv), "security negotiation (auth mode " + authMode + ")");
    }

    private byte[] send(byte[] frame, String what) {
        log.add("Sending " + what + ": " + Hex.of(frame));
        return frame;
    }

    private void fail(String reason) {
        failure = reason; step = Step.FAILED;
        log.add("Failed: " + reason);
    }
}
