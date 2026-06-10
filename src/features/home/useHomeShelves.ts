import { useQuery } from '@tanstack/react-query';
import { searchSongs } from '@/services/api';
import { trendingSeed, timeOfDaySeed } from '@/constants/seeds';
import { rankSongs } from '@/features/search/useSearch';
import { useSettingsStore } from '@/store/settingsStore';
import { useHistoryStore } from '@/store/historyStore';
import type { Song } from '@/types';

export function useTrendingForLanguage(language: string) {
  return useQuery({
    queryKey: ['trending', language],
    queryFn: async () => rankSongs(await searchSongs(trendingSeed(language), 20)),
    staleTime: 15 * 60_000,
  });
}

export function useTimeOfDayShelf() {
  const pinned = useSettingsStore((s) => s.pinnedLanguages);
  const lang = pinned[0] ?? 'hindi';
  const hour = new Date().getHours();
  const seed = timeOfDaySeed(hour, lang);
  const query = useQuery({
    queryKey: ['time-of-day', seed.query],
    queryFn: async () => rankSongs(await searchSongs(seed.query, 15)),
    staleTime: 30 * 60_000,
  });
  return { ...query, title: seed.title };
}

/** Unfinished + most recent listens, deduped — "pick up where you left off". */
export function useContinueListening(limit = 12): Song[] {
  const entries = useHistoryStore((s) => s.entries);
  const seen = new Set<string>();
  const out: Song[] = [];
  for (const e of entries) {
    if (seen.has(e.song.id)) continue;
    seen.add(e.song.id);
    out.push(e.song);
    if (out.length >= limit) break;
  }
  return out;
}
