"""
CI patch: make @jofr/capacitor-media-session's setMetadata unbreakable.

Upstream, a failed artwork load (network hiccup, odd URI) throws and rejects
the WHOLE call — title and artist are lost with it, leaving an empty media
notification. This rewrite isolates artwork errors so text metadata always
lands. Asserts loudly if the plugin source changes shape.
"""
import re
import sys

PATH = 'node_modules/@jofr/capacitor-media-session/android/src/main/java/io/github/jofr/capacitor/mediasessionplugin/MediaSessionPlugin.java'

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

src = open(PATH).read()
pattern = re.compile(
    r"public void setMetadata\(PluginCall call\) throws JSONException, IOException \{.*?call\.resolve\(\);\s*\n\s*\}",
    re.S,
)
if 'artwork must never take down' in src.lower():
    print('already patched')
    sys.exit(0)
if not pattern.search(src):
    print('::error::media-session plugin source changed — update scripts/patch-media-session-plugin.py')
    sys.exit(1)
src = pattern.sub(NEW_METHOD, src, count=1)
open(PATH, 'w').write(src)
print('plugin setMetadata patched: artwork errors can no longer reject the call')
