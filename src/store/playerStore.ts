import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Song } from '@/types';
import { KEYS } from '@/constants/storage-keys';
import { audioEngine } from '@/services/audio/engine';
import {
  setMediaHandlers,
  updateMediaMetadata,
  updatePlaybackState,
  updatePositionState,
} from '@/services/media-session';
import { recordComplete, recordPlay, recordQueueAdd, recordSkip } from '@/services/personalization/updater';
import { useHistoryStore } from './historyStore';
import { useSettingsStore } from './settingsStore';

export type RepeatMode = 'off' | 'one' | 'all';

export interface PlayerState {
  queue: Song[];
  index: number;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  repeat: RepeatMode;
  shuffle: boolean;
  volume: number;
  muted: boolean;
  rate: number;
  sleepAt: number | null;

  initEngine(): void;
  playQueue(songs: Song[], startIndex?: number): void;
  playSong(song: Song): void;
  playAt(index: number): void;
  enqueue(song: Song): void;
  enqueueNext(song: Song): void;
  removeAt(index: number): void;
  clearQueue(): void;
  togglePlay(): void;
  next(manual?: boolean): void;
  prev(): void;
  seek(seconds: number): void;
  setVolume(v: number): void;
  toggleMute(): void;
  setRate(r: number): void;
  cycleRepeat(): void;
  toggleShuffle(): void;
  setSleepTimer(minutes: number | null): void;
}

