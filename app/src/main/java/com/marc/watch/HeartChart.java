package com.marc.watch;

import android.content.Context;
import android.graphics.*;
import android.os.SystemClock;
import android.view.View;
import com.marc.watch.core.LiveSession;
import java.util.*;

/** A time-scaled trace of received measurements, with gaps where data stopped. Not an ECG. */
final class HeartChart extends View {
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private LiveSession session;
    private boolean live;
    HeartChart(Context context) { super(context); setContentDescription("Heart-rate trend over the last two minutes"); }
    void show(LiveSession session,boolean live) { this.session = session; this.live = live; invalidate(); }
    @Override protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        float d = getResources().getDisplayMetrics().density;
        float left=32*d,right=getWidth()-6*d,top=12*d,bottom=getHeight()-22*d;
        long now = SystemClock.elapsedRealtime(), start = now-120_000;
        List<LiveSession.Point> visible = new ArrayList<>();
        if (session != null) for (LiveSession.Point p:session.points) if(p.elapsed()>=start) visible.add(p);
        int low=60,high=140;
        if (!visible.isEmpty()) {
            low = Math.max(0,(visible.stream().mapToInt(LiveSession.Point::bpm).min().orElse(60)-10)/10*10);
            high = Math.max(low+30,(visible.stream().mapToInt(LiveSession.Point::bpm).max().orElse(140)+19)/10*10);
        }
        paint.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL)); paint.setTextSize(10*d);
        for(int i=0;i<3;i++) {
            float y=top+(bottom-top)*i/2;
            paint.setColor(0xFF253430);paint.setStrokeWidth(d);canvas.drawLine(left,y,right,y,paint);
            paint.setColor(0xFF8DACA0);canvas.drawText(String.valueOf(high-(high-low)*i/2),0,y+3*d,paint);
        }
        paint.setColor(0xFF8DACA0);canvas.drawText("−2 min",left,getHeight()-2*d,paint);
        canvas.drawText("now",right-20*d,getHeight()-2*d,paint);
        if(visible.isEmpty()) {
            paint.setColor(0xFFA5B5AE);paint.setTextSize(12*d);
            String text="Your watch’s readings will appear here";
            canvas.drawText(text,left+(right-left-paint.measureText(text))/2,(top+bottom)/2,paint);return;
        }
        Path path=new Path();long previous=-1;float endX=0,endY=0;
        for(LiveSession.Point p:visible) {
            float x=left+(right-left)*(p.elapsed()-start)/120_000f;
            float y=bottom-(bottom-top)*(p.bpm()-low)/(float)(high-low);
            if(previous<0 || p.elapsed()-previous>15_000) path.moveTo(x,y);else path.lineTo(x,y);
            previous=p.elapsed();endX=x;endY=y;
        }
        paint.setStyle(Paint.Style.STROKE);paint.setStrokeJoin(Paint.Join.ROUND);paint.setStrokeCap(Paint.Cap.ROUND);
        paint.setStrokeWidth(2.5f*d);paint.setColor(live?0xFFAEF8CF:0xFF81968B);canvas.drawPath(path,paint);
        paint.setStyle(Paint.Style.FILL);canvas.drawCircle(endX,endY,4*d,paint);
    }
}
