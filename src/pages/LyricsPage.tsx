import { Link, useParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSongDetails } from '@/features/player/useSongDetails';
import { useSyncedLyrics } from '@/features/lyrics/useSyncedLyrics';
import { SyncedLyrics } from '@/components/SyncedLyrics';
import { EmptyState } from '@/components/States';
import { ListSkeleton } from '@/components/Skeletons';
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

      {lyrics.data?.synced ? (
        <>
          <SyncedLyrics lines={lyrics.data.synced} live={isLive} />
          <p className="text-[11px] text-ink-500 mt-6">
            Synced lyrics via LRCLIB{isLive ? ' · tap a line to seek' : ' · play this song to follow along live'}
          </p>
        </>
      ) : lyrics.data?.plain ? (
        <>
          <pre className="whitespace-pre-wrap font-sans text-lg leading-9 text-ink-100">{lyrics.data.plain}</pre>
          <p className="text-[11px] text-ink-500 mt-6">
            Lyrics via {lyrics.data.source === 'lrclib' ? 'LRCLIB' : 'upstream catalog'}
          </p>
        </>
      ) : null}
    </div>
  );
}
