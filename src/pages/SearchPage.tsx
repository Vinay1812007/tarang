import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { SongRow } from '@/components/SongRow';
import { MediaCard } from '@/components/MediaCard';
import { Chip } from '@/components/Chip';
import { ListSkeleton } from '@/components/Skeletons';
import { EmptyState, ErrorState } from '@/components/States';
import { InfiniteSentinel } from '@/components/InfiniteSentinel';
import { PlayIcon, SearchIcon, XIcon } from '@/components/Icons';
import {
  normalizeQuery,
  rankSongs,
  useSearchAlbums,
  useSearchAll,
  useSearchArtists,
  useSearchPlaylists,
} from '@/features/search/useSearch';
import { flattenSongPages, useInfiniteSongs } from '@/features/search/useInfiniteSongs';
import { useSearchStore } from '@/store/searchStore';
import { usePlayerStore } from '@/store/playerStore';
import { playAlbum, playArtist, playPlaylist } from '@/features/player/playEntity';
import { bestImage, FALLBACK_ART } from '@/utils/images';
import { languageLabel } from '@/constants/languages';

const TABS = ['All', 'Songs', 'Albums', 'Artists', 'Playlists'] as const;
type Tab = (typeof TABS)[number];

interface SpeechRecognitionLike {
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null;
}

