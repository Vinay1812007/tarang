import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LANGUAGES, languageLabel } from '@/constants/languages';
import { trendingSeed } from '@/constants/seeds';
import { flattenSongPages, useInfiniteSongs } from '@/features/search/useInfiniteSongs';
import { useSettingsStore } from '@/store/settingsStore';
import { usePlayerStore } from '@/store/playerStore';
import { SongRow } from '@/components/SongRow';
import { Chip } from '@/components/Chip';
import { ListSkeleton } from '@/components/Skeletons';
import { ErrorState } from '@/components/States';
import { InfiniteSentinel } from '@/components/InfiniteSentinel';
import { PlayIcon } from '@/components/Icons';

export default function ChartsPage() {
  usePageTitle('Charts');
  const pinned = useSettingsStore((s) => s.pinnedLanguages);
  const [lang, setLang] = useState(pinned[0] ?? 'hindi');
  const query = useInfiniteSongs(trendingSeed(lang));
  const songs = flattenSongPages(query.data?.pages);
  const playQueue = usePlayerStore((s) => s.playQueue);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Top Charts</h1>
        {songs.length > 0 && (
          <button onClick={() => playQueue(songs, 0)} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-ember-500 text-ink-950 text-xs font-bold hover:bg-ember-400">
            <PlayIcon className="w-3.5 h-3.5" /> Play all
          </button>
        )}
      </div>
      <p className="text-sm text-ink-400 mb-5">Endless trending picks per language — keep scrolling.</p>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
        {LANGUAGES.map((l) => (
          <Chip key={l.id} active={lang === l.id} onClick={() => setLang(l.id)}>{l.label}</Chip>
        ))}
      </div>

      {query.isLoading && <ListSkeleton />}
      {query.isError && <ErrorState retry={() => query.refetch()} />}
      {songs.map((song, i) => (
        <div key={song.id} className="flex items-center">
          <span className="w-8 text-center text-sm font-bold text-ink-500 tabular-nums shrink-0">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <SongRow song={song} songs={songs} index={i} />
          </div>
        </div>
      ))}
      {!query.isLoading && !query.isError && (
        <InfiniteSentinel
          onVisible={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          disabled={!query.hasNextPage}
          loading={query.isFetchingNextPage}
        />
      )}
      {songs.length > 0 && !query.hasNextPage && (
        <p className="text-center text-xs text-ink-500 py-4">That’s everything {languageLabel(lang)} trending has right now.</p>
      )}
    </div>
  );
}
