import { useToastStore } from '@/store/toastStore';

export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-40 md:bottom-24 inset-x-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="px-4 py-2 rounded-full bg-ink-700/95 backdrop-blur border border-ink-600 text-sm text-ink-100 shadow-xl animate-fade-up"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
