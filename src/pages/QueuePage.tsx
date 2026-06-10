import { usePageTitle } from '@/hooks/usePageTitle';
import { usePlayerStore, useCurrentSong } from '@/store/playerStore';
import { EmptyState } from '@/components/States';
import { bestImage, FALLBACK_ART } from '@/utils/images';
import { formatDuration } from '@/utils/format';
import { cn } from '@/utils/cn';
import { XIcon } from '@/components/Icons';

export default function QueuePage() {
  usePageTitle('Queue');
  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.index);
  const { playAt, removeAt, clearQueue } = usePlayerStore.getState();
  const current = useCurrentSong();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Queue</h1>
          <p className="text-sm text-ink-400 mt-1">{queue.length} songs{current ? ` · now: ${current.title}` : ''}</p>
        </div>
        {queue.length > 0 && (
          <button onClick={clearQueue} className="px-4 py-2 rounded-full border border-ink-600 text-sm text-ink-200 hover:border-red-400 hover:text-red-300">
            Clear queue
          </button>
        )}
      </div>
      {queue.length === 0 ? (
        <EmptyState title="Queue is empty" message="Play anything, or use a song’s ⋯ menu to add it here." />
      ) : (
        queue.map((song, i) => (
          <div
            key={`${song.id}-${i}`}
            className={cn('group flex items-center gap-3 px-2 py-2 rounded-xl', i === index ? 'bg-ink-800' : 'hover:bg-ink-850')}
          >
            <span className="w-6 text-center text-xs text-ink-400 tabular-nums">{i + 1}</span>
            <button onClick={() => playAt(i)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
              <img src={bestImage(song.images, 150)} onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)} alt="" className="w-10 h-10 rounded-lg object-cover" />
              <span className="min-w-0">
                <span className={cn('block text-sm font-medium truncate', i === index && 'text-ember-400')}>{song.title}</span>
                <span className="block text-xs text-ink-300 truncate">{song.subtitle}</span>
              </span>
            </button>
            <span className="text-xs tabular-nums text-ink-400">{formatDuration(song.duration)}</span>
            <button aria-label={`Remove ${song.title}`} onClick={() => removeAt(i)} className="p-2 text-ink-400 hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
