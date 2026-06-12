import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSettingsStore } from '@/store/settingsStore';
import { useRegion } from '@/features/location/useRegion';
import {
  clearCachedMetadata,
  clearFavorites,
  clearHistory,
  clearPersonalization,
  clearQueue,
  downloadProfileExport,
  importProfileJson,
  resetAppState,
} from '@/features/settings/actions';
import { COUNTRIES, REGIONS } from '@/constants/regions';
import { ensureNotificationPermission, isNativePlatform, mediaSessionAvailable } from '@/services/native';
import { checkForUpdate } from '@/services/update';
import { useUpdateStore } from '@/store/updateStore';
import { getMediaSessionLog, runNotificationSelfTest } from '@/services/media-session';
import { toast } from '@/store/toastStore';
import { LANGUAGES } from '@/constants/languages';
import { Chip } from '@/components/Chip';
import { MoonIcon, SunIcon } from '@/components/Icons';
import type { AudioQualityPref } from '@/services/audio/engine';
import { cn } from '@/utils/cn';

function Row({ label, note, children }: { label: string; note?: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-ink-800 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {note && <p className="text-xs text-ink-400 mt-0.5 max-w-md">{note}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn('w-11 h-6 rounded-full transition-colors relative', on ? 'bg-ember-500' : 'bg-ink-600')}
    >
      <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink-700 bg-ink-850/50 px-5 py-2 mb-5">
      <h2 className="text-base font-bold pt-3 pb-1">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  usePageTitle('Settings');
  const s = useSettingsStore();
  const region = useRegion();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notifStatus, setNotifStatus] = useState<string | null>(null);
  useEffect(() => {
    if (isNativePlatform()) void ensureNotificationPermission().then(setNotifStatus);
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Settings</h1>

      <Section title="Appearance & Playback">
        <Row label="Accent theme" note="Glass UI tint — applies everywhere instantly.">
          <div className="flex items-center gap-2">
            {([
              ['ember', '#f0922e'],
              ['ocean', '#38bdf8'],
              ['violet', '#a78bfa'],
              ['rose', '#fb7185'],
              ['emerald', '#34d399'],
            ] as Array<[string, string]>).map(([id, color]) => (
              <button
                key={id}
                aria-label={`${id} theme`}
                onClick={() => s.setAccent(id)}
                className={
                  s.accent === id
                    ? 'w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-ink-900 ring-ink-100 scale-110 transition-transform'
                    : 'w-8 h-8 rounded-full hover:scale-110 transition-transform'
                }
                style={{ background: color }}
              />
            ))}
          </div>
        </Row>
        <Row label="Theme">
          <button
            onClick={() => s.setTheme(s.theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-ink-600 text-sm hover:border-ink-400"
          >
            {s.theme === 'dark' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
            {s.theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </Row>
        <Row label="Autoplay" note="Start playback immediately when you pick a song.">
          <Toggle on={s.autoplay} onChange={s.setAutoplay} label="Autoplay" />
        </Row>
        <Row label="Auto-queue similar" note="When the queue ends, keep the vibe going with similar tracks.">
          <Toggle on={s.autoqueueSimilar} onChange={s.setAutoqueueSimilar} label="Auto-queue similar" />
        </Row>
        <Row label="Keep screen on in player" note="Holds a screen wake lock while the full-screen player is open and playing.">
          <Toggle on={s.keepScreenOn} onChange={s.setKeepScreenOn} label="Keep screen on in player" />
        </Row>
        <Row label="App version" note={isNativePlatform() ? 'Checks the website for a newer signed APK.' : 'Web version updates automatically on deploy.'}>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-300 tabular-nums">v{__APP_VERSION__}</span>
            {isNativePlatform() && (
              <button
                onClick={() =>
                  void checkForUpdate().then((u) => {
                    if (u) useUpdateStore.getState().setInfo(u);
                    else toast('You’re on the latest version');
                  })
                }
                className="px-4 py-2 rounded-full border border-ink-600 text-sm hover:border-ink-400"
              >
                Check for updates
              </button>
            )}
          </div>
        </Row>
        {!isNativePlatform() && (
          <Row label="Keyboard shortcuts" note="Space, arrows, N/P, M, S, R, F — or press ? anywhere.">
            <button
              onClick={() => window.dispatchEvent(new Event('vinax:shortcuts'))}
              className="px-4 py-2 rounded-full border border-ink-600 text-sm hover:border-ink-400"
            >
              View
            </button>
          </Row>
        )}
        <Row label="Audio quality" note="Picks the closest available stream; falls back automatically.">
          <div className="flex gap-1.5">
            {(['low', 'medium', 'high'] as AudioQualityPref[]).map((q) => (
              <Chip key={q} active={s.audioQuality === q} onClick={() => s.setAudioQuality(q)}>
                {q}
              </Chip>
            ))}
          </div>
        </Row>
      </Section>

      <Section title="Recommendations">
        <Row label="Intensity" note="Low = mostly popular/trending. High = strongly personalized.">
          <div className="flex items-center gap-2">
            <input
              type="range"
              aria-label="Recommendation intensity"
              min={0}
              max={1}
              step={0.1}
              value={s.recommendationIntensity}
              onChange={(e) => s.setRecommendationIntensity(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-xs text-ink-400 w-8 tabular-nums">{Math.round(s.recommendationIntensity * 100)}%</span>
          </div>
        </Row>
        <Row label="Preferred languages" note="Pinned languages get boosted everywhere.">
          <div className="flex flex-wrap gap-1.5 max-w-xs justify-end">
            {LANGUAGES.slice(0, 8).map((l) => (
              <Chip key={l.id} active={s.pinnedLanguages.includes(l.id)} onClick={() => s.togglePinnedLanguage(l.id)}>
                {l.label}
              </Chip>
            ))}
          </div>
        </Row>
        <Row label="Muted languages" note="Never recommended. Manage all on the Languages page.">
          <div className="flex flex-wrap gap-1.5 max-w-xs justify-end">
            {LANGUAGES.slice(0, 8).map((l) => (
              <Chip key={l.id} active={s.mutedLanguages.includes(l.id)} tone="danger" onClick={() => s.toggleMutedLanguage(l.id)}>
                {l.label}
              </Chip>
            ))}
          </div>
        </Row>
      </Section>

      {isNativePlatform() && (
        <Section title="Playback Notification">
          <Row
            label="Media controls engine"
            note={mediaSessionAvailable() ? 'Native media session plugin is active in this build.' : 'Plugin missing from this build — reinstall the latest APK.'}
          >
            <span className={mediaSessionAvailable() ? 'text-tide-400 text-sm font-semibold' : 'text-red-300 text-sm font-semibold'}>
              {mediaSessionAvailable() ? 'OK' : 'Missing'}
            </span>
          </Row>
          <Row
            label="Notification permission"
            note={
              notifStatus === 'granted'
                ? 'Granted — the playback notification appears while music plays.'
                : 'Required on Android 13+. If "Request" does nothing, enable notifications for VinaX in Android Settings → Apps.'
            }
          >
            <div className="flex items-center gap-2">
              <span className={notifStatus === 'granted' ? 'text-tide-400 text-sm font-semibold' : 'text-red-300 text-sm font-semibold'}>
                {notifStatus ?? '…'}
              </span>
              {notifStatus !== 'granted' && (
                <button
                  onClick={() => void ensureNotificationPermission().then(setNotifStatus)}
                  className="px-4 py-2 rounded-full border border-ink-600 text-sm hover:border-ink-400"
                >
                  Request
                </button>
              )}
            </div>
          </Row>
          <Row label="Notification self-test" note="Pushes a 6-second test card to the system — if it appears in your notification shade, the pipeline works.">
            <button
              onClick={() =>
                void runNotificationSelfTest().then((ok) =>
                  toast(ok ? 'Test sent — check your notification shade' : 'Test failed — see log below'),
                )
              }
              className="px-4 py-2 rounded-full border border-ink-600 text-sm hover:border-ink-400"
            >
              Run test
            </button>
          </Row>
          <div className="py-3">
            <p className="text-sm font-medium mb-1.5">Native call log (newest first)</p>
            <div className="rounded-xl bg-ink-900/70 border border-ink-700 p-3 space-y-1 max-h-44 overflow-y-auto">
              {getMediaSessionLog().length === 0 && (
                <p className="text-xs text-ink-400">No calls yet — play a song, then reopen Settings.</p>
              )}
              {getMediaSessionLog().map((e, i) => (
                <p key={i} className="text-[11px] font-mono">
                  <span className={e.ok ? 'text-tide-400' : 'text-red-300'}>{e.ok ? 'OK ' : 'ERR'}</span>{' '}
                  <span className="text-ink-200">{e.call}</span>
                  {e.detail && <span className="text-red-300/80 block pl-7 break-all">{e.detail}</span>}
                </p>
              ))}
            </div>
            <p className="text-[11px] text-ink-500 mt-1.5">
              If a red ERR appears here, screenshot this panel — it names the exact Android failure.
            </p>
          </div>
        </Section>
      )}

      <Section title="Region & Privacy">
        <Row
          label="Allow region inference"
          note={`Coarse country only — from Cloudflare's edge country header or your browser locale/timezone. Your IP is never stored. Current: ${region ? `${region.country ?? 'unknown'} (${region.source})` : 'unknown'}.`}
        >
          <Toggle on={s.allowRegionInference} onChange={s.setAllowRegionInference} label="Allow region inference" />
        </Row>
        <Row label="Country override">
          <select
            aria-label="Country override"
            value={s.manualCountry ?? ''}
            onChange={(e) => s.setManualCountry(e.target.value || null)}
            className="bg-ink-800 border border-ink-600 rounded-xl px-3 py-2 text-sm"
          >
            <option value="">Auto-detect</option>
            {COUNTRIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </Row>
        <Row label="Region override">
          <select
            aria-label="Region override"
            value={s.manualRegionLabel ?? ''}
            onChange={(e) => s.setManualRegionLabel(e.target.value || null)}
            className="bg-ink-800 border border-ink-600 rounded-xl px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.label}>{r.label}</option>
            ))}
          </select>
        </Row>
      </Section>

      <Section title="Your Data">
        <Row label="Export profile & settings" note="Portable JSON of all local data — favorites, history, profile, preferences.">
          <button onClick={downloadProfileExport} className="px-4 py-2 rounded-full border border-ink-600 text-sm hover:border-ink-400">Export</button>
        </Row>
        <Row label="Import profile & settings">
          <>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const ok = importProfileJson(await f.text());
                  if (!ok) window.alert('Invalid Tarang export file.');
                }
              }}
            />
            <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-full border border-ink-600 text-sm hover:border-ink-400">Import</button>
          </>
        </Row>
        <Row label="Clear history"><button onClick={clearHistory} className="px-4 py-2 rounded-full border border-ink-600 text-sm hover:border-red-400 hover:text-red-300">Clear</button></Row>
        <Row label="Clear favorites"><button onClick={clearFavorites} className="px-4 py-2 rounded-full border border-ink-600 text-sm hover:border-red-400 hover:text-red-300">Clear</button></Row>
        <Row label="Clear queue"><button onClick={clearQueue} className="px-4 py-2 rounded-full border border-ink-600 text-sm hover:border-red-400 hover:text-red-300">Clear</button></Row>
        <Row label="Clear cached metadata" note="Drops the in-memory API cache; data refetches on demand.">
          <button onClick={clearCachedMetadata} className="px-4 py-2 rounded-full border border-ink-600 text-sm hover:border-red-400 hover:text-red-300">Clear</button>
        </Row>
        <Row label="Clear personalization profile" note="Erases taste profile + event log. Favorites stay.">
          <button onClick={() => void clearPersonalization()} className="px-4 py-2 rounded-full border border-ink-600 text-sm hover:border-red-400 hover:text-red-300">Clear</button>
        </Row>
        <Row label="Reset app state" note="Erases everything VinaX stores on this device and reloads.">
          <button
            onClick={() => window.confirm('Erase ALL local VinaX data?') && void resetAppState()}
            className="px-4 py-2 rounded-full bg-red-500/15 border border-red-500/50 text-red-300 text-sm font-semibold hover:bg-red-500/25"
          >
            Reset
          </button>
        </Row>
      </Section>

      <p className="text-xs text-ink-500 leading-relaxed mb-8">
        Privacy: VinaX has no accounts and no user backend. Favorites, history, queue, settings, and
        your taste profile exist only in this browser/app. Region awareness uses, at most, a coarse
        country code from Cloudflare’s edge or your browser locale — raw IP addresses are never read
        by the app and never stored. Recommendations are computed locally with no external AI service.
      </p>
    </div>
  );
}
