/**
 * Average-color extraction from artwork for dynamic player theming.
 * CORS-dependent: if the CDN doesn't send CORS headers, canvas readback
 * throws and we quietly fall back to the default ink backdrop.
 */
const cache = new Map<string, string | null>();

export function extractAverageColor(url: string): Promise<string | null> {
  if (cache.has(url)) return Promise.resolve(cache.get(url) ?? null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no ctx');
        ctx.drawImage(img, 0, 0, 16, 16);
        const data = ctx.getImageData(0, 0, 16, 16).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
        // Darken toward the ink palette so text stays readable.
        const color = `rgb(${Math.round((r / n) * 0.45)}, ${Math.round((g / n) * 0.45)}, ${Math.round((b / n) * 0.45)})`;
        cache.set(url, color);
        resolve(color);
      } catch {
        cache.set(url, null);
        resolve(null);
      }
    };
    img.onerror = () => {
      cache.set(url, null);
      resolve(null);
    };
    img.src = url;
  });
}
