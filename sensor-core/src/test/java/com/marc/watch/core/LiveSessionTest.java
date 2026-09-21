package com.marc.watch.core;

import org.junit.Test;
import static org.junit.Assert.*;

public class LiveSessionTest {
    private static HeartRateMeasurement hr(int value){return HeartRateMeasurement.parse(new byte[]{0,(byte)value});}
    @Test public void noFakeReadingBeforeFirstPacket(){LiveSession s=new LiveSession();assertEquals("WAITING FOR DATA",s.freshness(true,100));assertEquals(0,s.samples);}
    @Test public void freshnessTransitionsFollowMonotonicReceiptTime(){
        LiveSession s=new LiveSession();s.accept(hr(80),1000,3000000);
        assertEquals("LIVE",s.freshness(true,6000));assertEquals("DELAYED",s.freshness(true,6001));
        assertEquals("DELAYED",s.freshness(true,16000));assertEquals("STALE",s.freshness(true,16001));
        assertEquals("DISCONNECTED",s.freshness(false,1001));
    }
    @Test public void disconnectedStatusOverridesFreshPacket(){LiveSession s=new LiveSession();s.accept(hr(80),1000,1);assertEquals("DISCONNECTED",s.freshness(false,1001));}
    @Test public void repeatsAreValidNewReadings(){LiveSession s=new LiveSession();s.accept(hr(80),1000,1);s.accept(hr(80),3000,3);assertEquals(2,s.samples);assertEquals(2,s.lastIntervalSeconds,0);assertEquals("LIVE",s.freshness(true,7000));}
    @Test public void noContactDoesNotEnterChartOrKeepItLive(){
        LiveSession s=new LiveSession();s.accept(hr(80),1000,1);s.accept(HeartRateMeasurement.parse(new byte[]{4,90}),2000,2);
        assertEquals(1,s.samples);assertEquals(2,s.packets);assertEquals(80,s.lastBpm);assertEquals("CHECK WATCH FIT",s.freshness(true,2001));
    }
    @Test public void zeroRateDoesNotCreateFalseZeroOrRefreshAge(){LiveSession s=new LiveSession();s.accept(hr(80),1000,1);s.accept(hr(0),5000,2);assertEquals(1,s.samples);assertEquals(80,s.lastBpm);assertEquals("STALE",s.freshness(true,17000));}
    @Test public void sessionSummaryUsesAllSamplesNotOnlyChartBuffer(){
        LiveSession s=new LiveSession();s.accept(hr(50),0,0);for(int i=1;i<=1000;i++)s.accept(hr(100),i*1000L,i);
        assertEquals(900,s.points.size());assertEquals(1001,s.samples);assertEquals(50,s.min);assertEquals(100,s.max);assertEquals(100,s.average());
    }
    @Test public void wallClockChangesDoNotAffectFreshness(){LiveSession s=new LiveSession();s.accept(hr(80),1000,9999999);s.accept(hr(90),2000,100);assertEquals("LIVE",s.freshness(true,2001));assertEquals(1,s.lastIntervalSeconds,0);}
    @Test public void missingOptionalFieldsClearPreviousValues(){LiveSession s=new LiveSession();s.accept(HeartRateMeasurement.parse(new byte[]{24,60,1,0,0,4}),0,0);s.accept(hr(70),1000,1);assertNull(s.energyKj);assertTrue(s.rrMillis.isEmpty());}
    @Test public void newSessionContainsNoOldWatchData(){LiveSession first=new LiveSession();first.accept(hr(100),1,1);LiveSession next=new LiveSession();assertEquals(0,next.samples);assertEquals(-1,next.lastElapsed);assertTrue(next.points.isEmpty());}
}
