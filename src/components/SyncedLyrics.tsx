import { useEffect, useMemo, useRef } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import type { LrcLine } from '@/services/lyrics/lrclib';
import { cn } from '@/utils/cn';

interface Props {
  lines: LrcLine[];
  /** Live mode highlights + follows playback and seeks on click. */
  live: boolean;
  className?: string;
}

export function SyncedLyrics({ lines, live, className }: Props) {
  const currentTime = usePlayerStore((s) => (live ? s.currentTime : 0));
  const seek = usePlayerStore((s) => s.seek);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = useMemo(() => {
    if (!live) return -1;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].t <= currentTime + 0.2) idx = i;
      else break;
    }
    return idx;
  }, [lines, currentTime, live]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-line="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeIndex]);

  return (
    <div ref={containerRef} className={cn('space-y-1', className)}>
      {lines.map((line, i) => (
        <button
          key={`${line.t}-${i}`}
          data-line={i}
          onClick={() => live && seek(line.t)}
          disabled={!live}
          className={cn(
            'block w-full text-left rounded-xl px-3 py-1.5 transition-all duration-300 leading-relaxed',
            live && 'hover:bg-ink-800/60',
            i === activeIndex
              ? 'text-ember-400 font-bold text-xl scale-[1.02] origin-left'
              : 'text-ink-300 text-lg',
            live && activeIndex >= 0 && i < activeIndex && 'opacity-50',
          )}
        >
          {line.text || '♪'}
        </button>
      ))}
    </div>
  );
}
