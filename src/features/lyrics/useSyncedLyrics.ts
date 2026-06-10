import { useQuery } from '@tanstack/react-query';
import type { Song } from '@/types';
import { getLyrics } from '@/services/api';
import { fetchLrclibLyrics, type LyricsResult } from '@/services/lyrics/lrclib';

/**
 * Lyrics resolution chain: LRCLIB synced → LRCLIB plain → upstream wrapper
 * plain. Synced lyrics enable the live-highlight view in the player.
 */
export function useSyncedLyrics(song: Song | null | undefined) {
  return useQuery<LyricsResult | null>({
    queryKey: ['lyrics-v2', song?.id],
    enabled: !!song,
    staleTime: 60 * 60_000,
    retry: false,
    queryFn: async () => {
      if (!song) return null;
      const artist = song.artists[0]?.name ?? song.subtitle.split(',')[0] ?? '';
      const lrc = await fetchLrclibLyrics(song.title, artist, song.duration);
      if (lrc) return lrc;
      try {
        const upstream = await getLyrics(song.id);
        if (upstream.lyrics) return { plain: upstream.lyrics, synced: null, source: 'upstream' };
      } catch {
        /* upstream lyrics missing — normal */
      }
      return null;
    },
  });
}
