import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { RegionInfo } from '@/types';
import { KEYS } from '@/constants/storage-keys';
import type { AudioQualityPref } from '@/services/audio/engine';

export interface SettingsState {
  theme: 'dark' | 'light';
  autoplay: boolean;
  autoqueueSimilar: boolean;
  keepScreenOn: boolean;
  audioQuality: AudioQualityPref;
  /** 0..1 — how aggressively recommendations personalize. */
  recommendationIntensity: number;
  allowRegionInference: boolean;
  manualCountry: string | null;
  manualRegionLabel: string | null;
  /** Coarse, privacy-safe resolved region. Never an IP. */
  inferredRegion: RegionInfo | null;
  pinnedLanguages: string[];
  mutedLanguages: string[];

  setTheme(theme: 'dark' | 'light'): void;
  setAutoplay(v: boolean): void;
  setAutoqueueSimilar(v: boolean): void;
  setKeepScreenOn(v: boolean): void;
  setAudioQuality(q: AudioQualityPref): void;
  setRecommendationIntensity(v: number): void;
  setAllowRegionInference(v: boolean): void;
  setManualCountry(c: string | null): void;
  setManualRegionLabel(r: string | null): void;
  setInferredRegion(r: RegionInfo | null): void;
  togglePinnedLanguage(id: string): void;
  toggleMutedLanguage(id: string): void;
  setPinnedLanguages(ids: string[]): void;
  resetSettings(): void;
}

const defaults = {
  theme: 'dark' as const,
  autoplay: true,
  autoqueueSimilar: true,
  keepScreenOn: true,
  audioQuality: 'high' as AudioQualityPref,
  recommendationIntensity: 0.7,
  allowRegionInference: true,
  manualCountry: null,
  manualRegionLabel: null,
  inferredRegion: null,
  pinnedLanguages: [] as string[],
  mutedLanguages: [] as string[],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaults,
      setTheme: (theme) => set({ theme }),
      setAutoplay: (autoplay) => set({ autoplay }),
      setAutoqueueSimilar: (autoqueueSimilar) => set({ autoqueueSimilar }),
      setKeepScreenOn: (keepScreenOn) => set({ keepScreenOn }),
      setAudioQuality: (audioQuality) => set({ audioQuality }),
      setRecommendationIntensity: (v) =>
        set({ recommendationIntensity: Math.min(1, Math.max(0, v)) }),
      setAllowRegionInference: (allowRegionInference) => set({ allowRegionInference }),
      setManualCountry: (manualCountry) => set({ manualCountry }),
      setManualRegionLabel: (manualRegionLabel) => set({ manualRegionLabel }),
      setInferredRegion: (inferredRegion) => set({ inferredRegion }),
      togglePinnedLanguage: (id) => {
        const { pinnedLanguages, mutedLanguages } = get();
        const pinned = pinnedLanguages.includes(id)
          ? pinnedLanguages.filter((l) => l !== id)
          : [...pinnedLanguages, id];
        set({ pinnedLanguages: pinned, mutedLanguages: mutedLanguages.filter((l) => l !== id) });
      },
      toggleMutedLanguage: (id) => {
        const { pinnedLanguages, mutedLanguages } = get();
        const muted = mutedLanguages.includes(id)
          ? mutedLanguages.filter((l) => l !== id)
          : [...mutedLanguages, id];
        set({ mutedLanguages: muted, pinnedLanguages: pinnedLanguages.filter((l) => l !== id) });
      },
      setPinnedLanguages: (pinnedLanguages) => set({ pinnedLanguages }),
      resetSettings: () => set({ ...defaults }),
    }),
    { name: KEYS.settings, storage: createJSONStorage(() => window.localStorage) },
  ),
);

export function resolvedRegion(): RegionInfo | null {
  const s = useSettingsStore.getState();
  if (s.manualCountry) {
    return { country: s.manualCountry, regionLabel: s.manualRegionLabel, source: 'manual' };
  }
  return s.inferredRegion;
}
