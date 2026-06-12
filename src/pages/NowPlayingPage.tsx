import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePlayerStore, useCurrentSong } from '@/store/playerStore';
import { useSyncedLyrics } from '@/features/lyrics/useSyncedLyrics';
import { SyncedLyrics } from '@/components/SyncedLyrics';
import { LiveLyricLine } from '@/components/LiveLyricLine';
import { Seekbar } from '@/components/Seekbar';
import { FavButton } from '@/components/FavButton';
import { IconButton } from '@/components/IconButton';
import { TrackMenu } from '@/components/TrackMenu';
import { Marquee } from '@/components/Marquee';
import { EmptyState } from '@/components/States';
import {
  ChevronDownIcon,
  ClockIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  QueueIcon,
  RepeatIcon,
  ShareIcon,
  ShuffleIcon,
  SparkleIcon,
  VolumeIcon,
} from '@/components/Icons';
import { bestImage, FALLBACK_ART } from '@/utils/images';
import { extractAverageColor } from '@/utils/color';
import { acquireWakeLock, releaseWakeLock } from '@/utils/wakeLock';
import { useSettingsStore } from '@/store/settingsStore';
import { useAudioOutputStore } from '@/services/audio/outputWatcher';
import { shareLink } from '@/utils/share';
import { toast } from '@/store/toastStore';
import { cn } from '@/utils/cn';

const RATES = [0.75, 1, 1.25, 1.5, 2];
const SLEEP_OPTIONS = [15, 30, 60];

