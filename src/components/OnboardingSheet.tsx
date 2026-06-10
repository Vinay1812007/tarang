import { useState } from 'react';
import { LANGUAGES } from '@/constants/languages';
import { KEYS } from '@/constants/storage-keys';
import { getLocal, setLocal } from '@/services/storage/local';
import { readBrowserSignals } from '@/services/location/browserSignals';
import { useSettingsStore } from '@/store/settingsStore';
import { Chip } from './Chip';

/**
 * First-run language picker — the strongest cold-start signal we can get
 * without an account. Pre-selects detected browser languages.
 */
export function OnboardingSheet() {
  const [open, setOpen] = useState(() => !getLocal<boolean>(KEYS.onboarded, false));
  const detected = readBrowserSignals().languages;
  const [picked, setPicked] = useState<string[]>(detected.length ? detected : ['hindi', 'english']);

  if (!open) return null;

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const finish = (save: boolean) => {
    if (save && picked.length) useSettingsStore.getState().setPinnedLanguages(picked.slice(0, 5));
    setLocal(KEYS.onboarded, true);
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-ink-950/80 backdrop-blur-sm p-0 sm:p-6">
      <div className="w-full sm:max-w-md bg-ink-850 border border-ink-700 rounded-t-3xl sm:rounded-3xl p-6 animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <img src="/icons/icon.svg" alt="" className="w-10 h-10 rounded-xl" />
          <div>
            <h2 className="text-xl font-bold">Welcome to Tarang</h2>
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
          <button
            onClick={() => finish(true)}
            className="flex-1 py-3 rounded-full bg-ember-500 text-ink-950 font-bold hover:bg-ember-400"
          >
            Start listening
          </button>
          <button onClick={() => finish(false)} className="px-5 py-3 rounded-full border border-ink-600 text-sm text-ink-200">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
