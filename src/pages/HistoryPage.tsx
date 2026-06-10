import { usePageTitle } from '@/hooks/usePageTitle';
import { useHistoryStore } from '@/store/historyStore';
import { SongRow } from '@/components/SongRow';
import { EmptyState } from '@/components/States';
import { relativeTime } from '@/utils/format';

export default function HistoryPage() {
  usePageTitle('History');
  const entries = useHistoryStore((s) => s.entries);
  const clearHistory = useHistoryStore((s) => s.clearHistory);

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
        entries.map((e, i) => (
          <div key={`${e.song.id}-${e.ts}`} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <SongRow song={e.song} songs={entries.map((x) => x.song)} index={i} />
            </div>
            <span className="text-[11px] text-ink-500 w-16 text-right shrink-0">{relativeTime(e.ts)}</span>
          </div>
        ))
      )}
    </div>
  );
}
