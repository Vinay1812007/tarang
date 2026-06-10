import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePlayerStore, useCurrentSong } from '@/store/playerStore';
import { useSyncedLyrics } from '@/features/lyrics/useSyncedLyrics';
import { SyncedLyrics } from '@/components/SyncedLyrics';
import { Seekbar } from '@/components/Seekbar';
import { FavButton } from '@/components/FavButton';
import { IconButton } from '@/components/IconButton';
import { EmptyState } from '@/components/States';
import {
  ChevronDownIcon,
  ClockIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  ShareIcon,
  ShuffleIcon,
  SparkleIcon,
  VolumeIcon,
} from '@/components/Icons';
import { bestImage, FALLBACK_ART } from '@/utils/images';
import { extractAverageColor } from '@/utils/color';
import { shareLink } from '@/utils/share';
import { toast } from '@/store/toastStore';
import { cn } from '@/utils/cn';
import { languageLabel } from '@/constants/languages';

const RATES = [0.75, 1, 1.25, 1.5, 2];
const SLEEP_OPTIONS = [15, 30, 60];

type Panel = 'upnext' | 'lyrics';

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

  const [panel, setPanel] = useState<Panel>('upnext');
  const [accent, setAccent] = useState<string | null>(null);
  const lyrics = useSyncedLyrics(song);

  const artUrl = song ? bestImage(song.images, 500) : null;

  useEffect(() => {
    let alive = true;
    setAccent(null);
    if (artUrl) {
      void extractAverageColor(artUrl).then((c) => alive && setAccent(c));
    }
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
    <div className="relative -mx-4 md:-mx-8 -mt-4 px-4 md:px-8 pt-4 min-h-full overflow-hidden">
      {/* Immersive backdrop: blurred artwork + dynamic accent */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <img src={artUrl ?? FALLBACK_ART} alt="" className="w-full h-full object-cover blur-3xl scale-125 opacity-25" />
        <div
          className="absolute inset-0"
          style={{
            background: accent
              ? `radial-gradient(120% 70% at 50% 0%, ${accent} 0%, rgba(11,14,20,0.92) 65%)`
              : 'linear-gradient(to bottom, rgba(21,26,38,0.6), rgba(11,14,20,0.95))',
          }}
        />
      </div>

      <div className="max-w-lg mx-auto flex flex-col items-center">
        <div className="w-full flex items-center justify-between">
          <IconButton label="Close" onClick={() => navigate(-1)}>
            <ChevronDownIcon className="w-6 h-6" />
          </IconButton>
          <span className="text-[11px] uppercase tracking-widest text-ink-400 font-semibold">Now Playing</span>
          <IconButton label="Toggle fullscreen" onClick={toggleFullscreen}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-5 h-5">
              <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" />
            </svg>
          </IconButton>
        </div>

        {/* Artwork with double-tap seek zones */}
        <div className="relative mt-2 select-none" data-deter-context>
          <img
            src={artUrl ?? FALLBACK_ART}
            onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)}
            alt=""
            draggable={false}
            className={cn(
              'w-64 h-64 sm:w-80 sm:h-80 rounded-3xl object-cover shadow-2xl transition-transform duration-700',
              isPlaying ? 'scale-100' : 'scale-95 opacity-90',
            )}
          />
          <button aria-label="Rewind 10 seconds (double tap)" onDoubleClick={() => doubleSeek(-1)} className="absolute inset-y-0 left-0 w-1/3 rounded-l-3xl" />
          <button aria-label="Forward 10 seconds (double tap)" onDoubleClick={() => doubleSeek(1)} className="absolute inset-y-0 right-0 w-1/3 rounded-r-3xl" />
        </div>

        <div className="w-full flex items-center justify-between mt-6 gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{song.title}</h1>
            <p className="text-sm text-ink-300 truncate">
              {song.artists[0]?.id ? (
                <Link to={`/artist/${song.artists[0].id}`} className="hover:underline">{song.subtitle}</Link>
              ) : (
                song.subtitle
              )}
              {song.language && <span className="text-ink-500"> · {languageLabel(song.language)}</span>}
            </p>
          </div>
          <div className="flex items-center shrink-0">
            <IconButton
              label="Share"
              onClick={() => void shareLink(`/song/${song.id}`, song.title).then((r) => r === 'copied' && toast('Link copied'))}
              size="sm"
            >
              <ShareIcon className="w-4 h-4" />
            </IconButton>
            <FavButton song={song} />
          </div>
        </div>

        <div className="w-full mt-3">
          <Seekbar />
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-3">
          <IconButton label={`Shuffle ${shuffle ? 'on' : 'off'}`} onClick={toggleShuffle} active={shuffle}>
            <ShuffleIcon className="w-5 h-5" />
          </IconButton>
          <IconButton label="Previous" onClick={prev} size="lg" className="text-ink-100">
            <PrevIcon className="w-7 h-7" />
          </IconButton>
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-16 h-16 rounded-full bg-ember-500 text-ink-950 flex items-center justify-center hover:bg-ember-400 shadow-xl active:scale-95 transition-transform"
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
            <NextIcon className="w-7 h-7" />
          </IconButton>
          <IconButton label={`Repeat: ${repeat}`} onClick={cycleRepeat} active={repeat !== 'off'} className="relative">
            <RepeatIcon className="w-5 h-5" />
            {repeat === 'one' && <span className="absolute top-1 right-1.5 text-[9px] font-bold text-ember-400">1</span>}
          </IconButton>
        </div>

        {/* Secondary controls */}
        <div className="w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 mt-5 text-sm">
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
          <button
            onClick={() => startRadio(song)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink-600 text-xs font-semibold text-ink-200 hover:border-ember-500 hover:text-ember-400"
          >
            <SparkleIcon className="w-3.5 h-3.5" /> Start radio
          </button>
        </div>

        {/* Up Next / Lyrics panel */}
        <div className="w-full mt-7 mb-4">
          <div className="flex gap-2 mb-3" role="tablist">
            {(['upnext', 'lyrics'] as Panel[]).map((p) => (
              <button
                key={p}
                role="tab"
                aria-selected={panel === p}
                onClick={() => setPanel(p)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider',
                  panel === p ? 'bg-ink-700 text-ember-400' : 'text-ink-400 hover:text-ink-100',
                )}
              >
                {p === 'upnext' ? 'Up Next' : 'Lyrics'}
              </button>
            ))}
            {panel === 'upnext' && (
              <Link to="/queue" className="ml-auto text-xs font-semibold text-ember-400 self-center">Full queue</Link>
            )}
          </div>

          {panel === 'upnext' && (
            <div>
              {upNext.length === 0 && <p className="text-sm text-ink-400">Queue ends here — auto-queue keeps the vibe going if enabled.</p>}
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
          )}

          {panel === 'lyrics' && (
            <div className="max-h-80 overflow-y-auto rounded-2xl bg-ink-900/50 border border-ink-700/60 p-3">
              {lyrics.isLoading && <p className="text-sm text-ink-400 px-2 py-4">Looking for lyrics…</p>}
              {!lyrics.isLoading && !lyrics.data && (
                <p className="text-sm text-ink-400 px-2 py-4">No lyrics found for this track.</p>
              )}
              {lyrics.data?.synced ? (
                <>
                  <SyncedLyrics lines={lyrics.data.synced} live />
                  <p className="text-[10px] text-ink-500 px-3 pt-3">Synced lyrics via LRCLIB · tap a line to seek</p>
                </>
              ) : lyrics.data?.plain ? (
                <pre className="whitespace-pre-wrap font-sans text-base leading-7 text-ink-200 px-2">{lyrics.data.plain}</pre>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
