import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Song } from '@/types';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { shareLink } from '@/utils/share';
import { toast } from '@/store/toastStore';
import { cn } from '@/utils/cn';
import { DotsIcon } from './Icons';

export function TrackMenu({ song }: { song: Song }) {
  const [open, setOpen] = useState(false);
  const [flipUp, setFlipUp] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { enqueue, enqueueNext, startRadio } = usePlayerStore.getState();
  const collections = useLibraryStore((s) => s.collections);
  const addToCollection = useLibraryStore((s) => s.addToCollection);

  const items: Array<{ label: string; action: () => void } | null> = [
    { label: 'Play next', action: () => enqueueNext(song) },
    { label: 'Add to queue', action: () => enqueue(song) },
    { label: 'Start radio', action: () => startRadio(song) },
    { label: 'Song details', action: () => navigate(`/song/${song.id}`) },
    song.album?.id ? { label: 'Go to album', action: () => navigate(`/album/${song.album!.id}`) } : null,
    song.artists[0]?.id
      ? { label: 'Go to artist', action: () => navigate(`/artist/${song.artists[0].id}`) }
      : null,
    { label: 'View lyrics', action: () => navigate(`/lyrics/${song.id}`) },
    ...collections.slice(0, 3).map((c) => ({
      label: `Add to “${c.name}”`,
      action: () => {
        addToCollection(c.id, song);
        toast(`Added to ${c.name}`);
      },
    })),
    {
      label: 'Share',
      action: () => void shareLink(`/song/${song.id}`, song.title).then((r) => r === 'copied' && toast('Link copied')),
    },
  ];

  const toggleOpen = () => {
    if (!open && btnRef.current) {
      // Flip the menu upward when there is no room below.
      const rect = btnRef.current.getBoundingClientRect();
      setFlipUp(window.innerHeight - rect.bottom < 300);
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        aria-label="More options"
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          toggleOpen();
        }}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-300 hover:text-ink-100 hover:bg-ink-700/70"
      >
        <DotsIcon className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div
            role="menu"
            className={cn(
              'absolute right-0 z-50 w-48 rounded-xl border border-ink-700 bg-ink-850 shadow-xl py-1 animate-fade-up max-h-72 overflow-y-auto',
              flipUp ? 'bottom-full mb-1' : 'mt-1',
            )}
          >
            {items.filter(Boolean).map((item) => (
              <button
                key={item!.label}
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  item!.action();
                  setOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 text-sm text-ink-100 hover:bg-ink-700 truncate"
              >
                {item!.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
