import { Link, useParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSongDetails, useSongSuggestions } from '@/features/player/useSongDetails';
import { usePlayerStore } from '@/store/playerStore';
import { SongRow } from '@/components/SongRow';
import { FavButton } from '@/components/FavButton';
import { HeaderSkeleton, ListSkeleton } from '@/components/Skeletons';
import { ErrorState } from '@/components/States';
import { PlayIcon, PlusIcon, ShareIcon } from '@/components/Icons';
import { bestImage, FALLBACK_ART } from '@/utils/images';
import { formatDuration, formatCount } from '@/utils/format';
import { languageLabel } from '@/constants/languages';
import { shareLink } from '@/utils/share';

export default function SongPage() {
  const { id } = useParams();
  const { data: song, isLoading, isError, refetch } = useSongDetails(id);
  const suggestions = useSongSuggestions(id);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const enqueue = usePlayerStore((s) => s.enqueue);
  usePageTitle(song?.title);

  if (isLoading) return <div className="max-w-4xl mx-auto"><HeaderSkeleton /><ListSkeleton /></div>;
  if (isError || !song) return <ErrorState retry={() => refetch()} />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-8">
        <img
          src={bestImage(song.images, 500)}
          onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)}
          alt=""
          className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl object-cover shadow-2xl"
          data-deter-context
        />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-ink-400 font-semibold mb-1.5">Song</p>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">{song.title}</h1>
          <p className="text-ink-300 mt-2 text-sm">
            {song.artists.map((a, i) => (
              <span key={`${a.id}-${i}`}>
                {i > 0 && ', '}
                {a.id ? <Link to={`/artist/${a.id}`} className="hover:text-ember-400 hover:underline">{a.name}</Link> : a.name}
              </span>
            ))}
          </p>
          <p className="text-xs text-ink-400 mt-1.5">
            {song.album?.id && <Link to={`/album/${song.album.id}`} className="hover:underline">{song.album.name}</Link>}
            {song.year && <> · {song.year}</>}
            {song.language && <> · {languageLabel(song.language)}</>}
            {song.duration != null && <> · {formatDuration(song.duration)}</>}
            {song.playCount != null && <> · {formatCount(song.playCount)} plays</>}
          </p>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => playQueue([song, ...(suggestions.data ?? [])], 0)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-ember-500 text-ink-950 font-bold hover:bg-ember-400"
            >
              <PlayIcon className="w-4 h-4" /> Play
            </button>
            <button onClick={() => enqueue(song)} aria-label="Add to queue" className="p-2.5 rounded-full border border-ink-600 text-ink-200 hover:border-ink-400">
              <PlusIcon className="w-4 h-4" />
            </button>
            <FavButton song={song} className="border border-ink-600" />
            <button onClick={() => void shareLink(`/song/${song.id}`, song.title)} aria-label="Share" className="p-2.5 rounded-full border border-ink-600 text-ink-200 hover:border-ink-400">
              <ShareIcon className="w-4 h-4" />
            </button>
            {song.hasLyrics && (
              <Link to={`/lyrics/${song.id}`} className="px-4 py-2 rounded-full border border-ink-600 text-sm text-ink-200 hover:border-ink-400">
                Lyrics
              </Link>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-2">Similar Tracks</h2>
      <p className="text-xs text-ink-400 mb-3">Based on this song — plays as a queue</p>
      {suggestions.isLoading && <ListSkeleton rows={5} />}
      {(suggestions.data ?? []).map((s, i) => (
        <SongRow key={s.id} song={s} songs={suggestions.data} index={i} />
      ))}
      {suggestions.isError && <p className="text-sm text-ink-400">Similar tracks unavailable from upstream right now.</p>}
    </div>
  );
}
