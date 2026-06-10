import { Link, useNavigate } from 'react-router-dom';
import { usePlayerStore, useCurrentSong } from '@/store/playerStore';
import { bestImage, FALLBACK_ART } from '@/utils/images';
import { cn } from '@/utils/cn';
import { Seekbar } from './Seekbar';
import { FavButton } from './FavButton';
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
  const { togglePlay, next, prev, cycleRepeat, toggleShuffle, setVolume, toggleMute } =
    usePlayerStore.getState();
  const navigate = useNavigate();

  if (!song) return null;

  return (
    <div className="bg-ink-950/95 backdrop-blur border-t border-ink-700 px-3 sm:px-4 py-2">
      <div className="flex items-center gap-3 max-w-screen-2xl mx-auto">
        {/* Track info */}
        <button
          onClick={() => navigate('/now-playing')}
          className="flex items-center gap-3 min-w-0 w-48 sm:w-64 text-left"
        >
          <img
            src={bestImage(song.images, 150)}
            onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)}
            alt=""
            className={cn('w-11 h-11 rounded-lg object-cover', isBuffering && 'opacity-50')}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{song.title}</p>
            <p className="text-xs text-ink-300 truncate">{song.subtitle}</p>
          </div>
        </button>

        <FavButton song={song} className="hidden sm:block" />

        {/* Transport */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={toggleShuffle}
              aria-label="Shuffle"
              className={cn('hidden sm:block p-2 rounded-full hover:bg-ink-700', shuffle ? 'text-ember-400' : 'text-ink-300')}
            >
              <ShuffleIcon className="w-4 h-4" />
            </button>
            <button onClick={prev} aria-label="Previous" className="p-2 rounded-full text-ink-100 hover:bg-ink-700">
              <PrevIcon className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-10 h-10 rounded-full bg-ember-500 text-ink-950 flex items-center justify-center hover:bg-ember-400"
            >
              {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
            </button>
            <button onClick={() => next(true)} aria-label="Next" className="p-2 rounded-full text-ink-100 hover:bg-ink-700">
              <NextIcon className="w-5 h-5" />
            </button>
            <button
              onClick={cycleRepeat}
              aria-label={`Repeat: ${repeat}`}
              className={cn('hidden sm:block p-2 rounded-full hover:bg-ink-700 relative', repeat !== 'off' ? 'text-ember-400' : 'text-ink-300')}
            >
              <RepeatIcon className="w-4 h-4" />
              {repeat === 'one' && <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold text-ember-400">1</span>}
            </button>
          </div>
          <div className="hidden sm:block w-full max-w-xl">
            <Seekbar />
          </div>
        </div>

        {/* Right cluster */}
        <div className="hidden md:flex items-center gap-2 w-48 justify-end">
          <Link to="/queue" aria-label="Queue" className="p-2 rounded-full text-ink-300 hover:bg-ink-700">
            <QueueIcon className="w-4 h-4" />
          </Link>
          <button onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} className="p-2 rounded-full text-ink-300 hover:bg-ink-700">
            <VolumeIcon className="w-4 h-4" muted={muted} />
          </button>
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
      {/* Mobile mini seekbar */}
      <div className="sm:hidden mt-1">
        <Seekbar compact />
      </div>
    </div>
  );
}
