import { useMemo } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useHistoryStore } from '@/store/historyStore';
import { SongRow } from '@/components/SongRow';
import { EmptyState } from '@/components/States';
import { relativeTime } from '@/utils/format';
import type { HistoryEntry } from '@/types';

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}

export default function HistoryPage() {
  usePageTitle('History');
  const entries = useHistoryStore((s) => s.entries);
  const clearHistory = useHistoryStore((s) => s.clearHistory);

  const groups = useMemo(() => {
    const out: Array<{ label: string; items: Array<{ entry: HistoryEntry; index: number }> }> = [];
    entries.forEach((entry, index) => {
      const label = dayLabel(entry.ts);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push({ entry, index });
      else out.push({ label, items: [{ entry, index }] });
    });
    return out;
  }, [entries]);

  const allSongs = entries.map((e) => e.song);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">History</h1>
          <p className="text-sm text-ink-400 mt-1">Stored only on this device</p>
        </div>
        {entries.length > 0 && (
          <button onClick={clearHistory} className="px-4 py-2 rounded-full border border-ink-600 text-sm text-ink-200 hover:border-red-400 hover:text-red-300">
            Clear history
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <EmptyState title="No listening history" message="Songs you play appear here and feed your local recommendations." />
      ) : (
        groups.map((g) => (
          <section key={g.label} className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-400 px-2 mb-1.5">{g.label}</h2>
            {g.items.map(({ entry, index }) => (
              <div key={`${entry.song.id}-${entry.ts}`} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <SongRow song={entry.song} songs={allSongs} index={index} />
                </div>
                <span className="text-[11px] text-ink-500 w-16 text-right shrink-0">{relativeTime(entry.ts)}</span>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
