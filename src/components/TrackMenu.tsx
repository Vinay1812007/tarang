import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Song } from '@/types';
import { usePlayerStore } from '@/store/playerStore';
import { shareLink } from '@/utils/share';
import { DotsIcon } from './Icons';

export function TrackMenu({ song }: { song: Song }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const enqueue = usePlayerStore((s) => s.enqueue);
  const enqueueNext = usePlayerStore((s) => s.enqueueNext);

  const items: Array<{ label: string; action: () => void } | null> = [
    { label: 'Play next', action: () => enqueueNext(song) },
    { label: 'Add to queue', action: () => enqueue(song) },
    { label: 'Song details', action: () => navigate(`/song/${song.id}`) },
    song.album?.id ? { label: 'Go to album', action: () => navigate(`/album/${song.album!.id}`) } : null,
    song.artists[0]?.id
      ? { label: 'Go to artist', action: () => navigate(`/artist/${song.artists[0].id}`) }
      : null,
    song.hasLyrics ? { label: 'View lyrics', action: () => navigate(`/lyrics/${song.id}`) } : null,
    { label: 'Share', action: () => void shareLink(`/song/${song.id}`, song.title) },
  ];

  return (
    <div className="relative">
      <button
        aria-label="More options"
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-2 rounded-full text-ink-300 hover:bg-ink-700"
      >
        <DotsIcon className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 w-44 rounded-xl border border-ink-700 bg-ink-850 shadow-xl py-1 animate-fade-up"
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
                className="w-full text-left px-3.5 py-2 text-sm text-ink-100 hover:bg-ink-700"
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
