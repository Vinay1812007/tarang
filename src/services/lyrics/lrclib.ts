/**
 * LRCLIB (lrclib.net) — open, keyless lyrics database with synced (LRC)
 * lyrics. Used as the "real lyrics" source with upstream-wrapper lyrics as
 * fallback. Public CORS-enabled API; we send only track title/artist/duration.
 */
export interface LrcLine {
  /** Seconds from track start. */
  t: number;
  text: string;
}

export interface LyricsResult {
  plain: string | null;
  synced: LrcLine[] | null;
  source: 'lrclib' | 'upstream';
}

const BASE = 'https://lrclib.net/api';

interface LrclibRecord {
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
  instrumental?: boolean;
}

export function parseLrc(lrc: string): LrcLine[] {
  const out: LrcLine[] = [];
  for (const raw of lrc.split('\n')) {
    const matches = [...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    if (!matches.length) continue;
    const text = raw.replace(/\[[^\]]*\]/g, '').trim();
    for (const m of matches) {
      const min = Number(m[1]);
      const sec = Number(m[2]);
      const frac = m[3] ? Number(m[3].padEnd(3, '0')) / 1000 : 0;
      out.push({ t: min * 60 + sec + frac, text });
    }
  }
  return out.sort((a, b) => a.t - b.t).filter((l, i, arr) => l.text || i === arr.length - 1 || arr[i + 1].t - l.t > 1);
}

async function getJson(url: string, timeoutMs = 6000): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

function toResult(rec: LrclibRecord | null): LyricsResult | null {
  if (!rec) return null;
  const synced = rec.syncedLyrics ? parseLrc(rec.syncedLyrics) : null;
  const plain = rec.plainLyrics?.trim() || null;
  if (!synced?.length && !plain) return null;
  return { plain, synced: synced?.length ? synced : null, source: 'lrclib' };
}

export async function fetchLrclibLyrics(
  track: string,
  artist: string,
  duration: number | null,
): Promise<LyricsResult | null> {
  const params = new URLSearchParams({ track_name: track, artist_name: artist });
  if (duration) params.set('duration', String(Math.round(duration)));

  // Exact match first.
  const exact = (await getJson(`${BASE}/get?${params}`)) as LrclibRecord | null;
  const exactResult = toResult(exact);
  if (exactResult) return exactResult;

  // Fuzzy search fallback.
  const q = new URLSearchParams({ track_name: track, artist_name: artist });
  const list = (await getJson(`${BASE}/search?${q}`)) as LrclibRecord[] | null;
  if (Array.isArray(list)) {
    const withSynced = list.find((r) => r.syncedLyrics) ?? list.find((r) => r.plainLyrics);
    return toResult(withSynced ?? null);
  }
  return null;
}
