package com.mrcdrnzz.dailytracker;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.text.method.LinkMovementMethod;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

// Health Connect's privacy screen. PLAY-1 (D-LR23-4): it displays the policy itself, from the same URL as the
// Play Console privacy policy field; the short summary below stays on screen until the page loads, and stays
// as the fallback when it can't (offline or an HTTP error).
public class PermissionsRationaleActivity extends Activity {
    static final String PRIVACY_POLICY_URL = "https://macdarenz-droid.github.io/M-arc/privacy/";

    private WebView web;
    private View fallback;
    private boolean failed;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        int pad = (int) (24 * getResources().getDisplayMetrics().density);
        FrameLayout frame = new FrameLayout(this);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(pad, pad, pad, pad);
        root.setGravity(Gravity.CENTER_VERTICAL);

        TextView title = new TextView(this);
        title.setText("M/ARC Health permissions");
        title.setTextSize(22);
        title.setPadding(0, 0, 0, pad / 2);

        TextView body = new TextView(this);
        body.setText("M/ARC reads steps, sleep, heart rate, resting heart rate and active calories from Health Connect to show your dashboard and readiness. The data is stored on this device, and Android's device backup may include this app's data. If you turn on Escobar and its 'Share health data' switch, the numbers Escobar needs for an answer are sent to our coaching service (Anthropic's Claude API) for that answer only. You can turn sharing off in Settings, and change Health Connect permissions at any time in Android settings.");
        body.setTextSize(16);
        body.setMovementMethod(LinkMovementMethod.getInstance());

        root.addView(title);
        root.addView(body);
        fallback = root;

        web = new WebView(this);
        web.setVisibility(View.INVISIBLE);
        web.getSettings().setJavaScriptEnabled(false);
        web.getSettings().setAllowFileAccess(false);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                failed = false;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showFallback();
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame()) showFallback();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (failed) return;
                web.setVisibility(View.VISIBLE);
                fallback.setVisibility(View.GONE);
            }

            // Only the policy page itself loads here; any other link opens in the browser.
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (u.toString().startsWith(PRIVACY_POLICY_URL)) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (Exception ignored) {
                    // No app can open it: stay on the policy.
                }
                return true;
            }
        });

        ViewGroup.LayoutParams fill = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT);
        frame.addView(root, fill);
        frame.addView(web, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(frame);

        web.loadUrl(PRIVACY_POLICY_URL);
    }

    private void showFallback() {
        failed = true;
        web.setVisibility(View.INVISIBLE);
        fallback.setVisibility(View.VISIBLE);
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            ViewGroup parent = (ViewGroup) web.getParent();
            if (parent != null) parent.removeView(web);
            web.destroy();
        }
        super.onDestroy();
    }
}
