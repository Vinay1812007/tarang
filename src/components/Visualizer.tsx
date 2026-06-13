import { usePlayerStore } from '@/store/playerStore';

/** Decorative equalizer bars — pulse while playing, rest when paused. */
export function Visualizer({ bars = 5 }: { bars?: number }) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  return (
    <div className="flex items-end gap-1 h-5" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="w-1 bg-ember-400 rounded-full origin-bottom"
          style={{
            height: '100%',
            animation: isPlaying ? `pulse-bar 0.9s ease-in-out ${i * 0.12}s infinite` : 'none',
            transform: isPlaying ? undefined : 'scaleY(0.3)',
          }}
        />
      ))}
    </div>
  );
}
