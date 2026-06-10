import type { ReactNode } from 'react';
import { WaveIcon } from './Icons';

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <WaveIcon className="w-12 h-12 text-ink-500" />
      <p className="text-xl font-semibold">{title}</p>
      <p className="text-sm text-ink-300 max-w-sm">{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ retry, message }: { retry?: () => void; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <WaveIcon className="w-12 h-12 text-ink-500" />
      <p className="text-xl font-semibold">Couldn’t reach the music servers</p>
      <p className="text-sm text-ink-300 max-w-sm">
        {message ?? 'All upstream sources are unreachable right now. This usually resolves itself — check your connection or try again.'}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="px-5 py-2.5 rounded-full bg-ember-500 text-ink-950 font-semibold hover:bg-ember-400"
        >
          Retry
        </button>
      )}
    </div>
  );
}
