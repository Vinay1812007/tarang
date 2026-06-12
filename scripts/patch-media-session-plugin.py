"""
CI patches for @jofr/capacitor-media-session. Both are idempotent and assert
loudly if the plugin source changes shape, so version drift can't be silent.

Patch 1 — setMetadata must survive artwork failures.
Upstream, a failed artwork load throws and rejects the whole call, losing
title/artist with it (empty notification).

Patch 2 — MediaSessionService.update() must run on the main thread.
Capacitor invokes plugin methods on a background handler thread; OEM skins
(MIUI/HyperOS notably) silently ignore MediaSessionCompat + notification
updates from non-main threads. update() is the single render funnel, so one
self-post guard fixes metadata, playback state, position, and actions at once.
"""
import re
import sys

PLUGIN = 'node_modules/@jofr/capacitor-media-session/android/src/main/java/io/github/jofr/capacitor/mediasessionplugin/MediaSessionPlugin.java'
SERVICE = 'node_modules/@jofr/capacitor-media-session/android/src/main/java/io/github/jofr/capacitor/mediasessionplugin/MediaSessionService.java'

NEW_METHOD = '''public void setMetadata(PluginCall call) {
        title = call.getString("title", title);
        artist = call.getString("artist", artist);
        album = call.getString("album", album);

        try {
            final JSArray artworkArray = call.getArray("artwork");
            if (artworkArray != null) {
                final List<JSONObject> artworkList = artworkArray.toList();
                for (JSONObject artworkEntry : artworkList) {
                    String src = artworkEntry.getString("src");
                    if (src != null) {
                        Bitmap loaded = urlToBitmap(src);
                        if (loaded != null) { this.artwork = loaded; }
                    }
                }
            }
        } catch (Exception e) {
            // Artwork must never take down title/artist with it.
            Log.w(TAG, "setMetadata: artwork load failed: " + e.getMessage());
        }

        if (service != null) { updateServiceMetadata(); }
        call.resolve();
    }'''


def patch_plugin() -> None:
    src = open(PLUGIN).read()
    if 'artwork must never take down' in src.lower():
        print('plugin: already patched')
        return
    pattern = re.compile(
        r"public void setMetadata\(PluginCall call\) throws JSONException, IOException \{.*?call\.resolve\(\);\s*\n\s*\}",
        re.S,
    )
    if not pattern.search(src):
        print('::error::media-session plugin source changed — update scripts/patch-media-session-plugin.py')
        sys.exit(1)
    open(PLUGIN, 'w').write(pattern.sub(NEW_METHOD, src, count=1))
    print('plugin: setMetadata hardened (artwork errors cannot reject the call)')


def patch_service() -> None:
    svc = open(SERVICE).read()
    if 'self-post to main thread' in svc:
        print('service: already patched')
        return
    if 'import android.os.IBinder;' not in svc:
        print('::error::service imports changed — update scripts/patch-media-session-plugin.py')
        sys.exit(1)
    svc = svc.replace(
        'import android.os.IBinder;',
        'import android.os.Handler;\nimport android.os.IBinder;\nimport android.os.Looper;',
        1,
    )
    anchor = '@SuppressLint("RestrictedApi")\n    public void update() {'
    if anchor not in svc:
        print('::error::service update() signature changed — update scripts/patch-media-session-plugin.py')
        sys.exit(1)
    svc = svc.replace(
        anchor,
        anchor + '''
        // self-post to main thread: OEM skins (MIUI/HyperOS) drop session and
        // notification updates issued from Capacitor's plugin thread.
        if (Looper.myLooper() != Looper.getMainLooper()) {
            new Handler(Looper.getMainLooper()).post(this::update);
            return;
        }''',
        1,
    )
    open(SERVICE, 'w').write(svc)
    print('service: update() now self-posts to main thread')


patch_plugin()
patch_service()
