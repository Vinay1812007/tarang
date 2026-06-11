import { useEffect } from 'react';

export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · VinaX` : 'VinaX';
    return () => {
      document.title = 'VinaX';
    };
  }, [title]);
}
