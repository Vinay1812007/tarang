import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Song } from '@/types';
import { KEYS } from '@/constants/storage-keys';
import { audioEngine, orderedSources } from '@/services/audio/engine';
import {
  setMediaHandlers,
  updateMediaMetadata,
  updatePlaybackState,
  updatePositionState,
} from '@/services/media-session';
import { recordComplete, recordPlay, recordQueueAdd, recordSkip } from '@/services/personalization/updater';
import { checkNotificationOnFirstPlay, haptic } from '@/services/native';
import { toast } from './toastStore';
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
  sleepAfterTrack: boolean;

  initEngine(): void;
  playQueue(songs: Song[], startIndex?: number): void;
  playSong(song: Song): void;
  playAt(index: number): void;
  startRadio(song: Song): void;
  enqueue(song: Song): void;
  enqueueNext(song: Song): void;
  enqueueAll(songs: Song[]): void;
  removeAt(index: number): void;
  moveInQueue(from: number, to: number): void;
  clearPlayed(): void;
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
  setSleepAfterTrack(v: boolean): void;
}

const SKIP_THRESHOLD = 0.3;
let engineInitialized = false;
/** Session-scoped played set: smart shuffle avoids repeats until exhausted. */
const sessionPlayed = new Set<string>();

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => {
      function preloadUpcoming(): void {
        const { queue, index, shuffle } = get();
        if (shuffle) return; // unknown next under shuffle
        const next = queue[index + 1];
        if (!next) return;
        const url = orderedSources(next, useSettingsStore.getState().audioQuality)[0] ?? null;
        audioEngine.preloadNext(url);
      }

      function startTrack(song: Song, autoplay: boolean): void {
        const quality = useSettingsStore.getState().audioQuality;
        audioEngine.load(song, quality, autoplay);
        updateMediaMetadata(song);
        if (autoplay) {
          sessionPlayed.add(song.id);
          recordPlay(song);
          useHistoryStore.getState().addPlay(song);
          // Android 13+: the playback notification needs this permission.
          void checkNotificationOnFirstPlay(toast);
          // Re-assert after the native service finishes binding — first-play
          // updates can otherwise race the service connection.
          window.setTimeout(() => {
            const cur = get();
            if (cur.queue[cur.index]?.id === song.id) {
              updateMediaMetadata(song);
              updatePlaybackState(cur.isPlaying);
            }
          }, 1200);
        }
        preloadUpcoming();
      }

      function maybeRecordSkip(manual: boolean): void {
        const { queue, index, currentTime, duration } = get();
        const song = queue[index];
        if (manual && song && duration > 0 && currentTime / duration < SKIP_THRESHOLD) {
          recordSkip(song, currentTime);
        }
      }

      async function appendSimilar(seed: Song): Promise<boolean> {
        const [{ similarToSong }, { loadProfile }, { useLibraryStore }, { resolvedRegion }] =
          await Promise.all([
            import('@/services/recommendation/engine'),
            import('@/services/personalization/storage'),
            import('./libraryStore'),
            import('./settingsStore'),
          ]);
        const settings = useSettingsStore.getState();
        const scored = await similarToSong(seed.id, {
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
        const fresh = scored.map((s) => s.candidate.song).filter((s) => !existing.has(s.id)).slice(0, 6);
        if (fresh.length) set({ queue: [...get().queue, ...fresh] });
        return fresh.length > 0;
      }

      function handleEnded(): void {
        const { queue, index, duration, repeat, sleepAt, sleepAfterTrack } = get();
        const song = queue[index];
        if (song) {
          recordComplete(song, duration);
          useHistoryStore.getState().markCompleted(song.id);
        }
        if (sleepAfterTrack || (sleepAt && Date.now() >= sleepAt)) {
          set({ sleepAt: null, sleepAfterTrack: false, isPlaying: false });
          audioEngine.pause();
          toast('Sleep timer: playback stopped');
          return;
        }
        if (repeat === 'one' && song) {
          audioEngine.seek(0);
          audioEngine.play();
          return;
        }
        get().next(false);
      }

      /** Smart shuffle: random among queue songs not yet played this session. */
      function pickShuffleIndex(): number {
        const { queue, index } = get();
        const unplayed = queue
          .map((s, i) => ({ s, i }))
          .filter(({ s, i }) => i !== index && !sessionPlayed.has(s.id));
        const pool = unplayed.length ? unplayed : queue.map((s, i) => ({ s, i })).filter(({ i }) => i !== index);
        return pool[Math.floor(Math.random() * pool.length)]?.i ?? index;
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
        sleepAfterTrack: false,

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
              // Re-push metadata with every state flip: if an earlier attempt
              // raced the service bind, this heals the notification.
              const current = get().queue[get().index];
              if (current) updateMediaMetadata(current);
            },
            onBuffering: (isBuffering) => set({ isBuffering }),
            onEnded: handleEnded,
            onFatalError: () => {
              toast('Stream unavailable — skipping');
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
          // Prefill the always-on media notification with the restored queue's
          // current song (instead of a blank panel) once the service binds.
          const restored = get().queue[get().index];
          if (restored) {
            window.setTimeout(() => {
              updateMediaMetadata(restored);
              updatePlaybackState(false);
            }, 1500);
          }
        },

        playQueue: (songs, startIndex = 0) => {
          if (!songs.length) return;
          set({ queue: songs, index: startIndex, currentTime: 0 });
          startTrack(songs[startIndex], true);
        },

        playSong: (song) => get().playQueue([song], 0),

        playAt: (index) => {
          const { queue } = get();
          if (index < 0 || index >= queue.length) return;
          maybeRecordSkip(true);
          set({ index, currentTime: 0 });
          startTrack(queue[index], true);
        },

        startRadio: (song) => {
          set({ queue: [song], index: 0, currentTime: 0, shuffle: false });
          startTrack(song, true);
          toast(`Radio started from “${song.title}”`);
          void appendSimilar(song);
        },

        enqueue: (song) => {
          const { queue } = get();
          if (queue.some((s) => s.id === song.id)) {
            toast('Already in queue');
            return;
          }
          recordQueueAdd(song);
          set({ queue: [...queue, song] });
          toast('Added to queue');
          if (queue.length === 0) get().playQueue([song]);
        },

        enqueueAll: (songs) => {
          const existing = new Set(get().queue.map((s) => s.id));
          const fresh = songs.filter((s) => !existing.has(s.id));
          if (!fresh.length) {
            toast('Already in queue');
            return;
          }
          set({ queue: [...get().queue, ...fresh] });
          toast(`Added ${fresh.length} songs to queue`);
          if (get().queue.length === fresh.length) startTrack(fresh[0], true);
        },

        enqueueNext: (song) => {
          const { queue, index } = get();
          recordQueueAdd(song);
          const filtered = queue.filter((s) => s.id !== song.id);
          const insertAt = Math.min(index + 1, filtered.length);
          set({ queue: [...filtered.slice(0, insertAt), song, ...filtered.slice(insertAt)] });
          toast('Playing next');
        },

        removeAt: (i) => {
          const { queue, index } = get();
          const next = queue.filter((_, idx) => idx !== i);
          set({
            queue: next,
            index: i < index ? index - 1 : Math.min(index, Math.max(next.length - 1, 0)),
          });
        },

        moveInQueue: (from, to) => {
          const { queue, index } = get();
          if (from === to || from < 0 || to < 0 || from >= queue.length || to >= queue.length) return;
          const next = [...queue];
          const [item] = next.splice(from, 1);
          next.splice(to, 0, item);
          let newIndex = index;
          if (index === from) newIndex = to;
          else if (from < index && to >= index) newIndex = index - 1;
          else if (from > index && to <= index) newIndex = index + 1;
          set({ queue: next, index: newIndex });
        },

        clearPlayed: () => {
          const { queue, index } = get();
          if (index <= 0) return;
          set({ queue: queue.slice(index), index: 0 });
          toast(`Removed ${index} played songs`);
        },

        clearQueue: () => {
          audioEngine.pause();
          set({ queue: [], index: 0, isPlaying: false, currentTime: 0, duration: 0 });
        },

        togglePlay: () => {
          const { isPlaying, queue, index } = get();
          const song = queue[index];
          if (!song) return;
          haptic('light');
          if (audioEngine.currentSongId !== song.id) {
            startTrack(song, true);
            return;
          }
          if (isPlaying) audioEngine.pause();
          else audioEngine.play();
        },

        next: (manual = false) => {
          const { queue, index, shuffle, repeat } = get();
          if (!queue.length) return;
          if (manual) haptic('light');
          maybeRecordSkip(manual);
          let nextIndex: number;
          if (shuffle && queue.length > 1) {
            nextIndex = pickShuffleIndex();
          } else {
            nextIndex = index + 1;
          }
          if (nextIndex >= queue.length) {
            if (repeat === 'all') {
              nextIndex = 0;
            } else if (useSettingsStore.getState().autoqueueSimilar && !manual) {
              const current = queue[index];
              void appendSimilar(current).then((added) => {
                if (added) get().next(false);
                else {
                  set({ isPlaying: false });
                  audioEngine.pause();
                }
              });
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
          haptic('light');
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
          set({ volume });
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

        setSleepTimer: (minutes) => {
          set({ sleepAt: minutes == null ? null : Date.now() + minutes * 60_000, sleepAfterTrack: false });
          if (minutes != null) toast(`Sleeping in ${minutes} min`);
        },

        setSleepAfterTrack: (v) => {
          set({ sleepAfterTrack: v, sleepAt: null });
          if (v) toast('Will stop after this song');
        },
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