export default function NowPlayingPage() {
  const song = useCurrentSong();
  usePageTitle(song ? song.title : 'Now Playing');
  const navigate = useNavigate();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const repeat = usePlayerStore((s) => s.repeat);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const rate = usePlayerStore((s) => s.rate);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const sleepAt = usePlayerStore((s) => s.sleepAt);
  const sleepAfterTrack = usePlayerStore((s) => s.sleepAfterTrack);
  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.index);
  const {
    togglePlay, next, prev, cycleRepeat, toggleShuffle, setRate, setVolume, toggleMute,
    setSleepTimer, setSleepAfterTrack, playAt, startRadio,
  } = usePlayerStore.getState();

  const [accent, setAccent] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const keepScreenOn = useSettingsStore((s) => s.keepScreenOn);
  const externalDevice = useAudioOutputStore((s) => s.externalLabel);
  const lyrics = useSyncedLyrics(song);

  // Keep the screen awake while this view is open and music plays.
  useEffect(() => {
    if (keepScreenOn && isPlaying) void acquireWakeLock();
    else releaseWakeLock();
    return releaseWakeLock;
  }, [keepScreenOn, isPlaying]);

  const artUrl = song ? bestImage(song.images, 500) : null;

  useEffect(() => {
    let alive = true;
    setAccent(null);
    if (artUrl) void extractAverageColor(artUrl).then((c) => alive && setAccent(c));
    return () => {
      alive = false;
    };
  }, [artUrl]);

  if (!song) {
    return (
      <EmptyState
        title="Nothing playing"
        message="Pick a song and it will take the stage here."
        action={<Link to="/" className="px-5 py-2.5 rounded-full bg-ember-500 text-ink-950 font-semibold">Browse Home</Link>}
      />
    );
  }

  const upNext = queue.slice(index + 1, index + 6);
  const playingFrom = song.album?.name ?? 'Your Queue';

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => toast('Fullscreen unavailable'));
  };

  const doubleSeek = (dir: 1 | -1) => {
    const p = usePlayerStore.getState();
    p.seek(Math.max(0, Math.min(p.currentTime + dir * 10, p.duration)));
    toast(dir > 0 ? '+10s' : '−10s');
  };

  return (
    <div className="relative -mx-4 md:-mx-8 -mt-4 px-5 md:px-8 pt-[max(0.75rem,env(safe-area-inset-top))] min-h-full overflow-hidden">
      {/* Backdrop: artwork-tinted vertical gradient */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background: accent
              ? `linear-gradient(180deg, ${accent} 0%, rgba(11,14,20,0.97) 55%)`
              : 'linear-gradient(180deg, rgba(30,36,51,0.9) 0%, rgba(11,14,20,0.97) 55%)',
          }}
        />
      </div>

      <div className="max-w-md mx-auto flex flex-col min-h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <IconButton label="Close" onClick={() => navigate(-1)}>
            <ChevronDownIcon className="w-6 h-6" />
          </IconButton>
          <button onClick={toggleFullscreen} className="text-center min-w-0 px-2" title="Toggle fullscreen">
            <span className="block text-[10px] uppercase tracking-[0.18em] text-ink-200/80 font-semibold">Playing from</span>
            <span className="block text-xs font-bold truncate max-w-[200px]">{playingFrom}</span>
          </button>
          <TrackMenu song={song} />
        </div>

        {/* Artwork */}
        <div className="relative mt-5 mb-6 select-none mx-auto" data-deter-context>
          <img
            src={artUrl ?? FALLBACK_ART}
            onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)}
            alt=""
            draggable={false}
            className={cn(
              'w-72 h-72 sm:w-80 sm:h-80 rounded-2xl object-cover shadow-2xl transition-all duration-500',
              isPlaying ? 'scale-100' : 'scale-[0.97] opacity-90',
            )}
          />
          <button aria-label="Rewind 10 seconds (double tap)" onDoubleClick={() => doubleSeek(-1)} className="absolute inset-y-0 left-0 w-1/3 rounded-l-2xl" />
          <button aria-label="Forward 10 seconds (double tap)" onDoubleClick={() => doubleSeek(1)} className="absolute inset-y-0 right-0 w-1/3 rounded-r-2xl" />
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Marquee text={song.title} className="text-[22px] font-bold" />
            <p className="text-sm text-ink-300 truncate mt-0.5">
              {song.artists[0]?.id ? (
                <Link to={`/artist/${song.artists[0].id}`} className="hover:underline">{song.subtitle}</Link>
              ) : (
                song.subtitle
              )}
            </p>
          </div>
          <FavButton song={song} className="shrink-0" />
        </div>

        {externalDevice && (
          <p className="text-[11px] font-semibold text-tide-400 mt-2 flex items-center gap-1.5">
            🎧 Playing on {externalDevice}
          </p>
        )}

        {/* Resso-style live lyric strip */}
        {lyrics.data?.synced && (
          <LiveLyricLine
            lines={lyrics.data.synced}
            onOpen={() => document.getElementById('lyrics-card')?.scrollIntoView({ behavior: 'smooth' })}
          />
        )}

        {/* Seek */}
        <div className="mt-3">
          <Seekbar timesBelow />
        </div>

        {/* Main transport */}
        <div className="flex items-center justify-between mt-1.5">
          <IconButton label={`Shuffle ${shuffle ? 'on' : 'off'}`} onClick={toggleShuffle} active={shuffle}>
            <ShuffleIcon className="w-5 h-5" />
          </IconButton>
          <IconButton label="Previous" onClick={prev} size="lg" className="text-ink-100">
            <PrevIcon className="w-8 h-8" />
          </IconButton>
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-16 h-16 rounded-full bg-ink-100 text-ink-950 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
          >
            {isBuffering ? (
              <span className="w-5 h-5 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <PauseIcon className="w-7 h-7" />
            ) : (
              <PlayIcon className="w-7 h-7 ml-1" />
            )}
          </button>
          <IconButton label="Next" onClick={() => next(true)} size="lg" className="text-ink-100">
            <NextIcon className="w-8 h-8" />
          </IconButton>
          <IconButton label={`Repeat: ${repeat}`} onClick={cycleRepeat} active={repeat !== 'off'} className="relative">
            <RepeatIcon className="w-5 h-5" />
            {repeat === 'one' && <span className="absolute top-1 right-1.5 text-[9px] font-bold text-ember-400">1</span>}
          </IconButton>
        </div>

        {/* Secondary action row */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => startRadio(song)}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink-300 hover:text-ember-400"
          >
            <SparkleIcon className="w-4 h-4" /> Radio
          </button>
          <div className="flex items-center gap-1">
            <IconButton
              label="Share"
              size="sm"
              onClick={() => void shareLink(`/song/${song.id}`, song.title).then((r) => r === 'copied' && toast('Link copied'))}
            >
              <ShareIcon className="w-4 h-4" />
            </IconButton>
            <IconButton label="More options" size="sm" onClick={() => setShowMore((v) => !v)} active={showMore}>
              <ClockIcon className="w-4 h-4" />
            </IconButton>
            <Link to="/queue" aria-label="Queue" className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-300 hover:text-ink-100 hover:bg-ink-700/70">
              <QueueIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Collapsible extras: volume / speed / sleep */}
        {showMore && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 mt-4 p-3 rounded-2xl bg-ink-900/50 border border-ink-700/60 animate-fade-up">
            <div className="flex items-center gap-1.5">
              <IconButton label={muted ? 'Unmute' : 'Mute'} onClick={toggleMute} size="sm">
                <VolumeIcon className="w-4 h-4" muted={muted} />
              </IconButton>
              <input type="range" aria-label="Volume" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-24" />
            </div>
            <div className="flex items-center gap-0.5" role="group" aria-label="Playback speed">
              {RATES.map((r) => (
                <button key={r} onClick={() => setRate(r)} className={cn('px-2 py-1 rounded-lg text-xs font-semibold', rate === r ? 'bg-ink-700 text-ember-400' : 'text-ink-400 hover:text-ink-100')}>
                  {r}×
                </button>
              ))}
            </div>
            <div className="flex items-center gap-0.5" role="group" aria-label="Sleep timer">
              <ClockIcon className="w-4 h-4 text-ink-400" />
              {SLEEP_OPTIONS.map((m) => (
                <button key={m} onClick={() => setSleepTimer(m)} className="px-1.5 py-1 rounded-lg text-xs font-semibold text-ink-400 hover:text-ink-100">{m}m</button>
              ))}
              <button
                onClick={() => setSleepAfterTrack(!sleepAfterTrack)}
                className={cn('px-1.5 py-1 rounded-lg text-xs font-semibold', sleepAfterTrack ? 'text-ember-400' : 'text-ink-400 hover:text-ink-100')}
              >
                end of song
              </button>
              {sleepAt && (
                <button onClick={() => setSleepTimer(null)} className="px-1.5 py-1 rounded-lg text-xs font-semibold text-ember-400">
                  cancel ({Math.max(0, Math.round((sleepAt - Date.now()) / 60_000))}m)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lyrics card */}
        {(lyrics.data?.synced || lyrics.data?.plain) && (
          <div
            id="lyrics-card"
            className="mt-6 rounded-2xl overflow-hidden border border-white/5 scroll-mt-4"
            style={{ background: accent ?? '#1e2433' }}
          >
            <div className="bg-ink-950/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white/90">Lyrics</h2>
                <Link to={`/lyrics/${song.id}`} className="text-xs font-semibold text-white/70 hover:text-white">Open full</Link>
              </div>
              <div className="max-h-72 overflow-y-auto pr-1">
                {lyrics.data.synced ? (
                  <SyncedLyrics lines={lyrics.data.synced} live />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-base leading-7 text-white/90">{lyrics.data.plain}</pre>
                )}
              </div>
              {lyrics.data.synced && (
                <p className="text-[10px] text-white/50 pt-2">Synced lyrics · tap a line to seek</p>
              )}
            </div>
          </div>
        )}

        {/* Up next */}
        <div className="mt-6 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-400">Up Next</h2>
            <Link to="/queue" className="text-xs font-semibold text-ember-400">Full queue</Link>
          </div>
          {upNext.length === 0 && (
            <p className="text-sm text-ink-400">Queue ends here — auto-queue keeps the vibe going if enabled.</p>
          )}
          {upNext.map((s, i) => (
            <button key={`${s.id}-${i}`} onClick={() => playAt(index + 1 + i)} className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-ink-800/60 text-left">
              <img src={bestImage(s.images, 150)} onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)} alt="" className="w-9 h-9 rounded-lg object-cover" />
              <span className="min-w-0">
                <span className="block text-sm truncate">{s.title}</span>
                <span className="block text-xs text-ink-400 truncate">{s.subtitle}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
