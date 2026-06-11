import { useEffect, useRef } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLibraryStore } from '@/store/libraryStore';
import { toast } from '@/store/toastStore';
import { usePlayerStore, useCurrentSong } from '@/store/playerStore';
import { EmptyState } from '@/components/States';
import { bestImage, FALLBACK_ART } from '@/utils/images';
import { formatDuration } from '@/utils/format';
import { cn } from '@/utils/cn';
import { ChevronDownIcon, XIcon } from '@/components/Icons';

export default function QueuePage() {
  usePageTitle('Queue');
  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.index);
  const { playAt, removeAt, clearQueue, moveInQueue } = usePlayerStore.getState();
  const current = useCurrentSong();
  const currentRowRef = useRef<HTMLDivElement>(null);

  // Locate the playing song when opening a long queue.
  useEffect(() => {
    currentRowRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  const saveAsCollection = () => {
    if (!queue.length) return;
    const lib = useLibraryStore.getState();
    const name = `Queue · ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
    const id = lib.createCollection(name);
    queue.forEach((song) => lib.addToCollection(id, song));
    toast(`Saved ${queue.length} songs as “${name}”`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Queue</h1>
          <p className="text-sm text-ink-400 mt-1">{queue.length} songs{current ? ` · now: ${current.title}` : ''}</p>
        </div>
        {queue.length > 0 && (
          <div className="flex gap-2">
            <button onClick={saveAsCollection} className="px-4 py-2 rounded-full border border-ink-600 text-sm text-ink-200 hover:border-ember-500 hover:text-ember-400">
              Save as collection
            </button>
            <button onClick={clearQueue} className="px-4 py-2 rounded-full border border-ink-600 text-sm text-ink-200 hover:border-red-400 hover:text-red-300">
              Clear
            </button>
          </div>
        )}
      </div>
      {queue.length === 0 ? (
        <EmptyState title="Queue is empty" message="Play anything, or use a song’s ⋯ menu to add it here." />
      ) : (
        queue.map((song, i) => (
          <div
            key={`${song.id}-${i}`}
            ref={i === index ? currentRowRef : undefined}
            className={cn('group flex items-center gap-2 px-2 py-2 rounded-xl', i === index ? 'bg-ink-800' : 'hover:bg-ink-850')}
          >
            <span className="w-6 text-center text-xs text-ink-400 tabular-nums shrink-0">{i + 1}</span>
            <button onClick={() => playAt(i)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
              <img src={bestImage(song.images, 150)} onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)} alt="" className="w-10 h-10 rounded-lg object-cover" />
              <span className="min-w-0">
                <span className={cn('block text-sm font-medium truncate', i === index && 'text-ember-400')}>{song.title}</span>
                <span className="block text-xs text-ink-300 truncate">{song.subtitle}</span>
              </span>
            </button>
            <span className="hidden sm:block text-xs tabular-nums text-ink-400 shrink-0">{formatDuration(song.duration)}</span>
            <div className="flex items-center shrink-0">
              <button
                aria-label={`Move ${song.title} up`}
                disabled={i === 0}
                onClick={() => moveInQueue(i, i - 1)}
                className="p-1.5 text-ink-400 hover:text-ink-100 disabled:opacity-30 rotate-180"
              >
                <ChevronDownIcon className="w-4 h-4" />
              </button>
              <button
                aria-label={`Move ${song.title} down`}
                disabled={i === queue.length - 1}
                onClick={() => moveInQueue(i, i + 1)}
                className="p-1.5 text-ink-400 hover:text-ink-100 disabled:opacity-30"
              >
                <ChevronDownIcon className="w-4 h-4" />
              </button>
              <button aria-label={`Remove ${song.title}`} onClick={() => removeAt(i)} className="p-1.5 text-ink-400 hover:text-red-400">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
