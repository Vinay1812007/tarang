import type { ImageVariant } from '@/types';

/** Original inline placeholder artwork — no third-party assets. */
export const FALLBACK_ART =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#151a26"/><path d="M16 80 Q32 56 48 80 T80 80 T112 80" fill="none" stroke="#f0922e" stroke-width="7" stroke-linecap="round"/><path d="M16 96 Q32 78 48 96 T80 96 T112 96" fill="none" stroke="#2dd4bf" stroke-width="5" stroke-linecap="round" opacity="0.8"/></svg>`,
  );

function qualityPx(q: string): number {
  const m = q.match(/(\d+)x(\d+)/);
  return m ? Number(m[1]) : 0;
}

/** Pick the smallest image that is at least `min` px, else the largest. */
export function bestImage(images: ImageVariant[] | undefined, min = 300): string {
  if (!images || images.length === 0) return FALLBACK_ART;
  const sorted = [...images].sort((a, b) => qualityPx(a.quality) - qualityPx(b.quality));
  const fit = sorted.find((v) => qualityPx(v.quality) >= min);
  return (fit ?? sorted[sorted.length - 1]).url || FALLBACK_ART;
}
