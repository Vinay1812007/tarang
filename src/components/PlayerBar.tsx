import { Link, useNavigate } from 'react-router-dom';
import { usePlayerStore, useCurrentSong } from '@/store/playerStore';
import { bestImage, FALLBACK_ART } from '@/utils/images';
import { cn } from '@/utils/cn';
import { Seekbar } from './Seekbar';
import { FavButton } from './FavButton';
import { IconButton } from './IconButton';
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  QueueIcon,
  RepeatIcon,
  ShuffleIcon,
  VolumeIcon,
} from './Icons';

export function PlayerBar() {
  const song = useCurrentSong();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const repeat = usePlayerStore((s) => s.repeat);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const { togglePlay, next, prev, cycleRepeat, toggleShuffle, setVolume, toggleMute } =
    usePlayerStore.getState();
  const navigate = useNavigate();

  if (!song) return null;

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="bg-ink-950/95 backdrop-blur border-t border-ink-700">
      {/* Mobile: thin progress line above the bar */}
      <div className="sm:hidden h-0.5 bg-ink-700">
        <div className="h-full bg-ember-500 transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
      </div>

      {/* ---- Mobile compact bar ---- */}
      <div className="sm:hidden flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => navigate('/now-playing')}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
          aria-label="Open full screen player"
        >
          <img
            src={bestImage(song.images, 150)}
            onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)}
            alt=""
            className={cn('w-10 h-10 rounded-lg object-cover', isBuffering && 'opacity-50')}
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold truncate">{song.title}</span>
            <span className="block text-xs text-ink-300 truncate">{song.subtitle}</span>
          </span>
        </button>
        <FavButton song={song} />
        <IconButton label={isPlaying ? 'Pause' : 'Play'} onClick={togglePlay} className="bg-ember-500 text-ink-950 hover:bg-ember-400 hover:text-ink-950">
          {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
        </IconButton>
        <IconButton label="Next" onClick={() => next(true)} size="sm">
          <NextIcon className="w-5 h-5" />
        </IconButton>
      </div>

      {/* ---- Desktop bar ---- */}
      <div className="hidden sm:flex items-center gap-4 px-4 py-2 max-w-screen-2xl mx-auto">
        <button
          onClick={() => navigate('/now-playing')}
          className="flex items-center gap-3 min-w-0 w-60 lg:w-72 text-left group"
          aria-label="Open full screen player"
        >
          <img
            src={bestImage(song.images, 150)}
            onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)}
            alt=""
            className={cn('w-12 h-12 rounded-lg object-cover group-hover:opacity-80 transition-opacity', isBuffering && 'opacity-50')}
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold truncate">{song.title}</span>
            <span className="block text-xs text-ink-300 truncate">{song.subtitle}</span>
          </span>
        </button>

        <FavButton song={song} />

        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <IconButton label={`Shuffle ${shuffle ? 'on' : 'off'}`} onClick={toggleShuffle} active={shuffle} size="sm">
              <ShuffleIcon className="w-4 h-4" />
            </IconButton>
            <IconButton label="Previous" onClick={prev} size="sm" className="text-ink-100">
              <PrevIcon className="w-5 h-5" />
            </IconButton>
            <IconButton label={isPlaying ? 'Pause' : 'Play'} onClick={togglePlay} className="bg-ember-500 text-ink-950 hover:bg-ember-400 hover:text-ink-950">
              {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
            </IconButton>
            <IconButton label="Next" onClick={() => next(true)} size="sm" className="text-ink-100">
              <NextIcon className="w-5 h-5" />
            </IconButton>
            <IconButton label={`Repeat: ${repeat}`} onClick={cycleRepeat} active={repeat !== 'off'} size="sm" className="relative">
              <RepeatIcon className="w-4 h-4" />
              {repeat === 'one' && (
                <span className="absolute -top-0.5 right-0.5 text-[9px] font-bold text-ember-400">1</span>
              )}
            </IconButton>
          </div>
          <div className="w-full max-w-xl">
            <Seekbar />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 w-52 justify-end">
          <Link to="/queue" aria-label="Queue" title="Queue" className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-300 hover:text-ink-100 hover:bg-ink-700/70">
            <QueueIcon className="w-4 h-4" />
          </Link>
          <IconButton label={muted ? 'Unmute' : 'Mute'} onClick={toggleMute} size="sm">
            <VolumeIcon className="w-4 h-4" muted={muted} />
          </IconButton>
          <input
            type="range"
            aria-label="Volume"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
