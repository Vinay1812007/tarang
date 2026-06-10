import { useParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAlbum } from '@/features/albums/useAlbum';
import { usePlayerStore } from '@/store/playerStore';
import { SongRow } from '@/components/SongRow';
import { HeaderSkeleton, ListSkeleton } from '@/components/Skeletons';
import { EmptyState, ErrorState } from '@/components/States';
import { PlayIcon, ShareIcon } from '@/components/Icons';
import { bestImage, FALLBACK_ART } from '@/utils/images';
import { shareLink } from '@/utils/share';
import { languageLabel } from '@/constants/languages';

export default function AlbumPage() {
  const { id } = useParams();
  const { data: album, isLoading, isError, refetch } = useAlbum(id);
  const playQueue = usePlayerStore((s) => s.playQueue);
  usePageTitle(album?.title);

  if (isLoading) return <div className="max-w-4xl mx-auto"><HeaderSkeleton /><ListSkeleton /></div>;
  if (isError || !album) return <ErrorState retry={() => refetch()} />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8">
        <img src={bestImage(album.images, 500)} onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)} alt="" className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl object-cover shadow-2xl" data-deter-context />
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-400 font-semibold mb-1.5">Album</p>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">{album.title}</h1>
          <p className="text-sm text-ink-300 mt-2">{album.subtitle}</p>
          <p className="text-xs text-ink-400 mt-1">
            {album.year}
            {album.language && <> · {languageLabel(album.language)}</>}
            {album.songCount != null && <> · {album.songCount} songs</>}
          </p>
          <div className="flex gap-2 mt-4">
            {album.songs.length > 0 && (
              <button onClick={() => playQueue(album.songs, 0)} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-ember-500 text-ink-950 font-bold hover:bg-ember-400">
                <PlayIcon className="w-4 h-4" /> Play all
              </button>
            )}
            <button onClick={() => void shareLink(`/album/${album.id}`, album.title)} aria-label="Share" className="p-2.5 rounded-full border border-ink-600 text-ink-200 hover:border-ink-400">
              <ShareIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {album.songs.length === 0 ? (
        <EmptyState title="Track list unavailable" message="The upstream source didn’t return songs for this album. Try again later — another provider may have them." />
      ) : (
        album.songs.map((song, i) => <SongRow key={song.id} song={song} songs={album.songs} index={i} />)
      )}
    </div>
  );
}
