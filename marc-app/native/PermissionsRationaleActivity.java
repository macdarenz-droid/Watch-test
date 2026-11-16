package com.mrcdrnzz.dailytracker;

import android.app.Activity;
import android.os.Bundle;
import android.text.method.LinkMovementMethod;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

public class PermissionsRationaleActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        int pad = (int) (24 * getResources().getDisplayMetrics().density);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(pad, pad, pad, pad);
        root.setGravity(Gravity.CENTER_VERTICAL);
        root.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        TextView title = new TextView(this);
        title.setText("M•ARC Health permissions");
        title.setTextSize(22);
        title.setPadding(0, 0, 0, pad / 2);

        TextView body = new TextView(this);
        body.setText("M•ARC reads Health Connect data only to show your own dashboard values such as steps, sleep, heart rate and active calories. Data stays on your device unless you explicitly export it. You can change Health Connect permissions at any time in Android settings.");
        body.setTextSize(16);
        body.setMovementMethod(LinkMovementMethod.getInstance());

        root.addView(title);
        root.addView(body);
        setContentView(root);
    }
}
