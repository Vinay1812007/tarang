import { gatherCandidates } from './candidates';
import { rankCandidates } from './scoring';
import { buildMixes } from './mixes';
import type { Mix, RecommendationContext, ScoredCandidate } from './types';

interface MemoEntry {
  key: string;
  at: number;
  mixes: Mix[];
}

let memo: MemoEntry | null = null;
const MEMO_TTL_MS = 10 * 60_000;

function ctxKey(ctx: RecommendationContext): string {
  return [
    ctx.profile.totals.plays,
    ctx.profile.totals.favorites,
    ctx.profile.totals.skips,
    ctx.hour,
    ctx.pinnedLanguages.join(','),
    ctx.mutedLanguages.join(','),
    Math.round(ctx.intensity * 10),
    ctx.region?.country ?? '',
  ].join('|');
}

/**
 * Entry point: gather → rank → assemble shelves. Pure local computation plus
 * fault-tolerant upstream metadata fetches. Memoized for 10 minutes per
 * profile state so navigation stays instant and playback is never blocked.
 */
export async function buildRecommendations(ctx: RecommendationContext): Promise<Mix[]> {
  const key = ctxKey(ctx);
  if (memo && memo.key === key && Date.now() - memo.at < MEMO_TTL_MS) return memo.mixes;
  const candidates = await gatherCandidates(ctx);
  const ranked = rankCandidates(candidates, ctx);
  const mixes = buildMixes(ranked, ctx);
  memo = { key, at: Date.now(), mixes };
  return mixes;
}

/** Ranked pool for "similar tracks autoqueue" — reuses the same scorer. */
export async function similarToSong(songId: string, ctx: RecommendationContext): Promise<ScoredCandidate[]> {
  const { getSongSuggestions } = await import('@/services/api');
  try {
    const songs = await getSongSuggestions(songId, 12);
    return rankCandidates(
      songs.map((song) => ({ song, source: 'related' as const })),
      ctx,
    );
  } catch {
    return [];
  }
}

export function invalidateRecommendationCache(): void {
  memo = null;
}
