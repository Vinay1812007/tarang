import { useMemo, useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { SongRow } from '@/components/SongRow';
import { EmptyState } from '@/components/States';
import { Chip } from '@/components/Chip';
import { PlayIcon, ShuffleIcon } from '@/components/Icons';
import { Link } from 'react-router-dom';
import type { Song } from '@/types';

type SortMode = 'recent' | 'title' | 'artist';

function sortSongs(songs: Song[], mode: SortMode): Song[] {
  if (mode === 'recent') return songs;
  return [...songs].sort((a, b) =>
    mode === 'title' ? a.title.localeCompare(b.title) : a.subtitle.localeCompare(b.subtitle),
  );
}

export default function FavoritesPage() {
  usePageTitle('Favorites');
  const favorites = useLibraryStore((s) => s.favorites);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const [sort, setSort] = useState<SortMode>('recent');
  const sorted = useMemo(() => sortSongs(favorites, sort), [favorites, sort]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Favorites</h1>
          <p className="text-sm text-ink-400 mt-1">{favorites.length} songs · stored locally</p>
        </div>
        {favorites.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!shuffle) toggleShuffle();
                playQueue(sorted, Math.floor(Math.random() * sorted.length));
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-ink-600 text-sm font-semibold hover:border-ink-400"
            >
              <ShuffleIcon className="w-4 h-4" /> Shuffle
            </button>
            <button onClick={() => playQueue(sorted, 0)} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-ember-500 text-ink-950 font-bold hover:bg-ember-400">
              <PlayIcon className="w-4 h-4" /> Play all
            </button>
          </div>
        )}
      </div>

      {favorites.length > 0 && (
        <div className="flex gap-2 mb-4">
          {(['recent', 'title', 'artist'] as SortMode[]).map((m) => (
            <Chip key={m} active={sort === m} onClick={() => setSort(m)}>
              {m === 'recent' ? 'Recently added' : m === 'title' ? 'Title' : 'Artist'}
            </Chip>
          ))}
        </div>
      )}

      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          message="Tap the heart on any song. Favorites power your “Similar to Favorites” recommendations."
          action={<Link to="/discover" className="px-5 py-2.5 rounded-full bg-ember-500 text-ink-950 font-semibold">Discover music</Link>}
        />
      ) : (
        sorted.map((song, i) => <SongRow key={song.id} song={song} songs={sorted} index={i} />)
      )}
    </div>
  );
}
