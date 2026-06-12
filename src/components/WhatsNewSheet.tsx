import { useState } from 'react';
import { KEYS } from '@/constants/storage-keys';
import { getLocal, setLocal } from '@/services/storage/local';
import { notesFor } from '@/constants/changelog';

/**
 * Shown exactly once on the first launch after an update: what changed in
 * the version you just received. Fresh installs never see it (onboarding
 * stamps the current version instead).
 */
export function WhatsNewSheet() {
  const [open, setOpen] = useState(() => {
    const last = getLocal<string | null>(KEYS.lastSeenVersion, null);
    const onboarded = getLocal<boolean>(KEYS.onboarded, false);
    return onboarded && last != null && last !== __APP_VERSION__;
  });

  if (!open) return null;

  const dismiss = () => {
    setLocal(KEYS.lastSeenVersion, __APP_VERSION__);
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-ink-950/80 backdrop-blur-sm p-0 sm:p-6">
      <div className="w-full sm:max-w-md glass rounded-t-3xl sm:rounded-3xl p-6 animate-fade-up">
        <div className="flex items-center gap-3 mb-4">
          <img src="/icons/icon.svg" alt="" className="w-10 h-10 rounded-xl" />
          <div>
            <h2 className="text-xl font-bold">What’s new</h2>
            <p className="text-xs text-ink-400">VinaX v{__APP_VERSION__}</p>
          </div>
        </div>
        <ul className="space-y-2.5 mb-6">
          {notesFor(__APP_VERSION__).map((line) => (
            <li key={line} className="text-sm text-ink-200 leading-relaxed">{line}</li>
          ))}
        </ul>
        <button onClick={dismiss} className="w-full py-3 rounded-full bg-ember-500 text-ink-950 font-bold hover:bg-ember-400">
          Nice — let’s go
        </button>
      </div>
    </div>
  );
}
