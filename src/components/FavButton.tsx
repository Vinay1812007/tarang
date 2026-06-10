import type { Song } from '@/types';
import { useLibraryStore } from '@/store/libraryStore';
import { cn } from '@/utils/cn';
import { HeartIcon } from './Icons';

export function FavButton({ song, className }: { song: Song; className?: string }) {
  const isFav = useLibraryStore((s) => s.favorites.some((f) => f.id === song.id));
  const toggle = useLibraryStore((s) => s.toggleFavorite);
  return (
    <button
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFav}
      onClick={(e) => {
        e.stopPropagation();
        toggle(song);
      }}
      className={cn('p-2 rounded-full hover:bg-ink-700 transition-colors', isFav ? 'text-ember-500' : 'text-ink-300', className)}
    >
      <HeartIcon className="w-4 h-4" filled={isFav} />
    </button>
  );
}
