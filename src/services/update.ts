import { isNativePlatform } from '@/services/native';

export interface UpdateInfo {
  latest: string;
  current: string;
  apkUrl: string;
}

// The site may be served from either hostname; first reachable wins.
const MANIFEST_HOSTS = [
  'https://vinax.sirimillavinay.online',
  'https://ai.sirimillavinay.online',
];

/** Stable always-latest APK locations, in preference order. */
export const APK_URLS = [
  'https://update.vinax.sirimillavinay.online/vinax.apk',
  'https://github.com/Vinay1812007/VinaX/releases/latest/download/vinax.apk',
];

function newer(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false;
  }
  return false;
}

/**
 * Android update check: the website always carries the newest version (it
 * deploys from every commit), so the installed app compares itself against
 * the site's version.json and links to the latest signed APK release.
 */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  if (!isNativePlatform()) return null;
  for (const host of MANIFEST_HOSTS) {
    try {
      const res = await fetch(`${host}/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) continue;
      const data = (await res.json()) as { version?: string; apk?: string };
      if (!data.version) continue;
      if (newer(data.version, __APP_VERSION__)) {
        return { latest: data.version, current: __APP_VERSION__, apkUrl: data.apk ?? APK_URLS[0] };
      }
      return null;
    } catch {
      /* try next host */
    }
  }
  return null;
}

export type InstallPhase = 'downloading' | 'installing';

/**
 * Fully in-app update: downloads the signed APK with native HTTP (no browser,
 * no CORS), writes it to app cache, and hands it to the Android package
 * installer. Requires REQUEST_INSTALL_PACKAGES (added in CI manifest patch) —
 * Android shows its own "allow updates from this app" consent the first time.
 */
export async function downloadAndInstall(
  apkUrl: string,
  onPhase: (phase: InstallPhase) => void,
): Promise<void> {
  const [{ CapacitorHttp }, { Filesystem, Directory }, { FileOpener }] = await Promise.all([
    import('@capacitor/core'),
    import('@capacitor/filesystem'),
    import('@capacitor-community/file-opener'),
  ]);
  onPhase('downloading');
  // Try the update domain first, then fall back to GitHub directly.
  const candidates = [...new Set([apkUrl, ...APK_URLS])];
  let res: { status: number; data: unknown } | null = null;
  let lastError = '';
  for (const url of candidates) {
    try {
      res = await CapacitorHttp.get({
        url,
        responseType: 'blob', // returns base64 in res.data
        headers: { Accept: 'application/octet-stream' },
      });
      if (res.status === 200 && typeof res.data === 'string' && res.data.length > 1000) break;
      lastError = `HTTP ${res.status}`;
      res = null;
    } catch (err) {
      lastError = String(err);
      res = null;
    }
  }
  if (!res || typeof res.data !== 'string') {
    throw new Error(`Download failed (${lastError || 'no source reachable'})`);
  }
  await Filesystem.writeFile({
    path: 'vinax-update.apk',
    data: res.data,
    directory: Directory.Cache,
  });
  const { uri } = await Filesystem.getUri({ path: 'vinax-update.apk', directory: Directory.Cache });
  onPhase('installing');
  await FileOpener.open({ filePath: uri, contentType: 'application/vnd.android.package-archive' });
}
