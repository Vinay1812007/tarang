import type { Song } from '@/types';
import { bestImage } from '@/utils/images';

export interface MediaHandlers {
  play(): void;
  pause(): void;
  next(): void;
  prev(): void;
  seekTo(seconds: number): void;
}

const supported = (): boolean => typeof navigator !== 'undefined' && 'mediaSession' in navigator;

export function setMediaHandlers(h: MediaHandlers): void {
  if (!supported()) return;
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
    // Individual handlers may be unsupported per-browser — fine.
  }
}

export function updateMediaMetadata(song: Song | null): void {
  if (!supported()) return;
  if (!song) {
    navigator.mediaSession.metadata = null;
    return;
  }
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.subtitle,
    album: song.album?.name ?? 'Tarang',
    artwork: [{ src: bestImage(song.images, 500), sizes: '500x500', type: 'image/jpeg' }],
  });
}

export function updatePlaybackState(playing: boolean): void {
  if (!supported()) return;
  navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
}

export function updatePositionState(duration: number, position: number, rate: number): void {
  if (!supported() || !navigator.mediaSession.setPositionState) return;
  try {
    if (duration > 0 && position <= duration) {
      navigator.mediaSession.setPositionState({ duration, position, playbackRate: rate });
    }
  } catch {
    /* ignore invalid transient states */
  }
}
