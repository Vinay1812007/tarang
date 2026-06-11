import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlayerStore, useCurrentSong } from '@/store/playerStore';
import { bestImage, FALLBACK_ART } from '@/utils/images';
import { extractAverageColor } from '@/utils/color';
import { cn } from '@/utils/cn';
import { Seekbar } from './Seekbar';
import { FavButton } from './FavButton';
import { IconButton } from './IconButton';
import { Marquee } from './Marquee';
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
  const [accent, setAccent] = useState<string | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 64 && Math.abs(dy) < 48) {
      if (dx < 0) next(true);
      else prev();
    }
  };

  const artUrl = song ? bestImage(song.images, 150) : null;

  useEffect(() => {
    let alive = true;
    if (artUrl) void extractAverageColor(artUrl).then((c) => alive && setAccent(c));
    else setAccent(null);
    return () => {
      alive = false;
    };
  }, [artUrl]);

  if (!song) return null;

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <>
      {/* ---- Mobile: floating mini-player card (artwork-tinted) ---- */}
      <div className="sm:hidden px-2 pb-1.5">
        <div
          className="relative rounded-xl overflow-hidden shadow-lg border border-white/5"
          style={{ background: accent ?? '#1e2433' }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex items-center gap-2.5 pl-2 pr-1 py-1.5 bg-ink-950/25">
            <button
              onClick={() => navigate('/now-playing')}
              className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
              aria-label="Open full screen player"
            >
              <img
                src={artUrl ?? FALLBACK_ART}
                onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)}
                alt=""
                className={cn('w-10 h-10 rounded-md object-cover', isBuffering && 'opacity-50')}
              />
              <span className="min-w-0 flex-1">
                <Marquee text={song.title} className="text-[13px] font-semibold text-white" />
                <span className="block text-[11px] text-white/70 truncate">{song.subtitle}</span>
              </span>
            </button>
            <FavButton song={song} className="text-white/80" />
            <IconButton
              label={isPlaying ? 'Pause' : 'Play'}
              onClick={togglePlay}
              className="text-white hover:text-white hover:bg-white/10"
            >
              {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-0.5" />}
            </IconButton>
          </div>
          {/* progress hairline inside the card */}
          <div className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* ---- Desktop bar: three-zone layout ---- */}
      <div className="hidden sm:block bg-ink-950/95 backdrop-blur border-t border-ink-700">
        <div className="flex items-center gap-4 px-4 py-2.5 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3 min-w-0 w-60 lg:w-80">
            <button onClick={() => navigate('/now-playing')} aria-label="Open full screen player" className="group shrink-0">
              <img
                src={artUrl ?? FALLBACK_ART}
                onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)}
                alt=""
                className={cn('w-14 h-14 rounded-lg object-cover group-hover:opacity-80 transition-opacity shadow-lg', isBuffering && 'opacity-50')}
              />
            </button>
            <div className="min-w-0">
              <Marquee text={song.title} className="text-sm font-semibold" />
              <p className="text-xs text-ink-300 truncate">{song.subtitle}</p>
            </div>
            <FavButton song={song} />
          </div>

          <div className="flex-1 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-3">
              <IconButton label={`Shuffle ${shuffle ? 'on' : 'off'}`} onClick={toggleShuffle} active={shuffle} size="sm">
                <ShuffleIcon className="w-4 h-4" />
              </IconButton>
              <IconButton label="Previous" onClick={prev} size="sm" className="text-ink-100">
                <PrevIcon className="w-5 h-5" />
              </IconButton>
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-10 h-10 rounded-full bg-ink-100 text-ink-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
              </button>
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

          <div className="hidden md:flex items-center gap-1 w-60 lg:w-80 justify-end">
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
    </>
  );
}
