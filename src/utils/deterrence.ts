/**
 * Cosmetic devtools deterrence. THIS IS NOT SECURITY. It mildly discourages
 * casual inspection in production builds and is fully documented in README.
 * There are no secrets in this client to protect. Accessibility note: we do
 * not block text selection, screen readers, or keyboard navigation.
 */
export function installDeterrence(): void {
  if (import.meta.env.DEV) return;
  document.addEventListener('contextmenu', (e) => {
    const el = e.target as HTMLElement;
    // Only deter on media surfaces, never on inputs/text content.
    if (el.closest('[data-deter-context]')) e.preventDefault();
  });
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
    const combo = (e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase());
    if (combo || e.key === 'F12') e.preventDefault();
  });
}
