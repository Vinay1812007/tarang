/**
 * Host-level routing:
 *   update.vinax.sirimillavinay.online/*  → always 302 to the newest signed
 *   APK (GitHub Releases "latest" asset — CI publishes every build there, so
 *   this link never goes stale and nothing needs manual uploading).
 * All other hosts fall through to the app / other functions.
 */
const LATEST_APK = 'https://github.com/Vinay1812007/VinaX/releases/latest/download/vinax.apk';

export const onRequest = async (context: {
  request: Request;
  next: () => Promise<Response>;
}): Promise<Response> => {
  const host = new URL(context.request.url).hostname.toLowerCase();
  if (host.startsWith('update.')) {
    return Response.redirect(LATEST_APK, 302);
  }
  return context.next();
};
