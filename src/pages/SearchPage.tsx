import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { SongRow } from '@/components/SongRow';
import { MediaCard } from '@/components/MediaCard';
import { Chip } from '@/components/Chip';
import { ListSkeleton } from '@/components/Skeletons';
import { EmptyState, ErrorState } from '@/components/States';
import { SearchIcon, XIcon } from '@/components/Icons';
import {
  normalizeQuery,
  rankSongs,
  useSearchAlbums,
  useSearchAll,
  useSearchArtists,
  useSearchPlaylists,
  useSearchSongs,
} from '@/features/search/useSearch';
import { useSearchStore } from '@/store/searchStore';
import { bestImage } from '@/utils/images';

const TABS = ['All', 'Songs', 'Albums', 'Artists', 'Playlists'] as const;
type Tab = (typeof TABS)[number];

export default function SearchPage() {
  const { query: routeQuery } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(routeQuery ?? '');
  const [tab, setTab] = useState<Tab>('All');
  const debounced = useDebouncedValue(input, 350);
  const q = normalizeQuery(debounced);
  usePageTitle(q ? `“${q}”` : 'Search');

  const recent = useSearchStore((s) => s.recent);
  const { addRecent, removeRecent, clearRecent } = useSearchStore.getState();

  // Keep URL shareable: /search/:query mirrors the debounced input.
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
  const songs = useSearchSongs(q, tab === 'Songs');
  const albums = useSearchAlbums(q, tab === 'Albums');
  const artists = useSearchArtists(q, tab === 'Artists');
  const playlists = useSearchPlaylists(q, tab === 'Playlists');

  const active = q.length > 1;
  const rankedAllSongs = all.data ? rankSongs(all.data.songs) : [];

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
          className="w-full bg-ink-800 border border-ink-600 rounded-2xl pl-12 pr-10 py-3.5 text-sm outline-none focus:border-ember-500"
        />
        {input && (
          <button aria-label="Clear" onClick={() => setInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-100">
            <XIcon className="w-4 h-4" />
          </button>
        )}
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
            <EmptyState title="Find your next favorite" message="Search across songs, albums, artists, and playlists. Results are ranked toward your languages." />
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
                  {rankedAllSongs.length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold mb-2">Songs</h2>
                      {rankedAllSongs.slice(0, 8).map((song, i) => (
                        <SongRow key={song.id} song={song} songs={rankedAllSongs} index={i} />
                      ))}
                    </section>
                  )}
                  {all.data.albums.length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold mb-2">Albums</h2>
                      <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {all.data.albums.map((a) => (
                          <MediaCard key={a.id} to={`/album/${a.id}`} image={bestImage(a.images)} title={a.title} subtitle={a.subtitle} />
                        ))}
                      </div>
                    </section>
                  )}
                  {all.data.artists.length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold mb-2">Artists</h2>
                      <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {all.data.artists.map((a) => (
                          <MediaCard key={a.id} to={`/artist/${a.id}`} image={bestImage(a.images)} title={a.name} subtitle="Artist" round />
                        ))}
                      </div>
                    </section>
                  )}
                  {all.data.playlists.length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold mb-2">Playlists</h2>
                      <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {all.data.playlists.map((p) => (
                          <MediaCard key={p.id} to={`/playlist/${p.id}`} image={bestImage(p.images)} title={p.title} subtitle={p.subtitle} />
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
            songs.isLoading ? <ListSkeleton /> : songs.isError ? <ErrorState retry={() => songs.refetch()} /> : (
              <div>{(songs.data ?? []).map((song, i) => <SongRow key={song.id} song={song} songs={songs.data} index={i} />)}</div>
            )
          )}
          {tab === 'Albums' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {(albums.data ?? []).map((a) => <MediaCard key={a.id} to={`/album/${a.id}`} image={bestImage(a.images)} title={a.title} subtitle={a.subtitle} />)}
            </div>
          )}
          {tab === 'Artists' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {(artists.data ?? []).map((a) => <MediaCard key={a.id} to={`/artist/${a.id}`} image={bestImage(a.images)} title={a.name} subtitle="Artist" round />)}
            </div>
          )}
          {tab === 'Playlists' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {(playlists.data ?? []).map((p) => <MediaCard key={p.id} to={`/playlist/${p.id}`} image={bestImage(p.images)} title={p.title} subtitle={p.subtitle} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
