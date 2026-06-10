import {
  artistWeight,
  languageWeight,
  lowSkipScore,
  profileConfidence,
} from '@/services/personalization/profile';
import type { Candidate, ReasonComponent, RecommendationContext, ScoredCandidate } from './types';

const SOURCE_BOOST: Record<Candidate['source'], number> = {
  related: 0.18,
  'favorite-artist': 0.14,
  rediscovery: 0.1,
  trending: 0.06,
  history: 0.0,
};

/**
 * Deterministic hybrid scoring. Personalized terms are blended in by
 * `confidence * intensity`, so a cold profile leans on popularity/trending
 * and a warm profile leans on taste — explainable via the reasons array.
 */
export function scoreCandidate(c: Candidate, ctx: RecommendationContext): ScoredCandidate {
  const { profile } = ctx;
  const reasons: ReasonComponent[] = [];
  const song = c.song;

  if (song.language && ctx.mutedLanguages.includes(song.language)) {
    return { candidate: c, score: -1, reasons: [] };
  }

  const confidence = profileConfidence(profile);
  const personalBlend = (0.3 + 0.7 * confidence) * (0.4 + 0.6 * ctx.intensity);

  let score = 0;

  const langW = languageWeight(profile, song.language);
  const pinned = song.language != null && ctx.pinnedLanguages.includes(song.language);
  const langTerm = (langW * 0.3 + (pinned ? 0.12 : 0)) * personalBlend;
  if (langTerm > 0.02) reasons.push({ kind: 'language', weight: langTerm, detail: song.language ?? undefined });
  score += langTerm;

  const artW =
    artistWeight(
      profile,
      song.artists.map((a) => a.id).filter(Boolean),
      song.artists.map((a) => a.name),
    ) * 0.3 * personalBlend;
  if (artW > 0.02) reasons.push({ kind: 'artist', weight: artW, detail: song.artists[0]?.name });
  score += artW;

  const pop = song.playCount ? Math.min(Math.log10(song.playCount + 1) / 8, 1) * 0.15 : 0.04;
  reasons.push({ kind: 'popularity', weight: pop });
  score += pop;

  if (song.language && profile.languages[song.language]) {
    const ls = lowSkipScore(profile.languages[song.language]) * 0.1 * personalBlend;
    if (ls > 0.04) reasons.push({ kind: 'low-skip', weight: ls });
    score += ls;
  }

  const boost = SOURCE_BOOST[c.source];
  score += boost;
  if (c.source === 'related') reasons.push({ kind: 'related', weight: boost, detail: c.seedTitle });
  if (c.source === 'rediscovery') reasons.push({ kind: 'rediscovery', weight: boost });
  if (c.source === 'trending') reasons.push({ kind: 'trending', weight: boost });

  // Freshness: light boost for recent releases (novelty without dominating).
  const year = song.year ? Number(song.year) : null;
  if (year && year >= new Date().getFullYear() - 1) score += 0.04;

  // Repetition guard: heavily demote very recently played songs.
  if (profile.recentSongIds.includes(song.id)) score -= 0.5;

  return { candidate: c, score, reasons: reasons.sort((a, b) => b.weight - a.weight) };
}

export function rankCandidates(candidates: Candidate[], ctx: RecommendationContext): ScoredCandidate[] {
  const seen = new Set<string>();
  const out: ScoredCandidate[] = [];
  for (const c of candidates) {
    if (seen.has(c.song.id)) continue;
    seen.add(c.song.id);
    const scored = scoreCandidate(c, ctx);
    if (scored.score > 0) out.push(scored);
  }
  return out.sort((a, b) => b.score - a.score);
}
