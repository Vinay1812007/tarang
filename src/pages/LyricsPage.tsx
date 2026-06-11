import { Link, useParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSongDetails } from '@/features/player/useSongDetails';
import { useSyncedLyrics } from '@/features/lyrics/useSyncedLyrics';
import { SyncedLyrics } from '@/components/SyncedLyrics';
import { EmptyState } from '@/components/States';
import { ListSkeleton } from '@/components/Skeletons';
import { useState } from 'react';
import { useCurrentSong, usePlayerStore } from '@/store/playerStore';
import { bestImage, FALLBACK_ART } from '@/utils/images';
import { PlayIcon } from '@/components/Icons';

export default function LyricsPage() {
  const { id } = useParams();
  const { data: song, isLoading: songLoading } = useSongDetails(id);
  const lyrics = useSyncedLyrics(song);
  const current = useCurrentSong();
  const playSong = usePlayerStore((s) => s.playSong);
  usePageTitle(song ? `Lyrics · ${song.title}` : 'Lyrics');

  const isLive = !!song && current?.id === song.id;
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');

  return (
    <div className="max-w-2xl mx-auto">
      {song && (
        <div className="flex items-center gap-4 mb-6">
          <img src={bestImage(song.images, 150)} onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)} alt="" className="w-16 h-16 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <Link to={`/song/${song.id}`} className="text-xl font-bold hover:underline truncate block">{song.title}</Link>
            <p className="text-sm text-ink-300 truncate">{song.subtitle}</p>
          </div>
          {!isLive && (
            <button
              onClick={() => playSong(song)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-ember-500 text-ink-950 text-xs font-bold shrink-0"
            >
              <PlayIcon className="w-3.5 h-3.5" /> Play to sync
            </button>
          )}
        </div>
      )}

      {(songLoading || lyrics.isLoading) && <ListSkeleton rows={10} />}

      {!lyrics.isLoading && !songLoading && !lyrics.data && (
        <EmptyState
          title="Lyrics unavailable"
          message="Neither LRCLIB nor the upstream catalogs have lyrics for this song. Coverage varies by language and label."
        />
      )}

      {lyrics.data && (
        <div className="flex items-center gap-1 mb-3" role="group" aria-label="Lyrics text size">
          {(['sm', 'md', 'lg'] as const).map((sz) => (
            <button
              key={sz}
              onClick={() => setSize(sz)}
              className={
                size === sz
                  ? 'px-2.5 py-1 rounded-lg bg-ink-700 text-ember-400 text-xs font-bold'
                  : 'px-2.5 py-1 rounded-lg text-ink-400 hover:text-ink-100 text-xs font-bold'
              }
            >
              {sz === 'sm' ? 'A' : sz === 'md' ? 'A+' : 'A++'}
            </button>
          ))}
        </div>
      )}

      {lyrics.data?.synced ? (
        <>
          <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-ink-700/60 bg-ink-850/40 p-2">
            <SyncedLyrics lines={lyrics.data.synced} live={isLive} size={size} />
          </div>
          <p className="text-[11px] text-ink-500 mt-4">
            Synced lyrics via LRCLIB{isLive ? ' · tap a line to seek' : ' · play this song to follow along live'}
          </p>
        </>
      ) : lyrics.data?.plain ? (
        <>
          <pre className={`whitespace-pre-wrap font-sans text-ink-100 ${size === 'sm' ? 'text-base leading-8' : size === 'md' ? 'text-lg leading-9' : 'text-2xl leading-10'}`}>{lyrics.data.plain}</pre>
          <p className="text-[11px] text-ink-500 mt-6">
            Lyrics via {lyrics.data.source === 'lrclib' ? 'LRCLIB' : 'upstream catalog'}
          </p>
        </>
      ) : null}
    </div>
  );
}
