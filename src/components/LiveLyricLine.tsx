import { useMemo } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import type { LrcLine } from '@/services/lyrics/lrclib';
import { cn } from '@/utils/cn';

/**
 * Resso-style lyric strip: the current synced line (highlighted) with the
 * next line ghosted underneath. Tapping opens the full lyrics view.
 */
export function LiveLyricLine({ lines, onOpen }: { lines: LrcLine[]; onOpen: () => void }) {
  const currentTime = usePlayerStore((s) => s.currentTime);

  const [current, upcoming] = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].t <= currentTime + 0.2) idx = i;
      else break;
    }
    const cur = idx >= 0 ? lines[idx]?.text : null;
    const nxt = lines[idx + 1]?.text ?? null;
    return [cur, nxt];
  }, [lines, currentTime]);

  if (!current && !upcoming) return null;

  return (
    <button
      onClick={onOpen}
      className="w-full text-left mt-3 px-4 py-3 rounded-2xl bg-ink-950/30 hover:bg-ink-950/45 transition-colors"
      aria-label="Open lyrics"
    >
      <p className={cn('text-base font-bold leading-snug transition-all', current ? 'text-ember-300' : 'text-ink-300')}>
        {current ?? '♪'}
      </p>
      {upcoming && <p className="text-sm text-ink-300/70 leading-snug mt-1 truncate">{upcoming}</p>}
    </button>
  );
}
