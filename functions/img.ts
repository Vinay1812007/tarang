/**
 * Same-origin image proxy so canvas exports (share-as-image) aren't blocked by
 * the upstream CDN's missing CORS headers. Server-side fetch has no CORS
 * restriction; we re-emit the bytes with Access-Control-Allow-Origin. Limited
 * to known artwork hosts to avoid being an open proxy.
 */
const ALLOWED = /(^|\.)(saavncdn\.com|jiosaavn\.com|akamaized\.net)$/i;

export const onRequestGet = async (context: { request: Request }): Promise<Response> => {
  const target = new URL(context.request.url).searchParams.get('url');
  if (!target) return new Response('missing url', { status: 400 });
  let host: string;
  try {
    host = new URL(target).hostname;
  } catch {
    return new Response('bad url', { status: 400 });
  }
  if (!ALLOWED.test(host)) return new Response('forbidden host', { status: 403 });
  const upstream = await fetch(target, { cf: { cacheTtl: 86400, cacheEverything: true } } as RequestInit);
  if (!upstream.ok) return new Response('upstream error', { status: 502 });
  return new Response(upstream.body, {
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'image/jpeg',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=86400',
    },
  });
};
