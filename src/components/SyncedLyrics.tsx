import { useEffect, useMemo, useRef } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import type { LrcLine } from '@/services/lyrics/lrclib';
import { cn } from '@/utils/cn';

interface Props {
  lines: LrcLine[];
  /** Live mode highlights + follows playback and seeks on click. */
  live: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<Props['size']>, { line: string; active: string }> = {
  sm: { line: 'text-base leading-relaxed', active: 'text-lg' },
  md: { line: 'text-lg leading-relaxed', active: 'text-xl' },
  lg: { line: 'text-2xl leading-relaxed', active: 'text-3xl' },
};

/** Nearest scrollable ancestor — so following lyrics never scrolls the page. */
function scrollContainerOf(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement;
  while (node && node !== document.body) {
    const { overflowY } = window.getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export function SyncedLyrics({ lines, live, size = 'md', className }: Props) {
  const currentTime = usePlayerStore((s) => (live ? s.currentTime : 0));
  const seek = usePlayerStore((s) => s.seek);
  const containerRef = useRef<HTMLDivElement>(null);
  /** While the user is scrolling the lyrics themselves, pause auto-follow. */
  const userScrollUntil = useRef(0);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || !live) return;
    const scroller = scrollContainerOf(root);
    if (!scroller) return;
    const markUserScroll = () => {
      userScrollUntil.current = Date.now() + 4000;
    };
    scroller.addEventListener('wheel', markUserScroll, { passive: true });
    scroller.addEventListener('touchmove', markUserScroll, { passive: true });
    return () => {
      scroller.removeEventListener('wheel', markUserScroll);
      scroller.removeEventListener('touchmove', markUserScroll);
    };
  }, [live]);

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
    if (Date.now() < userScrollUntil.current) return;
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-line="${activeIndex}"]`);
    if (!el) return;
    const scroller = scrollContainerOf(el);
    if (!scroller) return;
    // Scroll ONLY the lyrics container — scrollIntoView would also scroll
    // every ancestor (the whole page jumped to the lyrics card on seek).
    const cRect = scroller.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const target =
      scroller.scrollTop + (eRect.top - cRect.top) - scroller.clientHeight / 2 + eRect.height / 2;
    scroller.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }, [activeIndex]);

  const sizes = SIZE_CLASSES[size];

  return (
    <div ref={containerRef} className={cn('space-y-1', className)}>
      {lines.map((line, i) => (
        <button
          key={`${line.t}-${i}`}
          data-line={i}
          onClick={() => live && seek(line.t)}
          disabled={!live}
          className={cn(
            'block w-full text-left rounded-xl px-3 py-1.5 transition-all duration-300',
            live && 'hover:bg-ink-800/60',
            i === activeIndex
              ? cn('text-ember-400 font-bold scale-[1.02] origin-left', sizes.active)
              : cn('text-ink-300', sizes.line),
            live && activeIndex >= 0 && i < activeIndex && 'opacity-50',
          )}
        >
          {line.text || '♪'}
        </button>
      ))}
    </div>
  );
}