const SKIP_THRESHOLD = 0.3;
let engineInitialized = false;

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => {
      function startTrack(song: Song, autoplay: boolean): void {
        const quality = useSettingsStore.getState().audioQuality;
        audioEngine.load(song, quality, autoplay);
        updateMediaMetadata(song);
        if (autoplay) {
          recordPlay(song);
          useHistoryStore.getState().addPlay(song);
        }
      }

      function maybeRecordSkip(manual: boolean): void {
        const { queue, index, currentTime, duration } = get();
        const song = queue[index];
        if (manual && song && duration > 0 && currentTime / duration < SKIP_THRESHOLD) {
          recordSkip(song, currentTime);
        }
      }

      async function autoqueueSimilar(): Promise<void> {
        const { queue, index } = get();
        const song = queue[index];
        if (!song) return;
        // Lazy imports keep the recommendation engine out of the player's
        // critical path and avoid module cycles.
        const [{ similarToSong }, { loadProfile }, { useLibraryStore }, { resolvedRegion }] =
          await Promise.all([
            import('@/services/recommendation/engine'),
            import('@/services/personalization/storage'),
            import('./libraryStore'),
            import('./settingsStore'),
          ]);
        const settings = useSettingsStore.getState();
        const scored = await similarToSong(song.id, {
          profile: loadProfile(),
          hour: new Date().getHours(),
          region: resolvedRegion(),
          pinnedLanguages: settings.pinnedLanguages,
          mutedLanguages: settings.mutedLanguages,
          intensity: settings.recommendationIntensity,
          favorites: useLibraryStore.getState().favorites,
          history: useHistoryStore.getState().entries,
        });
        const existing = new Set(get().queue.map((s) => s.id));
        const fresh = scored.map((s) => s.candidate.song).filter((s) => !existing.has(s.id)).slice(0, 5);
        if (fresh.length) {
          set({ queue: [...get().queue, ...fresh] });
          get().next(false);
        }
      }

      function handleEnded(): void {
        const { queue, index, duration, repeat, sleepAt } = get();
        const song = queue[index];
        if (song) {
          recordComplete(song, duration);
          useHistoryStore.getState().markCompleted(song.id);
        }
        if (sleepAt && Date.now() >= sleepAt) {
          set({ sleepAt: null, isPlaying: false });
          audioEngine.pause();
          return;
        }
        if (repeat === 'one' && song) {
          audioEngine.seek(0);
          audioEngine.play();
          return;
        }
        get().next(false);
      }

      return {
        queue: [],
        index: 0,
        isPlaying: false,
        isBuffering: false,
        currentTime: 0,
        duration: 0,
        repeat: 'off',
        shuffle: false,
        volume: 1,
        muted: false,
        rate: 1,
        sleepAt: null,

        initEngine: () => {
          if (engineInitialized) return;
          engineInitialized = true;
          audioEngine.init({
            onTime: (currentTime, duration) => {
              set({ currentTime, duration });
              updatePositionState(duration, currentTime, get().rate);
            },
            onPlayState: (isPlaying) => {
              set({ isPlaying });
              updatePlaybackState(isPlaying);
            },
            onBuffering: (isBuffering) => set({ isBuffering }),
            onEnded: handleEnded,
            onFatalError: () => {
              // Every source for this song failed — move on rather than stall.
              if (get().queue.length > 1) get().next(false);
              else set({ isPlaying: false, isBuffering: false });
            },
          });
          const { volume, muted, rate } = get();
          audioEngine.setVolume(volume);
          audioEngine.setMuted(muted);
          audioEngine.setRate(rate);
          setMediaHandlers({
            play: () => get().togglePlay(),
            pause: () => get().togglePlay(),
            next: () => get().next(true),
            prev: () => get().prev(),
            seekTo: (s) => get().seek(s),
          });
        },

        playQueue: (songs, startIndex = 0) => {
          if (!songs.length) return;
          set({ queue: songs, index: startIndex, currentTime: 0 });
          startTrack(songs[startIndex], true);
        },

        playSong: (song) => {
          get().playQueue([song], 0);
        },

        playAt: (index) => {
          const { queue } = get();
          if (index < 0 || index >= queue.length) return;
          maybeRecordSkip(true);
          set({ index, currentTime: 0 });
          startTrack(queue[index], true);
        },

        enqueue: (song) => {
          const { queue } = get();
          if (queue.some((s) => s.id === song.id)) return;
          recordQueueAdd(song);
          set({ queue: [...queue, song] });
          if (queue.length === 0) get().playQueue([song]);
        },

        enqueueNext: (song) => {
          const { queue, index } = get();
          recordQueueAdd(song);
          const filtered = queue.filter((s) => s.id !== song.id);
          const insertAt = Math.min(index + 1, filtered.length);
          set({ queue: [...filtered.slice(0, insertAt), song, ...filtered.slice(insertAt)] });
        },

        removeAt: (i) => {
          const { queue, index } = get();
          const next = queue.filter((_, idx) => idx !== i);
          set({ queue: next, index: i < index ? index - 1 : Math.min(index, Math.max(next.length - 1, 0)) });
        },

        clearQueue: () => {
          audioEngine.pause();
          set({ queue: [], index: 0, isPlaying: false, currentTime: 0, duration: 0 });
        },

        togglePlay: () => {
          const { isPlaying, queue, index } = get();
          const song = queue[index];
          if (!song) return;
          if (audioEngine.currentSongId !== song.id) {
            // Rehydrated queue: engine has nothing loaded yet.
            startTrack(song, true);
            return;
          }
          if (isPlaying) audioEngine.pause();
          else audioEngine.play();
        },

        next: (manual = false) => {
          const { queue, index, shuffle, repeat } = get();
          if (!queue.length) return;
          maybeRecordSkip(manual);
          let nextIndex: number;
          if (shuffle && queue.length > 1) {
            do {
              nextIndex = Math.floor(Math.random() * queue.length);
            } while (nextIndex === index);
          } else {
            nextIndex = index + 1;
          }
          if (nextIndex >= queue.length) {
            if (repeat === 'all') {
              nextIndex = 0;
            } else if (useSettingsStore.getState().autoqueueSimilar && !manual) {
              void autoqueueSimilar();
              return;
            } else {
              set({ isPlaying: false });
              audioEngine.pause();
              return;
            }
          }
          set({ index: nextIndex, currentTime: 0 });
          startTrack(queue[nextIndex], true);
        },

        prev: () => {
          const { queue, index, currentTime } = get();
          if (!queue.length) return;
          if (currentTime > 3 || index === 0) {
            audioEngine.seek(0);
            return;
          }
          set({ index: index - 1, currentTime: 0 });
          startTrack(queue[index - 1], true);
        },

        seek: (seconds) => {
          audioEngine.seek(seconds);
          set({ currentTime: seconds });
        },

        setVolume: (v) => {
          const volume = Math.min(1, Math.max(0, v));
          audioEngine.setVolume(volume);
          set({ volume, muted: volume === 0 ? get().muted : false });
          if (volume > 0) audioEngine.setMuted(false);
        },

        toggleMute: () => {
          const muted = !get().muted;
          audioEngine.setMuted(muted);
          set({ muted });
        },

        setRate: (rate) => {
          audioEngine.setRate(rate);
          set({ rate });
        },

        cycleRepeat: () => {
          const order: RepeatMode[] = ['off', 'all', 'one'];
          const next = order[(order.indexOf(get().repeat) + 1) % order.length];
          set({ repeat: next });
        },

        toggleShuffle: () => set({ shuffle: !get().shuffle }),

        setSleepTimer: (minutes) =>
          set({ sleepAt: minutes == null ? null : Date.now() + minutes * 60_000 }),
      };
    },
    {
      name: KEYS.player,
      storage: createJSONStorage(() => window.localStorage),
      partialize: (s) => ({
        queue: s.queue,
        index: s.index,
        repeat: s.repeat,
        shuffle: s.shuffle,
        volume: s.volume,
        muted: s.muted,
        rate: s.rate,
      }),
    },
  ),
);

export function useCurrentSong(): Song | null {
  return usePlayerStore((s) => s.queue[s.index] ?? null);
}
