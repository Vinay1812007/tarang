import { registerPlugin } from '@capacitor/core';
import type { Song } from '@/types';
import { bestImage } from '@/utils/images';
import { artworkDataUrl } from '@/utils/artwork';
import { isNativePlatform } from '@/services/native';

export interface MediaHandlers {
  play(): void;
  pause(): void;
  next(): void;
  prev(): void;
  seekTo(seconds: number): void;
}

export interface MediaSessionLogEntry {
  ts: number;
  call: string;
  ok: boolean;
  detail?: string;
}

/** VinaX's own native plugin (android/native-android/VinaxMediaPlugin.java). */
interface VinaxMediaPlugin {
  setMetadata(o: { title: string; artist: string; album: string; artwork: string }): Promise<void>;
  setPlaybackState(o: { playbackState: 'playing' | 'paused' | 'none' }): Promise<void>;
  setPosition(o: { duration: number; position: number; playbackRate: number }): Promise<void>;
  stop(): Promise<void>;
  addListener(
    event: 'action',
    cb: (data: { action: string; seekTime?: number }) => void,
  ): Promise<{ remove: () => void }>;
}

const native = isNativePlatform();
const VinaxMedia = native ? registerPlugin<VinaxMediaPlugin>('VinaxMedia') : null;

const log: MediaSessionLogEntry[] = [];
function record(call: string, ok: boolean, detail?: string): void {
  log.push({ ts: Date.now(), call, ok, detail });
  if (log.length > 12) log.shift();
}
export function getMediaSessionLog(): MediaSessionLogEntry[] {
  return [...log].reverse();
}

void (async () => {
  try {
    const { Capacitor } = await import('@capacitor/core');
    record(
      `env: platform=${Capacitor.getPlatform()} native=${native} pluginAvailable=${Capacitor.isPluginAvailable('VinaxMedia')}`,
      native && Capacitor.isPluginAvailable('VinaxMedia'),
    );
  } catch (err) {
    record('env-check', false, String(err));
  }
})();

const webSupported = (): boolean => typeof navigator !== 'undefined' && 'mediaSession' in navigator;

export function setMediaHandlers(h: MediaHandlers): void {
  if (native && VinaxMedia) {
    void VinaxMedia.addListener('action', (d) => {
      switch (d.action) {
        case 'play': h.play(); break;
        case 'pause': h.pause(); break;
        case 'nexttrack': h.next(); break;
        case 'previoustrack': h.prev(); break;
        case 'stop': h.pause(); break;
        case 'seekto': if (d.seekTime != null) h.seekTo(d.seekTime); break;
      }
    }).then(() => record('addListener(action)', true)).catch((e) => record('addListener', false, String(e)));
    return;
  }
  if (!webSupported()) return;
  const ms = navigator.mediaSession;
  try {
    ms.setActionHandler('play', () => h.play());
    ms.setActionHandler('pause', () => h.pause());
    ms.setActionHandler('nexttrack', () => h.next());
    ms.setActionHandler('previoustrack', () => h.prev());
    ms.setActionHandler('seekto', (e) => { if (e.seekTime != null) h.seekTo(e.seekTime); });
  } catch {
    /* per-browser support varies */
  }
}

export function updateMediaMetadata(song: Song | null): void {
  if (native && VinaxMedia) {
    if (!song) return;
    const artUrl = bestImage(song.images, 500);
    void artworkDataUrl(artUrl)
      .catch(() => null)
      .then((dataUri) =>
        VinaxMedia.setMetadata({
          title: song.title,
          artist: song.subtitle,
          album: song.album?.name ?? 'VinaX',
          artwork: dataUri ?? '',
        }),
      )
      .then(() => record('setMetadata', true))
      .catch((e) => record('setMetadata', false, String(e)));
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
  if (native && VinaxMedia) {
    void VinaxMedia.setPlaybackState({ playbackState: playing ? 'playing' : 'paused' })
      .then(() => record(`setPlaybackState(${playing ? 'playing' : 'paused'})`, true))
      .catch((e) => record('setPlaybackState', false, String(e)));
    return;
  }
  if (!webSupported()) return;
  navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
}

let lastSentPosition = -10;
export function updatePositionState(duration: number, position: number, rate: number): void {
  if (!(duration > 0) || position > duration) return;
  if (native && VinaxMedia) {
    if (Math.abs(position - lastSentPosition) < 1) return;
    lastSentPosition = position;
    void VinaxMedia.setPosition({ duration, position, playbackRate: rate }).catch(() => undefined);
    return;
  }
  if (!webSupported() || !navigator.mediaSession.setPositionState) return;
  try {
    navigator.mediaSession.setPositionState({ duration, position, playbackRate: rate });
  } catch {
    /* transient invalid states */
  }
}

export async function runNotificationSelfTest(): Promise<boolean> {
  if (!native || !VinaxMedia) return false;
  try {
    await VinaxMedia.setMetadata({ title: 'VinaX Test Tone', artist: 'Notification self-test', album: 'VinaX', artwork: '' });
    await VinaxMedia.setPlaybackState({ playbackState: 'playing' });
    record('selfTest(start)', true);
    window.setTimeout(() => {
      void VinaxMedia.setPlaybackState({ playbackState: 'paused' }).catch(() => undefined);
    }, 6000);
    return true;
  } catch (err) {
    record('selfTest', false, String(err));
    return false;
  }
}
