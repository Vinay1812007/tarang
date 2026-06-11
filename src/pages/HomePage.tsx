import { Link, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Shelf } from '@/components/Shelf';
import { MediaCard } from '@/components/MediaCard';
import { ShelfSkeleton, CardGridSkeleton } from '@/components/Skeletons';
import { InfiniteSentinel } from '@/components/InfiniteSentinel';
import { flattenSongPages, useInfiniteSongs } from '@/features/search/useInfiniteSongs';
import { Chip } from '@/components/Chip';
import { UpdateBanner } from '@/components/UpdateBanner';
import { IconButton } from '@/components/IconButton';
import { MoonIcon, SettingsIcon, SunIcon, SparkleIcon } from '@/components/Icons';
import { useHistoryStore } from '@/store/historyStore';
import { toast } from '@/store/toastStore';
import {
  useContinueListening,
  useTimeOfDayShelf,
  useTrendingForLanguage,
} from '@/features/home/useHomeShelves';
import { useYourArtists } from '@/features/home/useYourArtists';
import { playArtist } from '@/features/player/playEntity';
import { letterAvatar } from '@/utils/avatar';
import { useRecommendations } from '@/features/recommendations/useRecommendations';
import { useSettingsStore } from '@/store/settingsStore';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRegion } from '@/features/location/useRegion';
import { bestImage } from '@/utils/images';
import { languageLabel } from '@/constants/languages';
import { dayPartLabel } from '@/utils/time';
import { feedSeed, trendingSeed } from '@/constants/seeds';
import type { Song } from '@/types';

function SongShelf({ title, explanation, songs, seeAllTo }: { title: string; explanation?: string; songs: Song[]; seeAllTo?: string }) {
  const playQueue = usePlayerStore((s) => s.playQueue);
  if (!songs.length) return null;
  return (
    <Shelf title={title} explanation={explanation} seeAllTo={seeAllTo}>
      {songs.map((song, i) => (
        <MediaCard
          key={song.id}
          to={`/song/${song.id}`}
          image={bestImage(song.images)}
          title={song.title}
          subtitle={song.subtitle}
          onPlay={() => playQueue(songs, i)}
        />
      ))}
    </Shelf>
  );
}

function greeting(): string {
  const part = dayPartLabel();
  if (part === 'morning') return 'Good morning';
  if (part === 'afternoon') return 'Good afternoon';
  if (part === 'evening') return 'Good evening';
  return 'Late night waves';
}

