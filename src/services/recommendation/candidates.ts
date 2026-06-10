import { getSongSuggestions, searchSongs } from '@/services/api';
import { topArtists, topLanguages } from '@/services/personalization/profile';
import { trendingSeed } from '@/constants/seeds';
import type { Candidate, RecommendationContext } from './types';

const REDISCOVERY_AGE_MS = 14 * 86_400_000;

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

/**
 * Gathers a wide candidate pool from local signals + upstream hints:
 * suggestions for recent listens/favorites, top-artist catalogs, trending
 * seeds for the user's languages, and rediscovery picks from old history.
 * Every fetch is individually fault-tolerant — a dead provider just shrinks
 * the pool, never breaks the shelf.
 */
export async function gatherCandidates(ctx: RecommendationContext): Promise<Candidate[]> {
  const tasks: Array<Promise<Candidate[]>> = [];

  // 1. Related to recent listens (strongest signal).
  const recentSongs = ctx.history.slice(0, 6);
  const uniqueRecent = recentSongs.filter(
    (e, i) => recentSongs.findIndex((x) => x.song.id === e.song.id) === i,
  ).slice(0, 3);
  for (const entry of uniqueRecent) {
    tasks.push(
      safe(getSongSuggestions(entry.song.id, 12), []).then((songs) =>
        songs.map((song) => ({ song, source: 'related' as const, seedTitle: entry.song.title })),
      ),
    );
  }

  // 2. Related to favorites.
  for (const fav of ctx.favorites.slice(0, 3)) {
    tasks.push(
      safe(getSongSuggestions(fav.id, 10), []).then((songs) =>
        songs.map((song) => ({ song, source: 'related' as const, seedTitle: fav.title })),
      ),
    );
  }

  // 3. Favorite-artist catalogs.
  for (const { affinity } of topArtists(ctx.profile, 3)) {
    tasks.push(
      safe(searchSongs(affinity.name, 10), []).then((songs) =>
        songs.map((song) => ({ song, source: 'favorite-artist' as const, seedTitle: affinity.name })),
      ),
    );
  }

  // 4. Trending in the user's languages (also the cold-start backbone).
  const langs = new Set<string>([
    ...topLanguages(ctx.profile, 2).map((l) => l.id),
    ...ctx.pinnedLanguages.slice(0, 3),
  ]);
  if (langs.size === 0) langs.add('hindi').add('english');
  for (const lang of langs) {
    if (ctx.mutedLanguages.includes(lang)) continue;
    tasks.push(
      safe(searchSongs(trendingSeed(lang), 15), []).then((songs) =>
        songs.map((song) => ({ song, source: 'trending' as const })),
      ),
    );
  }

  // 5. Rediscovery: completed listens older than two weeks (no fetch needed).
  const cutoff = Date.now() - REDISCOVERY_AGE_MS;
  const rediscovery: Candidate[] = ctx.history
    .filter((e) => e.completed && e.ts < cutoff)
    .slice(0, 15)
    .map((e) => ({ song: e.song, source: 'rediscovery' as const }));

  const settled = await Promise.allSettled(tasks);
  const pool: Candidate[] = settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  return [...pool, ...rediscovery];
}
