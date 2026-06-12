import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { MobileBackBar } from '@/components/MobileBackBar';
import { PlayerBar } from '@/components/PlayerBar';
import { Toasts } from '@/components/Toasts';
import { OnboardingSheet } from '@/components/OnboardingSheet';
import { ShortcutsModal } from '@/components/ShortcutsModal';
import { UpdateDialog } from '@/components/UpdateDialog';
import { FestiveSplash } from '@/components/FestiveSplash';
import { WhatsNewSheet } from '@/components/WhatsNewSheet';
import { initAudioOutputWatcher } from '@/services/audio/outputWatcher';
import { checkForUpdate } from '@/services/update';
import { useUpdateStore } from '@/store/updateStore';
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
  const mainRef = useRef<HTMLElement>(null);
  const navigationType = useNavigationType();
  const theme = useSettingsStore((s) => s.theme);
  const accent = useSettingsStore((s) => s.accent);
  const { pathname } = useLocation();
  const isFullScreenPlayer = pathname === '/now-playing';
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
    initAudioOutputWatcher();
    // Android 13+: media notification needs notification permission.
    void requestNotificationPermissionOnce();
    // Mandatory update gate (native only; no-op on web).
    void checkForUpdate().then((info) => useUpdateStore.getState().setInfo(info));

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

  // Clean navigation: new pages open at the top; browser-back keeps position.
  useEffect(() => {
    if (navigationType !== 'POP') mainRef.current?.scrollTo({ top: 0 });
  }, [pathname, navigationType]);

  useEffect(() => {
    const apply = () => {
      const resolved =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;
      document.documentElement.classList.toggle('light', resolved === 'light');
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      document.documentElement.dataset.accent = accent;
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme, accent]);

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main ref={mainRef} className="flex-1 overflow-y-auto px-4 md:px-8 pt-4 pb-44 md:pb-28">
          <MobileBackBar />
          <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <div key={pathname} className="animate-fade-up">
                <Outlet />
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <Toasts />
      <OnboardingSheet />
      {!isNativePlatform() && <ShortcutsModal />}
      {isNativePlatform() && <UpdateDialog />}
      <FestiveSplash />
      <WhatsNewSheet />
      {!isFullScreenPlayer && (
        <div className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
          <PlayerBar />
          <BottomNav />
        </div>
      )}
    </div>
  );
}
