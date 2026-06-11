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
