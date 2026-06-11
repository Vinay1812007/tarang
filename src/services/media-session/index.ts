import type { Song } from '@/types';
import { bestImage } from '@/utils/images';
import { isNativePlatform } from '@/services/native';

export interface MediaHandlers {
  play(): void;
  pause(): void;
  next(): void;
  prev(): void;
  seekTo(seconds: number): void;
}

/**
 * Two backends behind one façade:
 *  - Web: the browser's Media Session API (lockscreen/hardware keys where the
 *    browser supports it).
 *  - Native (Capacitor Android): @jofr/capacitor-media-session, which runs a
 *    real MediaSessionService → playback notification with controls, Bluetooth
 *    /headset buttons, audio focus, and lockscreen seek bar.
 */
type NativePlugin = typeof import('@jofr/capacitor-media-session').MediaSession;

const native = isNativePlatform();
let pluginPromise: Promise<NativePlugin> | null = null;
let failureReported = false;

export interface MediaSessionLogEntry {
  ts: number;
  call: string;
  ok: boolean;
  detail?: string;
}

const log: MediaSessionLogEntry[] = [];

function record(call: string, ok: boolean, detail?: string): void {
  log.push({ ts: Date.now(), call, ok, detail });
  if (log.length > 12) log.shift();
}

/** Last native media-session call results — surfaced in Settings diagnostics. */
export function getMediaSessionLog(): MediaSessionLogEntry[] {
  return [...log].reverse();
}

function reportNativeFailure(err: unknown): void {
  if (import.meta.env.DEV) console.warn('[tarang:media-session]', err);
  if (!failureReported) {
    failureReported = true;
    // Surface once — a broken native media session should not be invisible.
    void import('@/store/toastStore').then(({ toast }) =>
      toast('Media controls unavailable on this device'),
    );
  }
}

function plugin(): Promise<NativePlugin> {
  if (!pluginPromise) {
    pluginPromise = import('@jofr/capacitor-media-session').then((m) => m.MediaSession);
  }
  return pluginPromise;
}

const webSupported = (): boolean => typeof navigator !== 'undefined' && 'mediaSession' in navigator;

export function setMediaHandlers(h: MediaHandlers): void {
  if (native) {
    void plugin().then(async (p) => {
      await p.setActionHandler({ action: 'play' }, () => h.play());
      await p.setActionHandler({ action: 'pause' }, () => h.pause());
      await p.setActionHandler({ action: 'nexttrack' }, () => h.next());
      await p.setActionHandler({ action: 'previoustrack' }, () => h.prev());
      await p.setActionHandler({ action: 'seekto' }, (d) => {
        if (d.seekTime != null) h.seekTo(d.seekTime);
      });
      await p.setActionHandler({ action: 'stop' }, () => h.pause());
      record('setActionHandlers', true);
    }).catch((err) => {
      record('setActionHandlers', false, String(err));
      reportNativeFailure(err);
    });
    return;
  }
  if (!webSupported()) return;
  const ms = navigator.mediaSession;
  try {
    ms.setActionHandler('play', () => h.play());
    ms.setActionHandler('pause', () => h.pause());
    ms.setActionHandler('nexttrack', () => h.next());
    ms.setActionHandler('previoustrack', () => h.prev());
    ms.setActionHandler('seekto', (e) => {
      if (e.seekTime != null) h.seekTo(e.seekTime);
    });
  } catch {
    /* per-browser handler support varies */
  }
}

export function updateMediaMetadata(song: Song | null): void {
  if (native) {
    if (!song) return;
    void plugin().then(async (p) => {
      const base = {
        title: song.title,
        artist: song.subtitle,
        album: song.album?.name ?? 'VinaX',
      };
      try {
        await p.setMetadata({
          ...base,
          artwork: [{ src: bestImage(song.images, 500), sizes: '500x500', type: 'image/jpeg' }],
        });
        record('setMetadata', true);
      } catch (err) {
        // Artwork download can fail natively (CDN/network) — never lose the
        // title/artist because of a missing image.
        record('setMetadata(artwork)', false, String(err));
        await p.setMetadata(base);
        record('setMetadata(no-art)', true);
      }
    }).catch((err) => {
      record('setMetadata', false, String(err));
      reportNativeFailure(err);
    });
    return;
  }
  if (!webSupported()) return;
  navigator.mediaSession.metadata = song
    ? new MediaMetadata({
        title: song.title,
        artist: song.subtitle,
        album: song.album?.name ?? 'VinaX',
        artwork: [{ src: bestImage(song.images, 500), sizes: '500x500', type: 'image/jpeg' }],
      })
    : null;
}

export function updatePlaybackState(playing: boolean): void {
  if (native) {
    void plugin()
      .then((p) =>
        p.setPlaybackState({ playbackState: playing ? 'playing' : 'paused' })
          .then(() => record(`setPlaybackState(${playing ? 'playing' : 'paused'})`, true)),
      )
      .catch((err) => {
        record('setPlaybackState', false, String(err));
        reportNativeFailure(err);
      });
    return;
  }
  if (!webSupported()) return;
  navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
}

// Throttle native bridge calls: timeupdate fires ~4×/s, the notification
// seek bar only needs ~1×/s.
let lastSentPosition = -10;

export function updatePositionState(duration: number, position: number, rate: number): void {
  if (!(duration > 0) || position > duration) return;
  if (native) {
    if (Math.abs(position - lastSentPosition) < 1) return;
    lastSentPosition = position;
    void plugin().then((p) => p.setPositionState({ duration, position, playbackRate: rate })).catch(reportNativeFailure);
    return;
  }
  if (!webSupported() || !navigator.mediaSession.setPositionState) return;
  try {
    navigator.mediaSession.setPositionState({ duration, position, playbackRate: rate });
  } catch {
    /* transient invalid states */
  }
}