export default function SearchPage() {
  const { query: routeQuery } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(routeQuery ?? '');
  const [tab, setTab] = useState<Tab>('All');
  const [listening, setListening] = useState(false);
  const [langFilter, setLangFilter] = useState<string | null>(null);
  const debounced = useDebouncedValue(input, 350);
  const q = normalizeQuery(debounced);
  usePageTitle(q ? `“${q}”` : 'Search');

  const recent = useSearchStore((s) => s.recent);
  const { addRecent, removeRecent, clearRecent } = useSearchStore.getState();
  const playQueue = usePlayerStore((s) => s.playQueue);

  useEffect(() => {
    if (q.length > 1 && q !== routeQuery) {
      navigate(`/search/${encodeURIComponent(q)}`, { replace: true });
      addRecent(q);
    }
  }, [q, routeQuery, navigate, addRecent]);

  useEffect(() => {
    if (routeQuery && routeQuery !== input) setInput(routeQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeQuery]);

  const all = useSearchAll(q);
  const infiniteSongs = useInfiniteSongs(q, tab === 'Songs');
  const albums = useSearchAlbums(q, tab === 'Albums');
  const artists = useSearchArtists(q, tab === 'Artists');
  const playlists = useSearchPlaylists(q, tab === 'Playlists');

  const active = q.length > 1;
  const rankedAllSongs = all.data ? rankSongs(all.data.songs) : [];
  const topResult = rankedAllSongs[0];
  const allSongList = flattenSongPages(infiniteSongs.data?.pages);
  const availableLangs = [...new Set(allSongList.map((s) => s.language).filter((l): l is string => !!l && l !== 'unknown'))];
  const songList = langFilter ? allSongList.filter((s) => s.language === langFilter) : allSongList;
  const SpeechRec = getSpeechRecognition();

  const startVoice = () => {
    if (!SpeechRec) return;
    const rec = new SpeechRec();
    rec.lang = navigator.language || 'en-IN';
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript;
      if (transcript) setInput(transcript);
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-5">Search</h1>
      <div className="relative mb-5">
        <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Songs, albums, artists, playlists…"
          className="w-full bg-ink-800 border border-ink-600 rounded-2xl pl-12 pr-20 py-3.5 text-sm outline-none focus:border-ember-500"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {input && (
            <button aria-label="Clear" onClick={() => setInput('')} className="p-1.5 text-ink-400 hover:text-ink-100">
              <XIcon className="w-4 h-4" />
            </button>
          )}
          {SpeechRec && (
            <button
              aria-label="Voice search"
              onClick={startVoice}
              className={listening ? 'p-1.5 text-ember-400 animate-pulse' : 'p-1.5 text-ink-400 hover:text-ink-100'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-4 h-4">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0014 0M12 17v5" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {!active && (
        <div>
          {recent.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-ink-300">Recent searches</p>
                <button onClick={clearRecent} className="text-xs text-ink-400 hover:text-ink-100">Clear all</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <span key={r} className="inline-flex items-center gap-1">
                    <Chip onClick={() => setInput(r)}>{r}</Chip>
                    <button aria-label={`Remove ${r}`} onClick={() => removeRecent(r)} className="text-ink-500 hover:text-ink-200 -ml-1">
                      <XIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <EmptyState title="Find your next favorite" message="Search across songs, albums, artists, and playlists. Results rank toward your languages — scroll for unlimited results." />
          )}
        </div>
      )}

      {active && (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
            {TABS.map((t) => (
              <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Chip>
            ))}
          </div>

          {tab === 'All' && (
            <>
              {all.isLoading && <ListSkeleton />}
              {all.isError && <ErrorState retry={() => all.refetch()} />}
              {all.data && (
                <div className="space-y-7">
                  {topResult && (
                    <section>
                      <h2 className="text-lg font-bold mb-2">Top Result</h2>
                      <div className="rounded-2xl border border-ink-700 bg-ink-850/60 p-4 flex items-center gap-4">
                        <img src={bestImage(topResult.images, 300)} onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)} alt="" className="w-20 h-20 rounded-xl object-cover shadow-lg" />
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-bold truncate">{topResult.title}</p>
                          <p className="text-sm text-ink-300 truncate">{topResult.subtitle}</p>
                        </div>
                        <button
                          onClick={() => playQueue(rankedAllSongs, 0)}
                          aria-label={`Play ${topResult.title}`}
                          className="w-12 h-12 rounded-full bg-ember-500 text-ink-950 flex items-center justify-center hover:bg-ember-400 shrink-0"
                        >
                          <PlayIcon className="w-5 h-5 ml-0.5" />
                        </button>
                      </div>
                    </section>
                  )}
                  {rankedAllSongs.length > 1 && (
                    <section>
                      <h2 className="text-lg font-bold mb-2">Songs</h2>
                      {rankedAllSongs.slice(1, 8).map((song, i) => (
                        <SongRow key={song.id} song={song} songs={rankedAllSongs} index={i + 1} />
                      ))}
                      <button onClick={() => setTab('Songs')} className="mt-2 text-xs font-semibold text-ember-400 px-2">
                        See all songs (endless) →
                      </button>
                    </section>
                  )}
                  {all.data.albums.length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold mb-2">Albums</h2>
                      <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {all.data.albums.map((a) => (
                          <MediaCard key={a.id} to={`/album/${a.id}`} image={bestImage(a.images)} title={a.title} subtitle={a.subtitle} onPlay={() => void playAlbum(a.id, a.title)} />
                        ))}
                      </div>
                    </section>
                  )}
                  {all.data.artists.length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold mb-2">Artists</h2>
                      <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {all.data.artists.map((a) => (
                          <MediaCard key={a.id} to={`/artist/${a.id}`} image={bestImage(a.images)} title={a.name} subtitle="Artist" round onPlay={() => void playArtist(a.id, a.name)} />
                        ))}
                      </div>
                    </section>
                  )}
                  {all.data.playlists.length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold mb-2">Playlists</h2>
                      <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {all.data.playlists.map((p) => (
                          <MediaCard key={p.id} to={`/playlist/${p.id}`} image={bestImage(p.images)} title={p.title} subtitle={p.subtitle} onPlay={() => void playPlaylist(p.id, p.title)} />
                        ))}
                      </div>
                    </section>
                  )}
                  {rankedAllSongs.length === 0 && all.data.albums.length === 0 && all.data.artists.length === 0 && all.data.playlists.length === 0 && (
                    <EmptyState title="No results" message={`Nothing matched “${q}”. Try a shorter or transliterated spelling.`} />
                  )}
                </div>
              )}
            </>
          )}

          {tab === 'Songs' && (
            <>
              {availableLangs.length > 1 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                  <Chip active={!langFilter} onClick={() => setLangFilter(null)}>All languages</Chip>
                  {availableLangs.map((l) => (
                    <Chip key={l} active={langFilter === l} onClick={() => setLangFilter(l)}>
                      {languageLabel(l)}
                    </Chip>
                  ))}
                </div>
              )}
              {infiniteSongs.isLoading && <ListSkeleton />}
              {infiniteSongs.isError && <ErrorState retry={() => infiniteSongs.refetch()} />}
              {songList.map((song, i) => (
                <SongRow key={song.id} song={song} songs={songList} index={i} />
              ))}
              <InfiniteSentinel
                onVisible={() => infiniteSongs.hasNextPage && !infiniteSongs.isFetchingNextPage && infiniteSongs.fetchNextPage()}
                disabled={!infiniteSongs.hasNextPage}
                loading={infiniteSongs.isFetchingNextPage}
              />
            </>
          )}
          {tab === 'Albums' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {(albums.data ?? []).map((a) => <MediaCard key={a.id} to={`/album/${a.id}`} image={bestImage(a.images)} title={a.title} subtitle={a.subtitle} fluid onPlay={() => void playAlbum(a.id, a.title)} />)}
            </div>
          )}
          {tab === 'Artists' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {(artists.data ?? []).map((a) => <MediaCard key={a.id} to={`/artist/${a.id}`} image={bestImage(a.images)} title={a.name} subtitle="Artist" round fluid onPlay={() => void playArtist(a.id, a.name)} />)}
            </div>
          )}
          {tab === 'Playlists' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {(playlists.data ?? []).map((p) => <MediaCard key={p.id} to={`/playlist/${p.id}`} image={bestImage(p.images)} title={p.title} subtitle={p.subtitle} fluid onPlay={() => void playPlaylist(p.id, p.title)} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
