import { Link, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePlayerStore, useCurrentSong } from '@/store/playerStore';
import { Seekbar } from '@/components/Seekbar';
import { FavButton } from '@/components/FavButton';
import { EmptyState } from '@/components/States';
import {
  ChevronDownIcon,
  ClockIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  ShuffleIcon,
  VolumeIcon,
} from '@/components/Icons';
import { bestImage, FALLBACK_ART } from '@/utils/images';
import { cn } from '@/utils/cn';
import { languageLabel } from '@/constants/languages';

const RATES = [0.75, 1, 1.25, 1.5];
const SLEEP_OPTIONS = [15, 30, 60];

export default function NowPlayingPage() {
  const song = useCurrentSong();
  usePageTitle(song ? `${song.title}` : 'Now Playing');
  const navigate = useNavigate();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const repeat = usePlayerStore((s) => s.repeat);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const rate = usePlayerStore((s) => s.rate);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const sleepAt = usePlayerStore((s) => s.sleepAt);
  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.index);
  const { togglePlay, next, prev, cycleRepeat, toggleShuffle, setRate, setVolume, toggleMute, setSleepTimer, playAt } =
    usePlayerStore.getState();

  if (!song) {
    return <EmptyState title="Nothing playing" message="Pick a song and it will take the stage here." action={<Link to="/" className="px-5 py-2.5 rounded-full bg-ember-500 text-ink-950 font-semibold">Browse Home</Link>} />;
  }

  const upNext = queue.slice(index + 1, index + 4);

  return (
    <div className="max-w-lg mx-auto flex flex-col items-center pt-2">
      <button onClick={() => navigate(-1)} aria-label="Close" className="self-start p-2 text-ink-300 hover:text-ink-100">
        <ChevronDownIcon className="w-6 h-6" />
      </button>

      <img
        src={bestImage(song.images, 500)}
        onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)}
        alt=""
        data-deter-context
        className={cn(
          'w-72 h-72 sm:w-80 sm:h-80 rounded-3xl object-cover shadow-2xl transition-transform duration-700',
          isPlaying ? 'scale-100' : 'scale-95 opacity-90',
        )}
      />

      <div className="w-full flex items-center justify-between mt-7">
        <div className="min-w-0">
          <h1 className="text-xl font-bold truncate">{song.title}</h1>
          <p className="text-sm text-ink-300 truncate">
            {song.artists[0]?.id ? (
              <Link to={`/artist/${song.artists[0].id}`} className="hover:underline">{song.subtitle}</Link>
            ) : (
              song.subtitle
            )}
            {song.language && <span className="text-ink-500"> · {languageLabel(song.language)}</span>}
          </p>
        </div>
        <FavButton song={song} />
      </div>

      <div className="w-full mt-4">
        <Seekbar />
      </div>

      <div className="flex items-center justify-center gap-3 sm:gap-5 mt-4">
        <button onClick={toggleShuffle} aria-label="Shuffle" className={cn('p-2.5 rounded-full hover:bg-ink-700', shuffle ? 'text-ember-400' : 'text-ink-300')}>
          <ShuffleIcon className="w-5 h-5" />
        </button>
        <button onClick={prev} aria-label="Previous" className="p-3 rounded-full text-ink-100 hover:bg-ink-700">
          <PrevIcon className="w-7 h-7" />
        </button>
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="w-16 h-16 rounded-full bg-ember-500 text-ink-950 flex items-center justify-center hover:bg-ember-400 shadow-xl"
        >
          {isBuffering ? (
            <span className="w-5 h-5 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <PauseIcon className="w-7 h-7" />
          ) : (
            <PlayIcon className="w-7 h-7 ml-1" />
          )}
        </button>
        <button onClick={() => next(true)} aria-label="Next" className="p-3 rounded-full text-ink-100 hover:bg-ink-700">
          <NextIcon className="w-7 h-7" />
        </button>
        <button onClick={cycleRepeat} aria-label={`Repeat: ${repeat}`} className={cn('p-2.5 rounded-full hover:bg-ink-700 relative', repeat !== 'off' ? 'text-ember-400' : 'text-ink-300')}>
          <RepeatIcon className="w-5 h-5" />
          {repeat === 'one' && <span className="absolute top-0 right-0 text-[10px] font-bold text-ember-400">1</span>}
        </button>
      </div>

      <div className="w-full flex flex-wrap items-center justify-center gap-x-5 gap-y-3 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <button onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} className="text-ink-300 hover:text-ink-100">
            <VolumeIcon className="w-4 h-4" muted={muted} />
          </button>
          <input type="range" aria-label="Volume" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-24" />
        </div>
        <div className="flex items-center gap-1">
          {RATES.map((r) => (
            <button key={r} onClick={() => setRate(r)} className={cn('px-2 py-1 rounded-lg text-xs font-semibold', rate === r ? 'bg-ink-700 text-ember-400' : 'text-ink-400 hover:text-ink-100')}>
              {r}×
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <ClockIcon className="w-4 h-4 text-ink-400" />
          {SLEEP_OPTIONS.map((m) => (
            <button key={m} onClick={() => setSleepTimer(m)} className="px-2 py-1 rounded-lg text-xs font-semibold text-ink-400 hover:text-ink-100">
              {m}m
            </button>
          ))}
          {sleepAt && (
            <button onClick={() => setSleepTimer(null)} className="px-2 py-1 rounded-lg text-xs font-semibold text-ember-400">
              Cancel ({Math.max(0, Math.round((sleepAt - Date.now()) / 60_000))}m)
            </button>
          )}
        </div>
        {song.hasLyrics && (
          <Link to={`/lyrics/${song.id}`} className="px-3 py-1 rounded-lg text-xs font-semibold border border-ink-600 text-ink-200 hover:border-ink-400">
            Lyrics
          </Link>
        )}
      </div>

      {upNext.length > 0 && (
        <div className="w-full mt-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-400">Up Next</h2>
            <Link to="/queue" className="text-xs font-semibold text-ember-400">Full queue</Link>
          </div>
          {upNext.map((s, i) => (
            <button key={`${s.id}-${i}`} onClick={() => playAt(index + 1 + i)} className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-ink-850 text-left">
              <img src={bestImage(s.images, 150)} onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)} alt="" className="w-9 h-9 rounded-lg object-cover" />
              <span className="min-w-0">
                <span className="block text-sm truncate">{s.title}</span>
                <span className="block text-xs text-ink-400 truncate">{s.subtitle}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
