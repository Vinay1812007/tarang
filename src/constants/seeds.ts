/**
 * Deterministic discovery seed queries. The upstream wrappers expose search
 * reliably but trending/module endpoints inconsistently, so trending shelves
 * are sourced through language- and mood-aware search seeds and then ranked
 * locally. Year is computed so seeds stay fresh without code changes.
 */
const YEAR = new Date().getFullYear();

export function trendingSeed(language: string): string {
  const label = language === 'unknown' ? '' : language;
  return `top ${label} songs ${YEAR}`.replace(/\s+/g, ' ').trim();
}

export const MOODS = [
  { id: 'romance', label: 'Romance', emoji: '❤️', query: 'romantic hits' },
  { id: 'workout', label: 'Workout', emoji: '💪', query: 'workout gym motivation songs' },
  { id: 'chill', label: 'Chill', emoji: '🌙', query: 'chill lofi relax songs' },
  { id: 'party', label: 'Party', emoji: '🎉', query: 'party dance hits' },
  { id: 'sad', label: 'Heartbreak', emoji: '💧', query: 'sad heartbreak songs' },
  { id: 'devotional', label: 'Devotional', emoji: '🕊️', query: 'devotional bhajan songs' },
  { id: 'travel', label: 'Road Trip', emoji: '🚗', query: 'road trip driving songs' },
  { id: 'focus', label: 'Focus', emoji: '🎯', query: 'instrumental focus study music' },
] as const;

export function moodSeed(moodId: string, language?: string | null): string {
  const mood = MOODS.find((m) => m.id === moodId);
  if (!mood) return trendingSeed(language ?? 'hindi');
  return language && language !== 'unknown' ? `${language} ${mood.query}` : mood.query;
}

export function timeOfDaySeed(hour: number, language: string): { title: string; query: string } {
  if (hour >= 5 && hour < 11) return { title: 'Morning Picks', query: `${language} morning fresh songs` };
  if (hour >= 11 && hour < 17) return { title: 'Daytime Energy', query: `${language} feel good hits` };
  if (hour >= 17 && hour < 22) return { title: 'Evening Unwind', query: `${language} evening melodies` };
  return { title: 'Night Vibes', query: `${language} late night chill songs` };
}
