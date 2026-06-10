<p align="center">
  <img src="public/icons/icon.svg" width="84" alt="Tarang" />
</p>

<h1 align="center">Tarang</h1>
<p align="center"><em>Waves of music, tuned to you.</em><br/>
A premium, <strong>no-login</strong> music streaming app — web (Cloudflare Pages) + Android (Capacitor) — with fully <strong>local, explainable</strong> personalization.</p>

---

## Brand story

*Tarang* (तरंग) means **wave**. The premise: a music service should feel personal without demanding an identity. There is no login, no signup, no OTP, no account — your taste profile is a small, transparent, time-decayed model that lives only on your device. The recommendations that feel like "AI" are deterministic local heuristics you can inspect on the **Taste Profile** page.

**Design identity (original — nothing borrowed from existing music products):**

| Token | Direction |
|---|---|
| Surfaces | `ink` scale — deep blue-black (#0b0e14) dark-first |
| Accent | `ember` — warm stage-light amber (#f0922e) |
| Support | `tide` — teal for data/positive states (#2dd4bf) |
| Type | System sans stack, tight tracking on display sizes |
| Icon | Three sound-waves cresting like water + a note head |
| Spacing | 4px base grid, generous radii (`rounded-xl/2xl/3xl`) |
| Motion | Short fade-ups, equalizer pulse on the playing track, no theatrical animation |
| Tone | Calm, confident, honest (explanations on every personalized shelf) |

## Feature highlights

- **4-source API orchestration** — health-scored endpoint ranking (success rate × latency EMA), per-request timeouts, multi-pass fallback with backoff, 3-strike circuit breaker with cooldown, per-wrapper path-dialect probing, and full response normalization. One dead provider never breaks the UI.
- **Local recommendation engine** — no external AI APIs. Candidates from related-tracks, favorite artists, language trending, and rediscovery; scored by language/artist affinity, popularity, low-skip rate, freshness, novelty, and a repetition guard; blended by profile confidence × user-set intensity. Every shelf carries an honest explanation ("Because you played…", "Trending in your languages").
- **Privacy-safe region awareness** — manual override → Cloudflare edge country (Pages Function, never the IP) → browser locale/timezone. Only a coarse country/region label is ever stored.
- **Language-aware everything** — pin/mute languages, multi-language weights, language-affinity search re-ranking, Daily/Language/Regional mixes across a 14-language taxonomy.
- **Real player engine** — queue, shuffle, repeat one/all, seek, volume/mute, playback speed, sleep timer, Media Session (lockscreen controls), multi-quality source fallback on bad CDN URLs, optional similar-track auto-queue.
- **23 real routes**, route-split, with persistent player bar, skeletons, empty/error states, keyboard shortcuts, PWA manifest, dark/light themes.

## Repository layout

```
├─ public/                  # original assets, _redirects (SPA), manifest
├─ functions/api/geo.ts     # Cloudflare Pages Function — coarse country only
├─ .github/workflows/       # buildapk.yml (APK), ci.yml (lint+type+build)
├─ src/
│  ├─ pages/                # 22 route components (23 routes incl. redirect)
│  ├─ router/  layouts/  components/  hooks/  utils/  types/  constants/
│  ├─ features/             # per-domain data hooks (search, home, mixes, …)
│  ├─ services/
│  │  ├─ api/               # orchestrator, health registry, normalizers, endpoints
│  │  ├─ audio/             # HTMLAudioElement engine w/ source fallback
│  │  ├─ media-session/     # lockscreen / hardware-key integration
│  │  ├─ storage/           # versioned localStorage + IndexedDB event log
│  │  ├─ personalization/   # taste profile, event updater
│  │  ├─ location/          # edge / browser / manual region inference
│  │  └─ recommendation/    # candidates → scoring → explanations → mixes
│  └─ store/                # zustand: player, settings, library, history, search
```

## Local setup

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production build → dist/
npm run preview    # serve the production build
```

Node 20+ recommended.

## Environment variables

No secrets exist anywhere in this project. Optional overrides (`.env`, see `.env.example`):

| Var | Purpose |
|---|---|
| `VITE_API_BASES` | Comma-separated list overriding the 4 built-in API bases |
| `VITE_APP_NAME` | Display-name override |

## Cloudflare Pages deployment

1. Push the repo to GitHub and create a Cloudflare Pages project from it.
2. Build settings: **Build command** `npm run build` · **Output directory** `dist`.
3. SPA routing is handled by `public/_redirects` (`/* → /index.html 200`).
4. `functions/api/geo.ts` deploys automatically as a Pages Function. It reads `CF-IPCountry` / `request.cf.region` **on the edge** and returns only `{country, region}` — the IP never reaches the client and is never stored.
5. **Local dev:** `/api/geo` doesn't exist under `vite dev`, so the client silently falls back to browser locale/timezone inference. To test the function locally: `npx wrangler pages dev dist` after a build.

## Android build (Capacitor)

The `android/` folder is **generated, not committed** (see `.gitignore`) — regenerate any time:

```bash
npm run build
npx cap add android      # first time only
npx cap sync android     # after every web build
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

Or use the shortcut: `npm run android:debug`.

- Requires JDK 17 and the Android SDK. Capacitor 6 targets **SDK 34 (Android 14)** — `compileSdkVersion`/`targetSdkVersion` 34, `minSdkVersion` 22 — suitable for current Play requirements. Adjust in `android/variables.gradle` after generation if needed.
- App id `app.tarang.music`, scheme `https` (cleartext disabled).

## GitHub Actions

- **`ci.yml`** — on every push/PR: `npm ci` → lint → typecheck → build → uploads `dist` artifact.
- **`buildapk.yml`** — on push to `main` or manual dispatch: builds the web app, generates + syncs the Android project, builds **`app-debug.apk`**, fails loudly if the APK is missing, and uploads it as artifact `tarang-debug-apk`. If you add signing secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) it additionally builds and uploads a signed release APK. Without secrets, the release steps are skipped cleanly.

## Privacy model

| Data | Where | Notes |
|---|---|---|
| Favorites, queue, history, settings, search history | `localStorage` (versioned keys, migration hook in `services/storage/local.ts`) | export/import as JSON in Settings |
| Listen-event log (analytics for Taste Profile) | IndexedDB | clearable; drops silently in private mode |
| Taste profile (affinities, decay, confidence) | `localStorage` | deterministic; resettable |
| Region | coarse `{country, regionLabel, source}` only | **raw IP is never read by the client and never stored** |
| Account data | — | none exists |

**Devtools deterrence is cosmetic, not security**: production builds disable source maps and intercept the obvious devtools shortcuts on media surfaces. There are no client secrets to protect, and we make no client-side secrecy claims. Accessibility (selection, screen readers, keyboard nav) is not impaired.

**Content**: streaming playback and transient caching only — no DRM circumvention, no persistent downloading of copyrighted media, no third-party trademarks or assets.

## Upstream reality

The four wrappers (`saavn.dev`, `saavn.sumit.co`, `nepotuneapi.vercel.app`, `jiosaavn-api-privatecv8.b4a.run`) differ in shape, completeness, latency, and uptime. The orchestrator (`src/services/api/client.ts`) treats all of them as unreliable: every payload passes a validate-or-fall-through normalizer, shape mismatches fall through to the next path dialect/provider, and hard failures feed the health registry + circuit breaker. Trending/charts endpoints are the least consistent upstream, so discovery shelves are sourced through deterministic language/mood **seed searches** (`src/constants/seeds.ts`) re-ranked locally — degradation is graceful by construction.

## Testing checklist

**Smoke**
- [ ] `npm run dev` boots; Home renders hero + shelves; no console errors
- [ ] Play a song from a shelf → player bar appears, audio plays, art/title correct

**API fallback / outage**
- [ ] DevTools → block `saavn.dev` → search still works (next provider, slower first hit)
- [ ] Block all 4 bases → search/home show retryable error states; favorites/history/queue/settings still browse; no crash
- [ ] `/cache-info` shows failure counts and cooldown state for blocked providers

**Search**
- [ ] Typing debounces (~350ms); URL mirrors to `/search/<query>`; deep-link to `/search/arijit` works
- [ ] Tabs (Songs/Albums/Artists/Playlists) populate; recent-search chips persist across reload
- [ ] With Hindi pinned, Hindi versions rank above same-title others

**Player**
- [ ] Pause/resume, seek, next/prev, shuffle, repeat-one (track restarts), repeat-all (queue wraps)
- [ ] Volume + mute persist across reload; queue survives reload and resumes on play
- [ ] Kill one audio URL via devtools blocking → engine falls back to alternate quality without user action
- [ ] Keyboard: Space/←/→/N/P/M/S/R/F all work outside inputs
- [ ] Lockscreen / media-keys control playback (Media Session)

**Navigation / responsive**
- [ ] All 23 routes load directly (hard refresh on each — SPA redirects OK)
- [ ] 360px, 768px, 1280px layouts: bottom-nav vs sidebar, player bar always reachable; unknown URL → 404 page

**Location / language**
- [ ] On Cloudflare: `/api/geo` returns your country; Regions page shows "edge inferred"
- [ ] Local dev: falls back to "browser inferred"; manual country override wins everywhere and survives reload
- [ ] Muting a language removes it from Made For You within one refresh

**Recommendations / cold start**
- [ ] Fresh profile (or after reset): Made For You shows trending-leaning shelves seeded from browser language within seconds
- [ ] After ~10 plays + a few favorites in one language: Daily Mix for that language appears with explanation labels
- [ ] Skipping several songs of an artist demotes them; replays appear in Taste Profile "Most Replayed"

**Privacy / data**
- [ ] Each "Clear …" button in Settings empties exactly its store (verify in devtools → Application)
- [ ] Export → Reset app state → Import restores favorites/profile/settings
- [ ] Search localStorage/IndexedDB for your IP — it appears nowhere

**Builds**
- [ ] `npm run build` clean; `npx wrangler pages dev dist` serves with `/api/geo` live
- [ ] `buildapk.yml` produces installable `app-debug.apk`; app boots on Android 14 device/emulator and streams

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Every shelf errors | All 4 wrappers down or blocked (corporate DNS?). Set `VITE_API_BASES` to a wrapper you host yourself. |
| Songs load but won't play | CDN audio URLs expire/region-block. Engine retries alternates automatically; if all fail it auto-skips. Try another song/provider. |
| `/api/geo` 404 in dev | Expected — Pages Functions don't run under `vite dev`. Browser inference takes over. |
| Region wrong | Settings → Country override (manual always wins). |
| APK job fails at `cap add android` | Ensure Capacitor versions in `package.json` are in sync (`@capacitor/core` = `@capacitor/cli` major). |
| Gradle OOM in CI | Add `org.gradle.jvmargs=-Xmx3g` to `android/gradle.properties` (post-generation) or via a CI `sed` step. |
| Stale recommendations | They memoize 10 min per profile state; Settings → Clear cached metadata, or just keep listening. |
| Hindi titles show `&#039;` etc. | Normalizer decodes common entities; report stragglers — add to `entityMap` in `src/utils/format.ts`. |

## Recommended commit plan

```
1. chore: scaffold vite+ts+tailwind, configs, brand assets
2. feat(types,constants): shared models, language/region taxonomy, seeds
3. feat(api): orchestrator with health scoring + circuit breaker + normalizers
4. feat(storage): versioned localStorage, IndexedDB event log
5. feat(personalization): taste profile, decay, event updater
6. feat(location): edge/browser/manual region inference (privacy-safe)
7. feat(recommendation): candidates, scoring, explanations, mixes, engine
8. feat(player): audio engine, media session, player store
9. feat(shell): router, layout, player bar, navigation, components
10. feat(pages): home, discover, search, entity pages
11. feat(pages): library, queue, now-playing, taste-profile, settings, misc
12. feat(edge): cloudflare geo function + SPA redirects
13. ci: ci.yml + buildapk.yml
14. docs: README, testing checklist, deployment guides
```

## Next-step upgrade ideas

- Dynamic color extraction from artwork (OffscreenCanvas average-color → CSS var theming of Now Playing)
- Service worker for full PWA install + offline app-shell (workbox, careful with stream URLs)
- Crossfade via a second Audio element + gain ramps (Web Audio API)
- Synced-lyrics rendering when an upstream exposes timestamps
- Drag-to-reorder queue (pointer events; keep keyboard alternative)
- Local Web Worker for recommendation scoring at larger history sizes
- Capacitor `@capacitor/filesystem` transient artwork cache for the Android shell
- Self-hosted wrapper instance as a 5th, owned API base for uptime control
- Opt-in import of a listening backup from another device via file share

---

**License note:** code is yours to license as you wish (MIT suggested). Audio content remains the property of its rights holders; Tarang is a streaming client over community APIs and implements no circumvention.
