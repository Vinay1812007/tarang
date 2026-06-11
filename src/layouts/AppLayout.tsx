import { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { MobileBackBar } from '@/components/MobileBackBar';
import { PlayerBar } from '@/components/PlayerBar';
import { Toasts } from '@/components/Toasts';
import { OnboardingSheet } from '@/components/OnboardingSheet';
import { PageSkeleton } from '@/components/Skeletons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { runMigrations } from '@/services/storage/local';
import { resolveRegion } from '@/services/location/inference';
import { readBrowserSignals } from '@/services/location/browserSignals';
import { defaultLanguagesForCountry } from '@/constants/regions';
import { isNativePlatform, requestNotificationPermissionOnce } from '@/services/native';
import { installDeterrence } from '@/utils/deterrence';

export function AppLayout() {
  const theme = useSettingsStore((s) => s.theme);
  useKeyboardShortcuts();

  // Android hardware back: pop history, or minimize on the root screen.
  useEffect(() => {
    if (!isNativePlatform()) return;
    let remove: (() => void) | null = null;
    void import('@capacitor/app').then(({ App }) => {
      void App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack && window.history.length > 1) window.history.back();
        else void App.minimizeApp();
      }).then((handle) => {
        remove = () => void handle.remove();
      });
    });
    return () => remove?.();
  }, []);

  // One-time bootstrap.
  useEffect(() => {
    runMigrations();
    usePlayerStore.getState().initEngine();
    installDeterrence();
    // Android 13+: media notification needs notification permission.
    void requestNotificationPermissionOnce();

    const settings = useSettingsStore.getState();
    void resolveRegion({
      allowInference: settings.allowRegionInference,
      manualCountry: settings.manualCountry,
      manualRegionLabel: settings.manualRegionLabel,
    }).then((region) => {
      useSettingsStore.getState().setInferredRegion(region);
      // Cold start: seed language preferences from browser + country once
      // (the onboarding sheet may have already pinned languages).
      const current = useSettingsStore.getState();
      if (current.pinnedLanguages.length === 0) {
        const fromBrowser = readBrowserSignals().languages;
        const fromCountry = defaultLanguagesForCountry(region.country);
        const seeded = [...new Set([...fromBrowser, ...fromCountry])].slice(0, 3);
        if (seeded.length) current.setPinnedLanguages(seeded);
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-4 pb-44 md:pb-28">
          <MobileBackBar />
          <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <Toasts />
      <OnboardingSheet />
      <div className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)] bg-ink-950/95">
        <PlayerBar />
        <BottomNav />
      </div>
    </div>
  );
}
