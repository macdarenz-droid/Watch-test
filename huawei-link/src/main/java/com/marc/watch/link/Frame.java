package com.marc.watch.link;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * One Huawei link frame: 0x5A, big-endian length, slice flag, [slice index], service, command, TLV, CRC-16.
 * The length counts the slice flag (and index) plus the body. The CRC covers every byte before it.
 * Flag 0 is a whole message; 1, 2 and 3 are its first, middle and last slices.
 */
public final class Frame {
    public static final int MAGIC = 0x5A;
    private static final int MAX_LENGTH = 4096;

    public final int service, command;
    /** Service, command and TLV bytes, as reassembled. */
    public final byte[] body;
    /** Null when the TLV did not decode; {@link #tlvError} then says why. */
    public final Tlv tlv;
    public final String tlvError;

    private Frame(byte[] body) {
        this.body = body;
        this.service = body[0] & 255;
        this.command = body[1] & 255;
        Tlv parsed = null; String error = null;
        try { parsed = Tlv.decode(body, 2, body.length - 2); } catch (IllegalArgumentException e) { error = e.getMessage(); }
        this.tlv = parsed; this.tlvError = error;
    }

    /** A whole, unsliced frame. Every request this tool sends fits in one. */
    public static byte[] encode(int service, int command, Tlv tlv) {
        byte[] t = tlv.encode();
        int length = 1 + 2 + t.length;
        byte[] out = new byte[3 + length + 2];
        out[0] = (byte) MAGIC;
        out[1] = (byte) (length >>> 8); out[2] = (byte) length;
        out[3] = 0;
        out[4] = (byte) service; out[5] = (byte) command;
        System.arraycopy(t, 0, out, 6, t.length);
        int crc = Crc16.of(out, 0, out.length - 2);
        out[out.length - 2] = (byte) (crc >>> 8); out[out.length - 1] = (byte) crc;
        return out;
    }

    /** Turns a byte stream into frames. Bytes can arrive split or joined in any way. */
    public static final class Decoder {
        private byte[] buffer = new byte[0];
        private ByteArrayOutputStream slices;
        /** Plain-language notes about bytes that were dropped. Read and clear them as you like. */
        public final List<String> notes = new ArrayList<>();

        public List<Frame> push(byte[] chunk, int length) {
            byte[] joined = new byte[buffer.length + length];
            System.arraycopy(buffer, 0, joined, 0, buffer.length);
            System.arraycopy(chunk, 0, joined, buffer.length, length);
            buffer = joined;
            List<Frame> frames = new ArrayList<>();
            int at = 0;
            while (true) {
                int start = at;
                while (at < buffer.length && (buffer[at] & 255) != MAGIC) at++;
                if (at > start) notes.add("Skipped " + (at - start) + " bytes before a frame start");
                if (buffer.length - at < 3) break;
                int declared = ((buffer[at + 1] & 255) << 8) | (buffer[at + 2] & 255);
                if (declared < 3 || declared > MAX_LENGTH) { notes.add("Dropped a byte: frame length " + declared + " is not plausible"); at++; continue; }
                int total = 3 + declared + 2;
                if (buffer.length - at < total) break;
                int expected = ((buffer[at + total - 2] & 255) << 8) | (buffer[at + total - 1] & 255);
                int actual = Crc16.of(buffer, at, total - 2);
                if (expected != actual) { notes.add(String.format("Dropped a byte: checksum %04X, expected %04X", actual, expected)); at++; continue; }
                int flag = buffer[at + 3] & 255;
                boolean sliced = flag >= 1 && flag <= 3;
                int bodyStart = at + (sliced ? 5 : 4), bodyEnd = at + 3 + declared;
                at += total;
                if (bodyEnd < bodyStart) { notes.add("Dropped a frame with no body"); continue; }
                if (!sliced) { addFrame(frames, buffer, bodyStart, bodyEnd - bodyStart); continue; }
                if (flag == 1) slices = new ByteArrayOutputStream();
                if (slices == null) { notes.add("Dropped a slice that arrived without its first slice"); continue; }
                slices.write(buffer, bodyStart, bodyEnd - bodyStart);
                if (flag == 3) { byte[] whole = slices.toByteArray(); slices = null; addFrame(frames, whole, 0, whole.length); }
            }
            byte[] rest = new byte[buffer.length - at];
            System.arraycopy(buffer, at, rest, 0, rest.length);
            buffer = rest;
            return frames;
        }

        private void addFrame(List<Frame> frames, byte[] data, int offset, int length) {
            if (length < 2) { notes.add("Dropped a frame shorter than service and command"); return; }
            byte[] body = new byte[length];
            System.arraycopy(data, offset, body, 0, length);
            frames.add(new Frame(body));
        }
    }

    @Override public String toString() {
        return String.format("%02X/%02X ", service, command) + (tlv != null ? tlv.toString() : "raw " + Hex.of(body, 2, body.length - 2) + " (" + tlvError + ")");
    }
}
