import { usePageTitle } from '@/hooks/usePageTitle';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { SongRow } from '@/components/SongRow';
import { EmptyState } from '@/components/States';
import { PlayIcon } from '@/components/Icons';
import { Link } from 'react-router-dom';

export default function FavoritesPage() {
  usePageTitle('Favorites');
  const favorites = useLibraryStore((s) => s.favorites);
  const playQueue = usePlayerStore((s) => s.playQueue);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Favorites</h1>
          <p className="text-sm text-ink-400 mt-1">{favorites.length} songs · stored locally</p>
        </div>
        {favorites.length > 0 && (
          <button onClick={() => playQueue(favorites, 0)} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-ember-500 text-ink-950 font-bold hover:bg-ember-400">
            <PlayIcon className="w-4 h-4" /> Play all
          </button>
        )}
      </div>
      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          message="Tap the heart on any song. Favorites power your “Similar to Favorites” recommendations."
          action={<Link to="/discover" className="px-5 py-2.5 rounded-full bg-ember-500 text-ink-950 font-semibold">Discover music</Link>}
        />
      ) : (
        favorites.map((song, i) => <SongRow key={song.id} song={song} songs={favorites} index={i} />)
      )}
    </div>
  );
}
