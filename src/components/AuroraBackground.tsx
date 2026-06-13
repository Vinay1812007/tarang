import { useEffect, useState } from 'react';
import { usePlayerStore, useCurrentSong } from '@/store/playerStore';
import { extractAverageColor } from '@/utils/color';
import { bestImage } from '@/utils/images';

/**
 * Fixed, GPU-light ambient gradient behind the whole app. Two slow-drifting
 * blobs tinted by the current track's artwork accent — premium depth without
 * clutter. Disabled under reduced-motion; pointer-events none.
 */
export function AuroraBackground() {
  const song = useCurrentSong();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const [accent, setAccent] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (song) {
      void extractAverageColor(bestImage(song.images, 150)).then((c) => alive && setAccent(c));
    }
    return () => {
      alive = false;
    };
  }, [song]);

  const tint = accent ?? 'rgb(var(--ember-600))';

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0 bg-ink-950" />
      <div
        className="absolute -top-1/4 -left-1/4 w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-30 motion-safe:animate-aurora-a"
        style={{ background: tint }}
      />
      <div
        className="absolute -bottom-1/3 -right-1/4 w-[70vw] h-[70vw] rounded-full blur-[120px] opacity-20 motion-safe:animate-aurora-b"
        style={{ background: 'rgb(var(--tide-500))' }}
      />
      {/* settle when paused */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isPlaying ? 'opacity-0' : 'opacity-40'} bg-ink-950`} />
    </div>
  );
}
