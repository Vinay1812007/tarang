/** Share an in-app route via Web Share API with clipboard fallback. */
export async function shareLink(path: string, title: string): Promise<'shared' | 'copied' | 'failed'> {
  const url = `${window.location.origin}${path}`;
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return 'shared';
    }
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