export default function HomePage() {
  usePageTitle('Home');
  const pinned = useSettingsStore((s) => s.pinnedLanguages);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const navigate = useNavigate();
  const region = useRegion();
  const historyEntries = useHistoryStore((s) => s.entries);

  // This week's listening, from local history only.
  const weekAgo = Date.now() - 7 * 86_400_000;
  const weekEntries = historyEntries.filter((e) => e.ts >= weekAgo);
  const weekMinutes = Math.round(weekEntries.reduce((acc, e) => acc + (e.song.duration ?? 180), 0) / 60);
  const continueListening = useContinueListening();
  const yourArtists = useYourArtists();
  const favorites = useLibraryStore((s) => s.favorites);
  const timeShelf = useTimeOfDayShelf();
  const mixes = useRecommendations();
  const primaryLang = pinned[0] ?? 'hindi';
  const trending = useTrendingForLanguage(primaryLang);
  const playQueueFeed = usePlayerStore((s) => s.playQueue);
  const feed = useInfiniteSongs(feedSeed(primaryLang));
  const feedSongs = flattenSongPages(feed.data?.pages);

  return (
    <div className="max-w-screen-2xl mx-auto">
      {/* Home header: brand (mobile) + quick theme & settings (all sizes) */}
      <div className="flex items-center justify-between mb-4 pt-1">
        <div className="md:hidden flex items-center gap-2.5">
          <img src="/icons/icon.svg" alt="" className="w-9 h-9 rounded-xl" />
          <span className="text-2xl font-bold tracking-tight">
            VinaX<span className="text-ember-500">.</span>
          </span>
        </div>
        <div className="hidden md:block" />
        <div className="flex items-center gap-1">
          <IconButton label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </IconButton>
          <IconButton label="Settings" onClick={() => navigate('/settings')}>
            <SettingsIcon className="w-5 h-5" />
          </IconButton>
        </div>
      </div>
      <UpdateBanner />

      {/* Hero — gradient shifts with the time of day */}
      <div className={`rounded-3xl bg-gradient-to-br border border-ink-700 p-6 sm:p-8 mb-8 ${
        ({
          morning: 'from-ember-600/25 via-ink-850 to-ink-900',
          afternoon: 'from-tide-500/15 via-ink-850 to-ink-900',
          evening: 'from-purple-700/25 via-ink-850 to-ink-900',
          'late-night': 'from-blue-900/40 via-ink-850 to-ink-900',
        } as Record<string, string>)[dayPartLabel()] ?? 'from-ink-800 via-ink-850 to-ink-900'
      }`}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{greeting()}</h1>
        <p className="text-ink-300 mt-1 text-sm">
          {region?.country ? `Tuned for ${region.country}` : 'Tuned to you'} · no account, all local
          {weekEntries.length > 0 && (
            <span className="text-ink-400"> · this week: {weekEntries.length} plays ≈ {weekMinutes} min</span>
          )}
        </p>
        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            onClick={() => {
              const pool = [...(trending.data ?? []), ...feedSongs, ...continueListening];
              if (!pool.length) {
                toast('Still loading — try again in a second');
                return;
              }
              const i = Math.floor(Math.random() * pool.length);
              playQueueFeed(pool, i);
              toast(`Surprise: ${pool[i].title}`);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-ember-500 text-ink-950 text-sm font-bold hover:bg-ember-400 active:scale-95"
          >
            <SparkleIcon className="w-4 h-4" /> Surprise me
          </button>
          {pinned.map((l) => (
            <Link key={l} to="/languages">
              <Chip active>{languageLabel(l)}</Chip>
            </Link>
          ))}
          <Link to="/charts"><Chip>Charts</Chip></Link>
          <Link to="/moods"><Chip>Moods</Chip></Link>
          <Link to="/regions"><Chip>Regions</Chip></Link>
          <Link to="/made-for-you"><Chip>Made For You</Chip></Link>
        </div>
      </div>

      <SongShelf title="Continue Listening" explanation="Pick up where you left off" songs={continueListening} seeAllTo="/history" />

      {yourArtists.length >= 3 && (
        <Shelf title="Your Artists" explanation="The voices you keep coming back to">
          {yourArtists.map((a) => (
            <MediaCard
              key={a.id || a.name}
              to={a.id ? `/artist/${a.id}` : `/search/${encodeURIComponent(a.name)}`}
              image={a.image ?? letterAvatar(a.name)}
              title={a.name}
              subtitle={`${a.plays} plays`}
              round
              onPlay={a.id ? () => void playArtist(a.id, a.name) : undefined}
            />
          ))}
        </Shelf>
      )}

      {mixes.isLoading && <ShelfSkeleton />}
      {mixes.data?.slice(0, 2).map((mix) => (
        <SongShelf key={mix.id} title={mix.title} explanation={mix.explanation} songs={mix.songs} seeAllTo="/made-for-you" />
      ))}

      {trending.isLoading ? (
        <ShelfSkeleton />
      ) : (
        <SongShelf
          title={`Trending · ${languageLabel(primaryLang)}`}
          explanation={region?.country === 'IN' ? 'Popular in your region' : 'Trending in your languages'}
          songs={trending.data ?? []}
          seeAllTo={`/search/${encodeURIComponent(trendingSeed(primaryLang))}`}
        />
      )}

      {timeShelf.isLoading ? (
        <ShelfSkeleton />
      ) : (
        <SongShelf title={timeShelf.title} explanation={`Based on your ${dayPartLabel()} sessions`} songs={timeShelf.data ?? []} />
      )}

      <SongShelf title="Recently Loved" explanation="Your latest favorites" songs={favorites.slice(0, 12)} seeAllTo="/favorites" />

      {/* Endless feed: keep scrolling to load more songs forever. */}
      <section className="mt-2">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight">More For You</h2>
        <p className="text-xs text-ink-400 mt-0.5 mb-3">
          {languageLabel(primaryLang)} picks, ranked by your taste — keep scrolling
        </p>
        {feed.isLoading && <CardGridSkeleton />}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
          {feedSongs.map((song, i) => (
            <MediaCard
              key={song.id}
              to={`/song/${song.id}`}
              image={bestImage(song.images)}
              title={song.title}
              subtitle={song.subtitle}
              fluid
              onPlay={() => playQueueFeed(feedSongs, i)}
            />
          ))}
        </div>
        {!feed.isLoading && !feed.isError && (
          <InfiniteSentinel
            onVisible={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
            disabled={!feed.hasNextPage}
            loading={feed.isFetchingNextPage}
          />
        )}
        {feed.isError && feedSongs.length === 0 && (
          <p className="text-sm text-ink-400 py-4">Feed unavailable right now — try again shortly.</p>
        )}
      </section>
    </div>
  );
}
