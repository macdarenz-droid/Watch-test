package com.marc.watch.core;

import org.junit.Test;
import static org.junit.Assert.*;

public class HeartRateMeasurementTest {
    @Test public void decodesUnsignedEightBitRate() {
        HeartRateMeasurement m=HeartRateMeasurement.parse(new byte[]{0,(byte)180});
        assertEquals(180,m.bpm);assertNull(m.contactDetected);assertNull(m.energyKj);assertTrue(m.rrMillis.isEmpty());
    }
    @Test public void decodesUnsignedSixteenBitRate() {assertEquals(300,HeartRateMeasurement.parse(new byte[]{1,44,1}).bpm);}
    @Test public void supportedContactWithoutDetectionIsFalse() {assertEquals(Boolean.FALSE,HeartRateMeasurement.parse(new byte[]{4,70}).contactDetected);}
    @Test public void supportedContactWithDetectionIsTrue() {assertEquals(Boolean.TRUE,HeartRateMeasurement.parse(new byte[]{6,70}).contactDetected);}
    @Test public void unsupportedContactBitIsIgnored() {assertNull(HeartRateMeasurement.parse(new byte[]{2,70}).contactDetected);}
    @Test public void decodesEnergyAndMultipleRrIntervals() {
        HeartRateMeasurement m=HeartRateMeasurement.parse(new byte[]{30,72,44,1,0,4,0,2});
        assertEquals(Integer.valueOf(300),m.energyKj);assertEquals(2,m.rrMillis.size());
        assertEquals(1000,m.rrMillis.get(0),0.001);assertEquals(500,m.rrMillis.get(1),0.001);
    }
    @Test public void rrZeroDoesNotBecomeARealInterval() {assertTrue(HeartRateMeasurement.parse(new byte[]{16,70,0,0}).rrMillis.isEmpty());}
    @Test public void zeroRateIsPreservedForSessionValidation() {assertEquals(0,HeartRateMeasurement.parse(new byte[]{0,0}).bpm);}
    @Test(expected=IllegalArgumentException.class) public void rejectsNull() {HeartRateMeasurement.parse(null);}
    @Test(expected=IllegalArgumentException.class) public void rejectsEmpty() {HeartRateMeasurement.parse(new byte[]{});}
    @Test(expected=IllegalArgumentException.class) public void rejectsShort16Bit() {HeartRateMeasurement.parse(new byte[]{1,44});}
    @Test(expected=IllegalArgumentException.class) public void rejectsShortEnergy() {HeartRateMeasurement.parse(new byte[]{8,60,2});}
    @Test(expected=IllegalArgumentException.class) public void rejectsMissingRr() {HeartRateMeasurement.parse(new byte[]{16,60});}
    @Test(expected=IllegalArgumentException.class) public void rejectsOddRr() {HeartRateMeasurement.parse(new byte[]{16,60,0,4,1});}
    @Test(expected=IllegalArgumentException.class) public void rejectsUnexpectedBytes() {HeartRateMeasurement.parse(new byte[]{0,60,5});}
}
