/** Same-origin shortcut: /apk → newest signed APK, on any domain. */
const LATEST_APK = 'https://github.com/Vinay1812007/VinaX/releases/latest/download/vinax.apk';

export const onRequestGet = async (): Promise<Response> => Response.redirect(LATEST_APK, 302);
