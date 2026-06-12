import { useInfiniteQuery } from '@tanstack/react-query';
import type { Song } from '@/types';
import { searchSongsPage } from '@/services/api';
import { rankSongs } from '@/features/search/useSearch';
import { useSettingsStore } from '@/store/settingsStore';
import { languageLabel } from '@/constants/languages';

const YEAR = new Date().getFullYear();
const SEED_TEMPLATES = [
  (l: string) => `${l} superhit songs`,
  (l: string) => `top ${l} songs ${YEAR}`,
  (l: string) => `best ${l} hits`,
  (l: string) => `${l} romantic hits`,
  (l: string) => `${l} dance hits`,
  (l: string) => `${l} melody songs`,
  (l: string) => `${l} top charts`,
];

/**
 * Endless home feed: each page pulls from a rotating (seed × language)
 * matrix, so scrolling never runs out — when one seed is exhausted, the
 * next page simply comes from a different seed.
 */
export function useUnlimitedFeed() {
  const pinned = useSettingsStore((s) => s.pinnedLanguages);
  const languages = pinned.length ? pinned : ['hindi'];
  return useInfiniteQuery({
    queryKey: ['unlimited-feed', languages],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const combos = SEED_TEMPLATES.length * languages.length;
      const template = SEED_TEMPLATES[pageParam % SEED_TEMPLATES.length];
      const language = languages[Math.floor(pageParam / SEED_TEMPLATES.length) % languages.length];
      const upstreamPage = Math.floor(pageParam / combos) + 1;
      const seed = template(languageLabel(language).toLowerCase());
      try {
        return rankSongs(await searchSongsPage(seed, upstreamPage, 24));
      } catch {
        return [] as Song[]; // a dead seed never ends the feed
      }
    },
    getNextPageParam: (_last, all) => (all.length < 200 ? all.length : undefined),
    staleTime: 10 * 60_000,
  });
}
