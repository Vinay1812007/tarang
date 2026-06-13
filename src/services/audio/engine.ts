import type { Song } from '@/types';

export type AudioQualityPref = 'low' | 'medium' | 'high';

const QUALITY_ORDER: Record<AudioQualityPref, string[]> = {
  low: ['96kbps', '48kbps', '160kbps', '320kbps'],
  medium: ['160kbps', '96kbps', '320kbps', '48kbps'],
  high: ['320kbps', '160kbps', '96kbps', '48kbps'],
};

/** Order a song's audio variants by the user's quality preference. */
export function orderedSources(song: Song, pref: AudioQualityPref): string[] {
  const order = QUALITY_ORDER[pref];
  return [...song.audio]
    .sort((a, b) => {
      const ia = order.indexOf(a.quality);
      const ib = order.indexOf(b.quality);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })
    .map((v) => v.url)
    .filter(Boolean);
}

export interface EngineCallbacks {
  onTime(current: number, duration: number): void;
  onPlayState(playing: boolean): void;
  onBuffering(buffering: boolean): void;
  onEnded(): void;
  /** All audio sources for the current song failed. */
  onFatalError(songId: string): void;
}

/**
 * Singleton playback engine over a single HTMLAudioElement. Owns source
 * fallback (a bad CDN URL silently advances to the next quality variant),
 * keeps listeners attached exactly once, and reports state upward through
 * callbacks — the Zustand player store is the single consumer.
 */
class AudioEngine {
  private el: HTMLAudioElement | null = null;
  private cb: EngineCallbacks | null = null;
  private song: Song | null = null;
  private sources: string[] = [];
  private sourceIdx = 0;
  private wantAutoplay = false;

  init(cb: EngineCallbacks): void {
    this.cb = cb;
    if (this.el) return;
    const el = new Audio();
    el.preload = 'auto';
    el.addEventListener('timeupdate', () =>
      this.cb?.onTime(el.currentTime, Number.isFinite(el.duration) ? el.duration : 0),
    );
    el.addEventListener('durationchange', () =>
      this.cb?.onTime(el.currentTime, Number.isFinite(el.duration) ? el.duration : 0),
    );
    el.addEventListener('play', () => this.cb?.onPlayState(true));
    el.addEventListener('pause', () => this.cb?.onPlayState(false));
    el.addEventListener('waiting', () => this.cb?.onBuffering(true));
    el.addEventListener('playing', () => this.cb?.onBuffering(false));
    el.addEventListener('canplay', () => this.cb?.onBuffering(false));
    el.addEventListener('ended', () => this.cb?.onEnded());
    el.addEventListener('error', () => this.advanceSource());
    this.el = el;
  }

  get currentSongId(): string | null {
    return this.song?.id ?? null;
  }

  load(song: Song, pref: AudioQualityPref, autoplay: boolean): void {
    if (!this.el) return;
    this.song = song;
    this.sources = orderedSources(song, pref);
    this.sourceIdx = 0;
    this.wantAutoplay = autoplay;
    this.wantAutoplay = autoplay;
    if (this.sources.length === 0) {
      this.cb?.onFatalError(song.id);
      return;
    }
    this.applySource();
  }

  private applySource(): void {
    if (!this.el || !this.song) return;
    this.cb?.onBuffering(true);
    this.el.src = this.sources[this.sourceIdx];
    this.el.load();
    if (this.wantAutoplay) {
      void this.el.play().catch(() => {
        // Autoplay policy rejection — surface paused state, user taps play.
        this.cb?.onPlayState(false);
        this.cb?.onBuffering(false);
      });
    }
  }

  private advanceSource(): void {
    if (!this.song) return;
    if (this.sourceIdx < this.sources.length - 1) {
      this.sourceIdx += 1;
      this.applySource();
    } else {
      this.cb?.onBuffering(false);
      this.cb?.onFatalError(this.song.id);
    }
  }

  /** Retry the current song with freshly-fetched URLs (details refetch). */
  reloadWithSources(urls: string[]): boolean {
    if (!this.el || !this.song || urls.length === 0) return false;
    this.sources = urls;
    this.sourceIdx = 0;
    this.applySource();
    return true;
  }

  play(): void {
    void this.el?.play().catch(() => this.cb?.onPlayState(false));
  }

  pause(): void {
    this.el?.pause();
  }

  seek(seconds: number): void {
    if (this.el && Number.isFinite(seconds)) this.el.currentTime = Math.max(0, seconds);
  }

  /** User-intended volume; fades animate el.volume toward this. */
  private targetVolume = 1;
  private fadeTimer: number | null = null;

  setVolume(v: number): void {
    this.targetVolume = Math.min(1, Math.max(0, v));
    this.cancelFade();
    if (this.el) this.el.volume = this.targetVolume;
  }

  private cancelFade(): void {
    if (this.fadeTimer != null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  /** Ramp el.volume from `from` to `to` over `ms`, then run `done`. */
  private fade(from: number, to: number, ms: number, done?: () => void): void {
    if (!this.el) return;
    this.cancelFade();
    const steps = Math.max(1, Math.round(ms / 50));
    let i = 0;
    this.el.volume = Math.min(1, Math.max(0, from));
    this.fadeTimer = window.setInterval(() => {
      i += 1;
      const t = i / steps;
      if (this.el) this.el.volume = Math.min(1, Math.max(0, from + (to - from) * t));
      if (i >= steps) {
        this.cancelFade();
        done?.();
      }
    }, 50);
  }

  /** Fade the current track up from silence (crossfade-in on track start). */
  fadeIn(ms = 1200): void {
    this.fade(0, this.targetVolume, ms);
  }

  /** Fade the current track out to silence (crossfade tail). */
  fadeOut(ms = 1200): void {
    this.fade(this.el?.volume ?? this.targetVolume, 0, ms);
  }

  /** Sleep-fade: ramp to silence then pause + callback. */
  fadeOutAndPause(ms: number, done: () => void): void {
    if (!this.el) {
      done();
      return;
    }
    this.fade(this.el.volume, 0, ms, () => {
      this.el?.pause();
      if (this.el) this.el.volume = this.targetVolume; // restore for next play
      done();
    });
  }

  setMuted(m: boolean): void {
    if (this.el) this.el.muted = m;
  }

  setRate(r: number): void {
    if (this.el) this.el.playbackRate = r;
  }

  /**
   * Prefetch the likely-next track's audio so track changes feel instant.
   * Uses a detached, muted element — never plays, never fires callbacks.
   */
  private preloadEl: HTMLAudioElement | null = null;

  preloadNext(url: string | null): void {
    if (!url) return;
    if (!this.preloadEl) {
      this.preloadEl = new Audio();
      this.preloadEl.muted = true;
      this.preloadEl.preload = 'auto';
    }
    if (this.preloadEl.src !== url) this.preloadEl.src = url;
  }

  destroy(): void {
    if (this.el) {
      this.el.pause();
      this.el.src = '';
    }
    this.el = null;
    this.cb = null;
    this.song = null;
  }
}

export const audioEngine = new AudioEngine();
