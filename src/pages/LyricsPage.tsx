import { Link, useParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLyrics } from '@/features/lyrics/useLyrics';
import { useSongDetails } from '@/features/player/useSongDetails';
import { EmptyState } from '@/components/States';
import { ListSkeleton } from '@/components/Skeletons';
import { bestImage, FALLBACK_ART } from '@/utils/images';

export default function LyricsPage() {
  const { id } = useParams();
  const { data: song } = useSongDetails(id);
  const { data: lyrics, isLoading, isError } = useLyrics(id);
  usePageTitle(song ? `Lyrics · ${song.title}` : 'Lyrics');

  return (
    <div className="max-w-2xl mx-auto">
      {song && (
        <div className="flex items-center gap-4 mb-8">
          <img src={bestImage(song.images, 150)} onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)} alt="" className="w-16 h-16 rounded-xl object-cover" />
          <div>
            <Link to={`/song/${song.id}`} className="text-xl font-bold hover:underline">{song.title}</Link>
            <p className="text-sm text-ink-300">{song.subtitle}</p>
          </div>
        </div>
      )}
      {isLoading && <ListSkeleton rows={10} />}
      {(isError || (!isLoading && !lyrics)) && (
        <EmptyState title="Lyrics unavailable" message="No upstream source has lyrics for this song. Lyrics coverage varies by catalog and language." />
      )}
      {lyrics && (
        <>
          <pre className="whitespace-pre-wrap font-sans text-lg leading-9 text-ink-100">{lyrics.lyrics}</pre>
          {lyrics.copyright && <p className="text-[11px] text-ink-500 mt-8">{lyrics.copyright}</p>}
        </>
      )}
    </div>
  );
}
