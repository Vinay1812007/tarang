import { KEYS } from '@/constants/storage-keys';
import { getLocal, removeLocal, setLocal } from '@/services/storage/local';
import { clearEvents } from '@/services/storage/idb';
import { applyDecay, createEmptyProfile, type TasteProfile } from './profile';

let cached: TasteProfile | null = null;

export function loadProfile(): TasteProfile {
  if (cached) return cached;
  const stored = getLocal<TasteProfile | null>(KEYS.profile, null);
  cached = stored && stored.version === 1 ? stored : createEmptyProfile();
  applyDecay(cached);
  return cached;
}

let saveTimer: number | null = null;

/** Debounced persistence — profile updates happen on every play event. */
export function saveProfile(profile: TasteProfile): void {
  cached = profile;
  if (saveTimer != null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    setLocal(KEYS.profile, profile);
    saveTimer = null;
  }, 800);
}

export async function resetProfile(): Promise<void> {
  cached = createEmptyProfile();
  removeLocal(KEYS.profile);
  await clearEvents();
}

/** Monotonic-ish stamp used as a react-query cache key component. */
export function profileStamp(): string {
  const p = loadProfile();
  return `${p.totals.plays}-${p.totals.favorites}-${p.totals.skips}`;
}
