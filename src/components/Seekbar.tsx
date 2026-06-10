import { usePlayerStore } from '@/store/playerStore';
import { formatDuration } from '@/utils/format';

export function Seekbar({ compact = false }: { compact?: boolean }) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);

  return (
    <div className="flex items-center gap-2 w-full">
      {!compact && <span className="text-[11px] tabular-nums text-ink-300 w-10 text-right">{formatDuration(currentTime)}</span>}
      <input
        type="range"
        aria-label="Seek"
        min={0}
        max={Math.max(duration, 1)}
        step={1}
        value={Math.min(currentTime, duration || 0)}
        onChange={(e) => seek(Number(e.target.value))}
        className="flex-1"
      />
      {!compact && <span className="text-[11px] tabular-nums text-ink-300 w-10">{formatDuration(duration)}</span>}
    </div>
  );
}
