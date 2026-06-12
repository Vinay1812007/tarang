import { useState } from 'react';
import { LANGUAGES } from '@/constants/languages';
import { KEYS } from '@/constants/storage-keys';
import { getLocal, setLocal } from '@/services/storage/local';
import { readBrowserSignals } from '@/services/location/browserSignals';
import { useSettingsStore } from '@/store/settingsStore';
import { isNativePlatform } from '@/services/native';
import { Chip } from './Chip';

interface TourSlide {
  emoji: string;
  title: string;
  lines: string[];
}

const TOUR: TourSlide[] = [
  {
    emoji: '🏠',
    title: 'Home is yours',
    lines: [
      'Shelves learn from what you play — every one explains why it exists.',
      'Scroll down: “More For You” loads songs forever.',
      'Tap “Surprise me” when you can’t decide.',
    ],
  },
  {
    emoji: '🔍',
    title: 'Find anything',
    lines: [
      'Search songs, albums, artists, and playlists — results favor your languages.',
      'Use the mic for voice search, chips to filter by language.',
      'Charts and Moods give you endless lists per language or vibe.',
    ],
  },
  {
    emoji: '🎧',
    title: 'The player',
    lines: [
      'Tap the mini player to go full screen; swipe it left/right to skip tracks.',
      'Double-tap the artwork edges to jump ±10 seconds.',
      'Live lyrics follow the song — tap a line to seek to it.',
    ],
  },
  {
    emoji: '❤️',
    title: 'Your library',
    lines: [
      'Heart any song — favorites power your recommendations.',
      'Queue anything, reorder it, or save the whole queue as a collection.',
      'History, Taste Profile, and all your data live only on this device.',
    ],
  },
  {
    emoji: '⚙️',
    title: 'Make it yours',
    lines: [
      'Settings: accent themes, dark/light/system, sleep timer, audio quality.',
      'Start Radio from any song to auto-build a queue around it.',
      'Updates install right inside the app when a new version ships.',
    ],
  },
];

/**
 * First-open flow: pick languages (cold-start signal), then an A→Z tour of
 * the app. Shown exactly once; skippable at any point.
 */
export function OnboardingSheet() {
  const [open, setOpen] = useState(() => !getLocal<boolean>(KEYS.onboarded, false));
  const [step, setStep] = useState(-1); // -1 = language pick, 0..n = tour
  const detected = readBrowserSignals().languages;
  const [picked, setPicked] = useState<string[]>(detected.length ? detected : ['hindi', 'english']);

  if (!open) return null;

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const finish = () => {
    setLocal(KEYS.onboarded, true);
    // A fresh install has no "previous version" — don't show What's New too.
    setLocal(KEYS.lastSeenVersion, __APP_VERSION__);
    setOpen(false);
  };

  const saveLanguages = () => {
    if (picked.length) useSettingsStore.getState().setPinnedLanguages(picked.slice(0, 5));
    setStep(0);
  };

  const slide = step >= 0 ? TOUR[step] : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-ink-950/80 backdrop-blur-sm p-0 sm:p-6">
      <div className="w-full sm:max-w-md glass rounded-t-3xl sm:rounded-3xl p-6 animate-fade-up">
        {step === -1 ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <img src="/icons/icon.svg" alt="" className="w-10 h-10 rounded-xl" />
              <div>
                <h2 className="text-xl font-bold">Welcome to VinaX</h2>
                <p className="text-xs text-ink-400">No login. Your taste stays on this device.</p>
              </div>
            </div>
            <p className="text-sm text-ink-300 mt-3 mb-3">Which languages do you listen to?</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {LANGUAGES.map((l) => (
                <Chip key={l.id} active={picked.includes(l.id)} onClick={() => toggle(l.id)}>
                  {l.label}
                </Chip>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={saveLanguages} className="flex-1 py-3 rounded-full bg-ember-500 text-ink-950 font-bold hover:bg-ember-400">
                Continue
              </button>
              <button onClick={finish} className="px-5 py-3 rounded-full border border-ink-600 text-sm text-ink-200">
                Skip
              </button>
            </div>
          </>
        ) : slide ? (
          <>
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">{slide.emoji}</div>
              <h2 className="text-xl font-bold">{slide.title}</h2>
            </div>
            <ul className="space-y-2.5 mb-6">
              {slide.lines.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-ink-200">
                  <span className="text-ember-500 mt-0.5">•</span> {line}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-center gap-1.5 mb-5" aria-hidden>
              {TOUR.map((_, i) => (
                <span key={i} className={i === step ? 'w-6 h-1.5 rounded-full bg-ember-500' : 'w-1.5 h-1.5 rounded-full bg-ink-600'} />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => (step < TOUR.length - 1 ? setStep(step + 1) : finish())}
                className="flex-1 py-3 rounded-full bg-ember-500 text-ink-950 font-bold hover:bg-ember-400"
              >
                {step < TOUR.length - 1 ? 'Next' : isNativePlatform() ? 'Start listening' : 'Start listening'}
              </button>
              <button onClick={finish} className="px-5 py-3 rounded-full border border-ink-600 text-sm text-ink-200">
                Skip tour
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
