package __PKG__;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.content.Intent;
import android.os.Build;

/**
 * VinaX's own media-session bridge. Replaces the third-party plugin entirely.
 * JS calls setMetadata / setPlaybackState / setPosition; the plugin forwards
 * to VinaxMediaService (which owns the notification + MediaSession) and relays
 * hardware/notification/Bluetooth control events back to JS via "action".
 */
@CapacitorPlugin(name = "VinaxMedia")
public class VinaxMediaPlugin extends Plugin {

    @Override
    public void load() {
        VinaxMediaService.plugin = this;
    }

    /** Called by the service when a transport control is pressed. */
    public void emitAction(String action) {
        JSObject data = new JSObject();
        data.put("action", action);
        notifyListeners("action", data);
    }

    /** Called by the service on a lockscreen/Bluetooth seek. */
    public void emitSeek(double seconds) {
        JSObject data = new JSObject();
        data.put("action", "seekto");
        data.put("seekTime", seconds);
        notifyListeners("action", data);
    }

    private void startService(Intent intent) {
        intent.setClass(getContext(), VinaxMediaService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
    }

    @PluginMethod
    public void setMetadata(PluginCall call) {
        Intent i = new Intent(VinaxMediaService.ACTION_METADATA);
        i.putExtra("title", call.getString("title", ""));
        i.putExtra("artist", call.getString("artist", ""));
        i.putExtra("album", call.getString("album", ""));
        i.putExtra("artwork", call.getString("artwork", ""));
        startService(i);
        call.resolve();
    }

    @PluginMethod
    public void setPlaybackState(PluginCall call) {
        Intent i = new Intent(VinaxMediaService.ACTION_STATE);
        i.putExtra("playing", "playing".equals(call.getString("playbackState", "")));
        startService(i);
        call.resolve();
    }

    @PluginMethod
    public void setPosition(PluginCall call) {
        Intent i = new Intent(VinaxMediaService.ACTION_POSITION);
        i.putExtra("duration", call.getDouble("duration", 0.0));
        i.putExtra("position", call.getDouble("position", 0.0));
        i.putExtra("speed", call.getDouble("playbackRate", 1.0));
        startService(i);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent i = new Intent(VinaxMediaService.ACTION_STOP_SELF);
        startService(i);
        call.resolve();
    }
}
