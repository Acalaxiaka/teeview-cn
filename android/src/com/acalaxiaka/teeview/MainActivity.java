package com.acalaxiaka.teeview;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.*;
import android.webkit.*;
import android.widget.Toast;

public class MainActivity extends Activity {
  private WebView web; private long lastBack = 0;

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    Window w = getWindow();
    w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);
    WindowManager.LayoutParams lp = w.getAttributes();
    if (Build.VERSION.SDK_INT >= 28) lp.layoutInDisplayCutoutMode = Build.VERSION.SDK_INT >= 30
        ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
    // 选择当前分辨率下最高刷新率
    try {
      Display d = Build.VERSION.SDK_INT >= 30 ? getDisplay() : w.getWindowManager().getDefaultDisplay();
      Display.Mode cur = d.getMode(), best = cur;
      for (Display.Mode m : d.getSupportedModes())
        if (m.getPhysicalWidth() == cur.getPhysicalWidth() && m.getPhysicalHeight() == cur.getPhysicalHeight() && m.getRefreshRate() > best.getRefreshRate()) best = m;
      lp.preferredDisplayModeId = best.getModeId();
      lp.preferredRefreshRate = best.getRefreshRate();
    } catch (Throwable ignored) {}
    w.setAttributes(lp);
    if (Build.VERSION.SDK_INT >= 30) w.setDecorFitsSystemWindows(false);

    web = new WebView(this);
    web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
    web.setOverScrollMode(View.OVER_SCROLL_NEVER);
    web.setBackgroundColor(0xff0c1018);
    web.setLongClickable(false);
    web.setOnLongClickListener(new View.OnLongClickListener(){ public boolean onLongClick(View v){ return true; }});
    web.setHapticFeedbackEnabled(true);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true);
    s.setAllowFileAccess(true); s.setTextZoom(100);
    s.setSupportZoom(false); s.setBuiltInZoomControls(false); s.setDisplayZoomControls(false);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setCacheMode(WebSettings.LOAD_NO_CACHE);
    s.setUseWideViewPort(true); s.setLoadWithOverviewMode(false);
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) { return !r.getUrl().toString().startsWith("file:///android_asset/"); }
    });
    setContentView(web);
    web.loadUrl("file:///android_asset/index.html");
    hideBars();
  }

  private void hideBars() {
    Window w = getWindow();
    if (Build.VERSION.SDK_INT >= 30) {
      WindowInsetsController c = w.getInsetsController();
      if (c != null) { c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
        c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE); }
    } else {
      w.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }
  }

  @Override public void onWindowFocusChanged(boolean f) { super.onWindowFocusChanged(f); if (f) hideBars(); }
  @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); hideBars(); }
  @Override protected void onPause() { if (web != null) web.onPause(); super.onPause(); }

  @Override public void onBackPressed() {
    // 先退出页面内全屏视图，否则双击返回退出
    web.evaluateJavascript("(function(){var e=document.querySelector('.full .fsb');if(e){e.click();return 1}return 0})()", new ValueCallback<String>(){
      public void onReceiveValue(String r){
        if ("1".equals(r)) return;
        long now = System.currentTimeMillis();
        if (now - lastBack < 2000) finish();
        else { lastBack = now; Toast.makeText(MainActivity.this, "再按一次返回键退出", Toast.LENGTH_SHORT).show(); }
      }
    });
  }

  @Override protected void onDestroy() { if (web != null) { web.destroy(); web = null; } super.onDestroy(); }
}
