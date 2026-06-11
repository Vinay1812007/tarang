import { isNativePlatform } from '@/services/native';

export interface UpdateInfo {
  latest: string;
  current: string;
  apkUrl: string;
}

const MANIFEST_URL = 'https://ai.sirimillavinay.online/version.json';

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
  try {
    const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string; apk?: string };
    if (!data.version || !data.apk) return null;
    if (newer(data.version, __APP_VERSION__)) {
      return { latest: data.version, current: __APP_VERSION__, apkUrl: data.apk };
    }
    return null;
  } catch {
    return null;
  }
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
  const res = await CapacitorHttp.get({
    url: apkUrl,
    responseType: 'blob', // returns base64 in res.data
    headers: { Accept: 'application/octet-stream' },
  });
  if (res.status !== 200 || typeof res.data !== 'string' || res.data.length < 1000) {
    throw new Error(`Download failed (HTTP ${res.status})`);
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
